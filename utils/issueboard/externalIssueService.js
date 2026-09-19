import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getProjectByKey } from './projectService';
import { getIssueByKey, createIssue, setIssueSprint } from './issueService';
import { findOrCreateLabel, attachLabel } from './labelService';
import { createChecklist, addChecklistItem } from './checklistService';
import { uploadAttachmentDirect } from './attachmentService';

const issueKeyPattern = /^([A-Z][A-Z0-9]{1,9})-(\d{1,10})$/;

/**
 * Creates an issue from external API callers (CLI, webhooks, mobile apps, integrations)
 * supporting all fields from the Issueboard workspace:
 * - projectKey (string)
 * - title (string)
 * - issueType (task | story | bug | epic | subtask | feature | improvement | research)
 * - description (markdown string)
 * - priority (highest | high | medium | low | lowest)
 * - assignee (string user name or email)
 * - storyPoints (number)
 * - dueAt (ISO datetime string)
 * - parentIssueKey or parentIssueId
 * - sprintId or sprint: 'active'
 * - statusId or status name ('To do', 'In progress', etc.)
 * - labels: string[]
 * - checklist: (string | { body: string, isComplete?: boolean })[]
 * - attachments: { filename: string, mimeType?: string, base64?: string, buffer?: Buffer }[]
 * - sourceReference: string
 */
export const createExternalIssue = async (input, actor = 'api') => {
  const admin = getIssueboardSupabaseAdmin();
  const projectKey = String(input.projectKey || '')
    .trim()
    .toUpperCase();

  const project = await getProjectByKey(projectKey);
  if (!project) {
    const error = new Error(`Project "${projectKey}" was not found.`);
    error.code = 'PROJECT_NOT_FOUND';
    error.status = 404;
    throw error;
  }

  // 1. Resolve parent issue if provided as parentIssueKey (e.g., "PORT-12")
  let parentIssueId = input.parentIssueId || null;
  if (!parentIssueId && input.parentIssueKey) {
    const match = issueKeyPattern.exec(String(input.parentIssueKey).trim().toUpperCase());
    if (match) {
      const parentIssue = await getIssueByKey(match[1], Number(match[2]));
      if (parentIssue) {
        parentIssueId = parentIssue.id;
      } else {
        const error = new Error(`Parent issue "${input.parentIssueKey}" not found.`);
        error.code = 'PARENT_ISSUE_NOT_FOUND';
        error.status = 400;
        throw error;
      }
    }
  }

  // 2. Resolve target status if provided by name or id
  let targetStatusId = input.statusId || null;
  if (!targetStatusId && input.status) {
    const statusQuery = String(input.status).trim().toLowerCase();
    const { data: matchedStatus } = await admin
      .from('issueboard_statuses')
      .select('id')
      .eq('project_id', project.id)
      .or(`name.ilike.${statusQuery},category.ilike.${statusQuery}`)
      .order('position')
      .limit(1)
      .maybeSingle();
    if (matchedStatus?.id) {
      targetStatusId = matchedStatus.id;
    }
  }

  // 3. Create the base issue
  const issueType = input.issueType || project.defaultIssueType || 'task';
  const priority = input.priority || project.defaultPriority || 'medium';
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim();
  const storyPoints =
    issueType !== 'epic' && input.storyPoints !== undefined && input.storyPoints !== null
      ? Number(input.storyPoints)
      : undefined;

  const created = await createIssue(
    {
      projectKey,
      issueType,
      title,
      description,
      priority,
      assignee: input.assignee || null,
      storyPoints,
      dueAt: input.dueAt || undefined,
      parentIssueId: issueType !== 'epic' ? parentIssueId : undefined,
      statusId: targetStatusId || undefined
    },
    actor
  );

  if (!created) {
    throw new Error('Failed to create issue record.');
  }

  const issueNumber = created.issueNumber || Number(created.key.split('-')[1]);

  // 4. Update source to 'api' and record source_reference if provided
  const sourceUpdates = { source: 'api' };
  if (input.sourceReference) {
    sourceUpdates.source_reference = String(input.sourceReference).slice(0, 500);
  }
  await admin.from('issueboard_issues').update(sourceUpdates).eq('id', created.id);

  // 5. Target sprint assignment (sprintId or sprint: 'active')
  if (issueType !== 'epic') {
    let sprintIdToAssign = input.sprintId || null;
    if (!sprintIdToAssign && (input.sprint === 'active' || input.targetSprint === 'active')) {
      const { data: activeSprint } = await admin
        .from('issueboard_sprints')
        .select('id')
        .eq('project_id', project.id)
        .eq('state', 'active')
        .maybeSingle();
      if (activeSprint?.id) {
        sprintIdToAssign = activeSprint.id;
      }
    }

    if (sprintIdToAssign) {
      try {
        await setIssueSprint(projectKey, issueNumber, sprintIdToAssign, actor);
      } catch (sprintErr) {
        console.error('Failed to set sprint for external issue:', sprintErr);
      }
    }
  }

  // 6. Labels: find or create and attach each label
  const createdLabels = [];
  if (Array.isArray(input.labels) && input.labels.length > 0) {
    for (const labelName of input.labels) {
      const cleanName = String(labelName || '').trim();
      if (!cleanName) continue;
      try {
        const label = await findOrCreateLabel(project.id, cleanName, actor);
        if (label?.id) {
          await attachLabel(created.id, label.id, actor);
          createdLabels.push(label);
        }
      } catch (labelErr) {
        console.error(`Failed to attach label "${cleanName}":`, labelErr);
      }
    }
  }

  // 7. Checklists: create checklist and add items
  const createdChecklists = [];
  const checklistItems = Array.isArray(input.checklist)
    ? input.checklist
    : Array.isArray(input.checklists)
      ? input.checklists
      : [];

  if (checklistItems.length > 0) {
    try {
      const checklist = await createChecklist(projectKey, issueNumber, 'Checklist', actor);
      if (checklist?.id) {
        const items = [];
        for (const it of checklistItems) {
          const body = typeof it === 'string' ? it.trim() : String(it?.body || '').trim();
          const isComplete = typeof it === 'object' ? Boolean(it?.isComplete) : false;
          if (!body) continue;
          const addedItem = await addChecklistItem(checklist.id, body, actor);
          if (isComplete && addedItem?.id) {
            await admin.from('issueboard_checklist_items').update({ is_complete: true }).eq('id', addedItem.id);
            items.push({ ...addedItem, isComplete: true });
          } else if (addedItem) {
            items.push(addedItem);
          }
        }
        createdChecklists.push({ ...checklist, items });
      }
    } catch (checkErr) {
      console.error('Failed to create checklist for external issue:', checkErr);
    }
  }

  // 8. Attachments: process direct file/image uploads
  const createdAttachments = [];
  if (Array.isArray(input.attachments) && input.attachments.length > 0) {
    for (const att of input.attachments) {
      try {
        let buffer = null;
        if (Buffer.isBuffer(att.buffer)) {
          buffer = att.buffer;
        } else if (typeof att.base64 === 'string') {
          const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
          buffer = Buffer.from(cleanBase64, 'base64');
        } else if (typeof att.data === 'string') {
          const cleanBase64 = att.data.replace(/^data:[^;]+;base64,/, '');
          buffer = Buffer.from(cleanBase64, 'base64');
        }

        if (!buffer || buffer.length === 0) continue;

        const filename = att.filename || att.originalFilename || 'attachment';
        let mimeType = att.mimeType || att.contentType || 'application/octet-stream';
        if (mimeType === 'application/octet-stream') {
          const ext = filename.split('.').pop()?.toLowerCase();
          if (ext === 'png') mimeType = 'image/png';
          else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
          else if (ext === 'webp') mimeType = 'image/webp';
          else if (ext === 'gif') mimeType = 'image/gif';
          else if (ext === 'pdf') mimeType = 'application/pdf';
          else if (ext === 'json') mimeType = 'application/json';
          else if (ext === 'txt') mimeType = 'text/plain';
          else if (ext === 'zip') mimeType = 'application/zip';
        }

        const result = await uploadAttachmentDirect(
          projectKey,
          issueNumber,
          { originalFilename: filename, mimeType, buffer },
          actor
        );

        if (result?.attachment) {
          createdAttachments.push(result.attachment);
        }
      } catch (attErr) {
        console.error('Failed to upload external attachment:', attErr);
      }
    }
  }

  // 9. Fetch fresh hydrated issue
  const freshIssue = await getIssueByKey(projectKey, issueNumber);
  return {
    ...freshIssue,
    labels: createdLabels.length > 0 ? createdLabels : freshIssue.labels,
    checklists: createdChecklists,
    attachments: createdAttachments
  };
};
