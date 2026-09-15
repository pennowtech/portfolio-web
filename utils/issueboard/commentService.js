import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getIssueByKey } from './issueService';

const COMMENT_SELECT = 'id,issue_id,body,author,edited_at,created_at,updated_at';

const toComment = (row) => ({
  id: row.id,
  issueId: row.issue_id,
  body: row.body,
  author: row.author,
  editedAt: row.edited_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const listComments = async (projectKey, issueNumber) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return null;

  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_comments')
    .select(COMMENT_SELECT)
    .eq('issue_id', issue.id)
    .is('deleted_at', null)
    .order('created_at');
  if (error) throw error;
  return data.map(toComment);
};

export const createComment = async (projectKey, issueNumber, body, actor) => {
  const issue = await getIssueByKey(projectKey, issueNumber);
  if (!issue) return null;

  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_comments')
    .insert({ issue_id: issue.id, body, author: actor })
    .select(COMMENT_SELECT)
    .single();
  if (error) throw error;
  return toComment(data);
};

export const updateComment = async (commentId, body, actor) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_comments')
    .update({ body, edited_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('author', actor)
    .is('deleted_at', null)
    .select(COMMENT_SELECT)
    .maybeSingle();
  if (error) throw error;
  return data ? toComment(data) : null;
};

export const deleteComment = async (commentId, actor) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('author', actor)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
};
