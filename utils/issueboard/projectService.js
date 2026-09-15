import { getIssueboardSupabaseAdmin } from './supabaseAdmin';

const toProject = (project) => ({
  id: project.id,
  key: project.project_key,
  name: project.name,
  description: project.description,
  color: project.color,
  defaultIssueType: project.default_issue_type,
  defaultPriority: project.default_priority,
  archivedAt: project.archived_at,
  createdAt: project.created_at,
  updatedAt: project.updated_at
});

export const listProjects = async () => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_projects')
    .select(
      'id,project_key,name,description,color,default_issue_type,default_priority,archived_at,created_at,updated_at'
    )
    .is('archived_at', null)
    .order('name');
  if (error) throw error;
  return data.map(toProject);
};

export const getProjectByKey = async (projectKey) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_projects')
    .select(
      'id,project_key,name,description,color,default_issue_type,default_priority,archived_at,created_at,updated_at'
    )
    .eq('project_key', projectKey.toUpperCase())
    .is('archived_at', null)
    .maybeSingle();
  if (error) throw error;
  return data ? toProject(data) : null;
};

export const listStatuses = async (projectId) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_statuses')
    .select('id,name,category,color,position,wip_limit')
    .eq('project_id', projectId)
    .order('position');
  if (error) throw error;
  return data.map((status) => ({
    id: status.id,
    name: status.name,
    category: status.category,
    color: status.color,
    position: status.position,
    wipLimit: status.wip_limit
  }));
};

export const createProject = async ({ projectKey, name, description, defaultIssueType }, actor) => {
  const { data, error } = await getIssueboardSupabaseAdmin().rpc('issueboard_create_project', {
    project_key_input: projectKey,
    name_input: name,
    description_input: description,
    default_issue_type_input: defaultIssueType,
    actor_input: actor
  });
  if (error) throw error;
  return toProject(data);
};
