import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getProjectByKey } from './projectService';

const ISSUE_SELECT =
  'id,issue_number,issue_type,title,description,priority,work_state,reporter,assignee,story_points,' +
  'sprint_id,start_at,due_at,completed_at,rank,source,parent_issue_id,archived_at,created_at,updated_at,' +
  'status:issueboard_statuses(id,name,category),' +
  'issueboard_issue_labels(label:issueboard_labels(id,name,background_color,text_color))';

const toIssue = (projectKey) => (row) => ({
  id: row.id,
  key: `${projectKey}-${row.issue_number}`,
  issueNumber: Number(row.issue_number),
  type: row.issue_type,
  title: row.title,
  description: row.description,
  status: row.status ? { id: row.status.id, name: row.status.name, category: row.status.category } : null,
  priority: row.priority,
  workState: row.work_state,
  reporter: row.reporter,
  assignee: row.assignee,
  storyPoints: row.story_points,
  sprintId: row.sprint_id,
  startAt: row.start_at,
  dueAt: row.due_at,
  completedAt: row.completed_at,
  rank: row.rank,
  source: row.source,
  parentIssueId: row.parent_issue_id,
  archivedAt: row.archived_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  labels: (row.issueboard_issue_labels || []).map((entry) => ({
    id: entry.label.id,
    name: entry.label.name,
    backgroundColor: entry.label.background_color,
    textColor: entry.label.text_color
  }))
});

export const listIssues = async ({ projectKey, includeArchived = false }) => {
  const project = await getProjectByKey(projectKey);
  if (!project) return null;

  let query = getIssueboardSupabaseAdmin()
    .from('issueboard_issues')
    .select(ISSUE_SELECT)
    .eq('project_id', project.id)
    .is('deleted_at', null);
  if (!includeArchived) query = query.is('archived_at', null);

  const { data, error } = await query.order('rank');
  if (error) throw error;
  return data.map(toIssue(project.key));
};

export const getIssueByKey = async (projectKey, issueNumber) => {
  const project = await getProjectByKey(projectKey);
  if (!project) return null;

  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_issues')
    .select(ISSUE_SELECT)
    .eq('project_id', project.id)
    .eq('issue_number', issueNumber)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data ? toIssue(project.key)(data) : null;
};

export const createIssue = async (
  { projectKey, issueType, title, description, priority, assignee, storyPoints, dueAt, parentIssueId, statusId },
  actor
) => {
  const admin = getIssueboardSupabaseAdmin();
  const { data, error } = await admin.rpc('issueboard_create_issue', {
    project_key_input: projectKey,
    issue_type_input: issueType,
    title_input: title,
    description_input: description,
    priority_input: priority,
    actor_input: actor,
    assignee_input: assignee ?? null,
    story_points_input: storyPoints ?? null,
    due_at_input: dueAt ?? null,
    parent_issue_id_input: parentIssueId ?? null
  });
  if (error) throw error;

  let targetStatusId = statusId;
  if (!targetStatusId && parentIssueId) {
    // Subtasks default to the project's 'To do' status (category = 'todo')
    const { data: todoStatus } = await admin
      .from('issueboard_statuses')
      .select('id')
      .eq('project_id', data.project_id)
      .eq('category', 'todo')
      .order('position')
      .limit(1)
      .maybeSingle();
    if (todoStatus?.id) targetStatusId = todoStatus.id;
  }

  if (targetStatusId) {
    await admin.from('issueboard_issues').update({ status_id: targetStatusId }).eq('id', data.id);
  }

  return getIssueByKey(projectKey, data.issue_number);
};

export const updateIssue = async (
  projectKey,
  issueNumber,
  { title, description, priority, assignee, statusId, expectedUpdatedAt },
  actor
) => {
  const current = await getIssueByKey(projectKey, issueNumber);
  if (!current) return null;

  const { error } = await getIssueboardSupabaseAdmin().rpc('issueboard_update_issue', {
    issue_id_input: current.id,
    title_input: title,
    description_input: description,
    priority_input: priority,
    assignee_input: assignee ?? null,
    status_id_input: statusId,
    expected_updated_at_input: expectedUpdatedAt,
    actor_input: actor
  });
  if (error) throw error;
  return getIssueByKey(projectKey, issueNumber);
};

export const setIssueSprint = async (projectKey, issueNumber, sprintId, actor) => {
  const current = await getIssueByKey(projectKey, issueNumber);
  if (!current) return null;

  const { error } = await getIssueboardSupabaseAdmin().rpc('issueboard_set_issue_sprint', {
    issue_id_input: current.id,
    sprint_id_input: sprintId ?? null,
    actor_input: actor
  });
  if (error) throw error;
  return getIssueByKey(projectKey, issueNumber);
};

export const setIssueWorkState = async (projectKey, issueNumber, workState, actor) => {
  const current = await getIssueByKey(projectKey, issueNumber);
  if (!current) return null;

  const { error } = await getIssueboardSupabaseAdmin().rpc('issueboard_set_issue_work_state', {
    issue_id_input: current.id,
    work_state_input: workState,
    actor_input: actor
  });
  if (error) throw error;
  return getIssueByKey(projectKey, issueNumber);
};

export const listSubtasks = async (projectKey, issueNumber) => {
  const project = await getProjectByKey(projectKey);
  if (!project) return null;
  const parent = await getIssueByKey(projectKey, issueNumber);
  if (!parent) return null;

  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_issues')
    .select(ISSUE_SELECT)
    .eq('parent_issue_id', parent.id)
    .is('deleted_at', null)
    .order('rank');
  if (error) throw error;
  return data.map(toIssue(project.key));
};

export const setIssueArchived = async (projectKey, issueNumber, archived, actor) => {
  const current = await getIssueByKey(projectKey, issueNumber);
  if (!current) return null;

  const { error } = await getIssueboardSupabaseAdmin().rpc('issueboard_set_issue_archived', {
    issue_id_input: current.id,
    archived_input: archived,
    actor_input: actor
  });
  if (error) throw error;
  return getIssueByKey(projectKey, issueNumber);
};

const ATTACHMENT_BUCKET = 'issueboard-private';

// Deletes an issue (soft delete: the row stays for the audit trail and its key is never reused, but it disappears
// from every list, board and search). Related data is cleaned up so nothing points at a deleted issue:
// - subtasks are deleted with their parent; an epic's children are detached instead, never deleted with it
// - relationship links are removed, checklist items linked to a deleted subtask keep their text but are unlinked
// - attachment files are removed from Supabase Storage to free the space
// Returns { key, deletedSubtasks, detachedChildren } or null when the issue does not exist.
export const deleteIssue = async (projectKey, issueNumber, actor) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return null;
  const project = await getProjectByKey(projectKey);
  const admin = getIssueboardSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: children, error: childrenError } = await admin
    .from('issueboard_issues')
    .select('id')
    .eq('parent_issue_id', issue.id)
    .is('deleted_at', null);
  if (childrenError) throw childrenError;
  const childIds = (children || []).map((child) => child.id);
  const isEpic = issue.issueType === 'epic' || issue.type === 'epic';

  const detachedChildren = isEpic ? childIds.length : 0;
  if (isEpic && childIds.length > 0) {
    const { error } = await admin.from('issueboard_issues').update({ parent_issue_id: null }).in('id', childIds);
    if (error) throw error;
  }
  const doomedIds = [issue.id, ...(isEpic ? [] : childIds)];

  // Attachment files first, so a failure leaves the issue intact rather than orphaning files.
  const { data: attachments, error: attachmentsError } = await admin
    .from('issueboard_attachments')
    .select('id,object_path')
    .in('issue_id', doomedIds)
    .neq('state', 'deleted');
  if (attachmentsError) throw attachmentsError;
  if (attachments?.length) {
    const { error: removeError } = await admin.storage
      .from(ATTACHMENT_BUCKET)
      .remove(attachments.map((a) => a.object_path));
    if (removeError) throw removeError;
    const { error: markError } = await admin
      .from('issueboard_attachments')
      .update({ state: 'deleted', deleted_at: now })
      .in(
        'id',
        attachments.map((a) => a.id)
      );
    if (markError) throw markError;
  }

  for (const column of ['source_issue_id', 'target_issue_id']) {
    const { error } = await admin.from('issueboard_relationships').delete().in(column, doomedIds);
    if (error) throw error;
  }
  const { error: unlinkError } = await admin
    .from('issueboard_checklist_items')
    .update({ linked_subtask_id: null })
    .in('linked_subtask_id', doomedIds);
  if (unlinkError) throw unlinkError;

  // source_reference is cleared so an idempotent retry after a deletion can create the issue again.
  const { error: deleteError } = await admin
    .from('issueboard_issues')
    .update({ deleted_at: now, source_reference: null, updated_by: actor })
    .in('id', doomedIds)
    .is('deleted_at', null);
  if (deleteError) throw deleteError;

  await admin.from('issueboard_audit_events').insert({
    project_id: project.id,
    issue_id: issue.id,
    actor,
    action: 'issue.deleted',
    safe_metadata: { key: issue.key, deletedSubtasks: isEpic ? 0 : childIds.length, detachedChildren }
  });
  return { key: issue.key, deletedSubtasks: isEpic ? 0 : childIds.length, detachedChildren };
};
