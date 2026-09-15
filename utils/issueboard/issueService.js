import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getProjectByKey } from './projectService';

const ISSUE_SELECT =
  'id,issue_number,issue_type,title,description,priority,work_state,reporter,assignee,story_points,' +
  'start_at,due_at,completed_at,rank,source,parent_issue_id,archived_at,created_at,updated_at,' +
  'status:issueboard_statuses(id,name,category)';

const toIssue = (projectKey) => (row) => ({
  id: row.id,
  key: `${projectKey}-${row.issue_number}`,
  type: row.issue_type,
  title: row.title,
  description: row.description,
  status: row.status ? { id: row.status.id, name: row.status.name, category: row.status.category } : null,
  priority: row.priority,
  workState: row.work_state,
  reporter: row.reporter,
  assignee: row.assignee,
  storyPoints: row.story_points,
  startAt: row.start_at,
  dueAt: row.due_at,
  completedAt: row.completed_at,
  rank: row.rank,
  source: row.source,
  parentIssueId: row.parent_issue_id,
  archivedAt: row.archived_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const listIssues = async ({ projectKey }) => {
  const project = await getProjectByKey(projectKey);
  if (!project) return null;

  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_issues')
    .select(ISSUE_SELECT)
    .eq('project_id', project.id)
    .is('deleted_at', null)
    .order('rank');
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
  { projectKey, issueType, title, description, priority, assignee, storyPoints, dueAt, parentIssueId },
  actor
) => {
  const { data, error } = await getIssueboardSupabaseAdmin().rpc('issueboard_create_issue', {
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
  return getIssueByKey(projectKey, data.issue_number);
};
