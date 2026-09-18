import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getProjectByKey } from './projectService';

// Deterministic accessible palette, matching the hash-based approach the
// prototype UI already used client-side for unknown labels -- persisting a
// real color at creation time keeps every viewer consistent.
export const LABEL_PALETTE = [
  { backgroundColor: '#ede9fe', textColor: '#5b21b6' },
  { backgroundColor: '#dbeafe', textColor: '#1e40af' },
  { backgroundColor: '#d1fae5', textColor: '#065f46' },
  { backgroundColor: '#fce7f3', textColor: '#9d174d' },
  { backgroundColor: '#cffafe', textColor: '#155e75' },
  { backgroundColor: '#ffedd5', textColor: '#9a3412' }
];

const colorForName = (normalizedName) => {
  const hash = [...normalizedName].reduce((total, char) => total + char.charCodeAt(0), 0);
  return LABEL_PALETTE[hash % LABEL_PALETTE.length];
};

const toLabel = (row) => ({
  id: row.id,
  name: row.name,
  backgroundColor: row.background_color,
  textColor: row.text_color
});

export const listLabels = async (projectId) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_labels')
    .select('id,name,background_color,text_color')
    .eq('project_id', projectId)
    .order('name');
  if (error) throw error;
  return data.map(toLabel);
};

export const findOrCreateLabel = async (projectId, name, actor) => {
  const trimmedName = name.trim();
  const normalizedName = trimmedName.toLowerCase();
  const { data: existing, error: findError } = await getIssueboardSupabaseAdmin()
    .from('issueboard_labels')
    .select('id,name,background_color,text_color')
    .eq('project_id', projectId)
    .eq('normalized_name', normalizedName)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return toLabel(existing);

  const colors = colorForName(normalizedName);
  const { data: created, error: createError } = await getIssueboardSupabaseAdmin()
    .from('issueboard_labels')
    .insert({
      project_id: projectId,
      name: trimmedName,
      background_color: colors.backgroundColor,
      text_color: colors.textColor,
      created_by: actor
    })
    .select('id,name,background_color,text_color')
    .single();
  if (createError) throw createError;
  return toLabel(created);
};

export const attachLabel = async (issueId, labelId, actor) => {
  const { error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_issue_labels')
    .upsert({ issue_id: issueId, label_id: labelId, created_by: actor }, { onConflict: 'issue_id,label_id' });
  if (error) throw error;
};

export const detachLabel = async (issueId, labelId) => {
  const { error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_issue_labels')
    .delete()
    .eq('issue_id', issueId)
    .eq('label_id', labelId);
  if (error) throw error;
};

const LABEL_EXISTS_MESSAGE = 'a label with this name already exists in this project';

export const createLabel = async (projectKey, name, actor) => {
  const project = await getProjectByKey(projectKey);
  if (!project) return null;

  const colors = colorForName(name.trim().toLowerCase());
  const { data, error } = await getIssueboardSupabaseAdmin().rpc('issueboard_create_label', {
    project_id_input: project.id,
    name_input: name,
    background_color_input: colors.backgroundColor,
    text_color_input: colors.textColor,
    actor_input: actor
  });
  if (error) {
    if (error.message?.includes(LABEL_EXISTS_MESSAGE)) {
      const conflictError = new Error(LABEL_EXISTS_MESSAGE);
      conflictError.code = 'LABEL_EXISTS';
      throw conflictError;
    }
    throw error;
  }
  return toLabel(data);
};

export const updateLabel = async (labelId, { name, backgroundColor, textColor }, actor) => {
  const { data, error } = await getIssueboardSupabaseAdmin().rpc('issueboard_update_label', {
    label_id_input: labelId,
    name_input: name,
    background_color_input: backgroundColor,
    text_color_input: textColor,
    actor_input: actor
  });
  if (error) {
    if (error.message === 'Label not found') return null;
    if (error.message?.includes(LABEL_EXISTS_MESSAGE)) {
      const conflictError = new Error(LABEL_EXISTS_MESSAGE);
      conflictError.code = 'LABEL_EXISTS';
      throw conflictError;
    }
    throw error;
  }
  return toLabel(data);
};

export const deleteLabel = async (labelId, actor) => {
  const { error } = await getIssueboardSupabaseAdmin().rpc('issueboard_delete_label', {
    label_id_input: labelId,
    actor_input: actor
  });
  if (error) {
    if (error.message === 'Label not found') return false;
    throw error;
  }
  return true;
};
