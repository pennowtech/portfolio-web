import { getIssueboardSupabaseAdmin } from './supabaseAdmin';

const toUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  avatarUrl: row.avatar_url,
  createdAt: row.created_at
});

// Each function below takes an already-resolved project (not a key), so the
// API route only looks the project up once per request instead of once per
// call here plus once in the route.
export const listProjectUsers = async (project) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_project_users')
    .select('id,name,email,role,avatar_url,created_at')
    .eq('project_id', project.id)
    .order('name');
  if (error) throw error;
  return data.map(toUser);
};

const USER_EXISTS_MESSAGE = 'a user with this email already exists in this project';

export const addProjectUser = async (project, { name, email, role }, actor) => {
  const { data, error } = await getIssueboardSupabaseAdmin().rpc('issueboard_add_project_user', {
    project_id_input: project.id,
    name_input: name,
    email_input: email,
    role_input: role ?? null,
    actor_input: actor
  });
  if (error) {
    if (error.message?.includes(USER_EXISTS_MESSAGE)) {
      const conflictError = new Error(USER_EXISTS_MESSAGE);
      conflictError.code = 'USER_EXISTS';
      throw conflictError;
    }
    throw error;
  }
  return toUser(data);
};

export const removeProjectUser = async (project, email, actor) => {
  const { error } = await getIssueboardSupabaseAdmin().rpc('issueboard_remove_project_user', {
    project_id_input: project.id,
    email_input: email,
    actor_input: actor
  });
  if (error) {
    if (error.message === 'User not found') return false;
    throw error;
  }
  return true;
};
