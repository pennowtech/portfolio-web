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
