import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getIssueByKey } from './issueService';

const toItem = (row) => ({
  id: row.id,
  body: row.body,
  isComplete: row.is_complete,
  linkedSubtaskId: row.linked_subtask_id,
  position: row.position
});

const toChecklist = (row) => ({
  id: row.id,
  title: row.title,
  position: row.position,
  items: (row.issueboard_checklist_items || []).sort((a, b) => a.position - b.position).map(toItem)
});

export const listChecklists = async (projectKey, issueNumber) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return null;

  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_checklists')
    .select('id,title,position,issueboard_checklist_items(id,body,is_complete,linked_subtask_id,position)')
    .eq('issue_id', issue.id)
    .order('position');
  if (error) throw error;
  return data.map(toChecklist);
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
  return { ...toChecklist(data), items: [] };
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
  return toItem(data);
};

export const setChecklistItemComplete = async (itemId, isComplete, actor) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_checklist_items')
    .update({ is_complete: isComplete, updated_by: actor })
    .eq('id', itemId)
    .select('id,body,is_complete,linked_subtask_id,position')
    .maybeSingle();
  if (error) throw error;
  return data ? toItem(data) : null;
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
