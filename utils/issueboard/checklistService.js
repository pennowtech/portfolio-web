import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getIssueByKey } from './issueService';

const CHECKLIST_ITEM_SELECT =
  'id,body,is_complete,linked_subtask_id,position,' +
  'linked_subtask:issueboard_issues!linked_subtask_id(issue_number,title,status:issueboard_statuses(category))';

const toItem = (projectKey) => (row) => ({
  id: row.id,
  body: row.body,
  isComplete: row.is_complete,
  linkedSubtaskId: row.linked_subtask_id,
  linkedSubtask: row.linked_subtask
    ? {
        key: `${projectKey}-${row.linked_subtask.issue_number}`,
        title: row.linked_subtask.title,
        statusCategory: row.linked_subtask.status?.category ?? null
      }
    : null,
  position: row.position
});

const toChecklist = (projectKey) => (row) => ({
  id: row.id,
  title: row.title,
  position: row.position,
  items: (row.issueboard_checklist_items || []).sort((a, b) => a.position - b.position).map(toItem(projectKey))
});

export const listChecklists = async (projectKey, issueNumber) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return null;

  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_checklists')
    .select(`id,title,position,issueboard_checklist_items(${CHECKLIST_ITEM_SELECT})`)
    .eq('issue_id', issue.id)
    .order('position');
  if (error) throw error;
  return data.map(toChecklist(projectKey));
};

export const createChecklist = async (projectKey, issueNumber, title, actor) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return null;

  const { data: existing, error: countError } = await getIssueboardSupabaseAdmin()
    .from('issueboard_checklists')
    .select('position')
    .eq('issue_id', issue.id)
    .order('position', { ascending: false })
    .limit(1);
  if (countError) throw countError;
  const nextPosition = existing.length ? existing[0].position + 1 : 0;

  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_checklists')
    .insert({ issue_id: issue.id, title, position: nextPosition, created_by: actor, updated_by: actor })
    .select('id,title,position')
    .single();
  if (error) throw error;
  return { ...toChecklist(projectKey)(data), items: [] };
};

export const addChecklistItem = async (checklistId, body, actor) => {
  const { data: existing, error: countError } = await getIssueboardSupabaseAdmin()
    .from('issueboard_checklist_items')
    .select('position')
    .eq('checklist_id', checklistId)
    .order('position', { ascending: false })
    .limit(1);
  if (countError) throw countError;
  const nextPosition = existing.length ? existing[0].position + 1 : 0;

  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_checklist_items')
    .insert({ checklist_id: checklistId, body, position: nextPosition, created_by: actor, updated_by: actor })
    .select('id,body,is_complete,linked_subtask_id,position')
    .single();
  if (error) throw error;
  return toItem(null)(data);
};

const NOT_FOUND_MESSAGES = new Set(['Checklist item not found', 'Subtask not found', 'Parent issue not found']);

const runOrNull = async (promise) => {
  const { data, error } = await promise;
  if (error) {
    if (NOT_FOUND_MESSAGES.has(error.message)) return null;
    throw error;
  }
  return data;
};

// Sets a checklist item's completion state. If the item links to a subtask,
// the subtask's status is synced to match in the same transaction (§6.6).
export const setChecklistItemComplete = async (itemId, isComplete, actor) => {
  const data = await runOrNull(
    getIssueboardSupabaseAdmin().rpc('issueboard_set_checklist_item_complete', {
      checklist_item_id_input: itemId,
      is_complete_input: isComplete,
      actor_input: actor
    })
  );
  return data ? toItem(null)(data) : null;
};

export const deleteChecklistItem = async (itemId) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_checklist_items')
    .delete()
    .eq('id', itemId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
};

// Creates a new subtask under the checklist item's parent issue, seeded from
// the item's text and completion state, and links the two.
// Resolves the project key that owns a checklist item, so API routes that
// only receive an itemId can build full issue keys without trusting a
// client-supplied project.
export const resolveChecklistItemProjectKey = async (itemId) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_checklist_items')
    .select('checklist:issueboard_checklists(issue:issueboard_issues(project:issueboard_projects(project_key)))')
    .eq('id', itemId)
    .maybeSingle();
  if (error) throw error;
  return data?.checklist?.issue?.project?.project_key ?? null;
};

export const createLinkedSubtask = async (projectKey, itemId, actor) => {
  const data = await runOrNull(
    getIssueboardSupabaseAdmin().rpc('issueboard_create_linked_subtask', {
      checklist_item_id_input: itemId,
      actor_input: actor
    })
  );
  return data ? getIssueByKey(projectKey, data.issue_number) : null;
};

// Links an existing subtask (of the same parent issue) to a checklist item.
// When the two sides disagree on completion, `resolution` ('checklist' or
// 'subtask') must say which state wins; omit it on the first attempt and
// surface the RESOLUTION_REQUIRED error to the caller if it's needed.
export const linkExistingSubtask = async (projectKey, itemId, subtaskIssueNumber, resolution, actor) => {
  const subtask = await getIssueByKey(projectKey, subtaskIssueNumber);
  if (!subtask) return null;

  const data = await runOrNull(
    getIssueboardSupabaseAdmin().rpc('issueboard_link_checklist_item_subtask', {
      checklist_item_id_input: itemId,
      subtask_id_input: subtask.id,
      resolution_input: resolution ?? null,
      actor_input: actor
    })
  );
  if (!data) return null;
  return {
    ...toItem(null)(data),
    linkedSubtask: { key: subtask.key, title: subtask.title, statusCategory: subtask.status?.category ?? null }
  };
};

export const unlinkSubtask = async (itemId, actor) => {
  const data = await runOrNull(
    getIssueboardSupabaseAdmin().rpc('issueboard_unlink_checklist_item_subtask', {
      checklist_item_id_input: itemId,
      actor_input: actor
    })
  );
  return data ? toItem(null)(data) : null;
};
