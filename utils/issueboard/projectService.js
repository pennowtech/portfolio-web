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
