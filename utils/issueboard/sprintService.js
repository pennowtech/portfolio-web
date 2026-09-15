import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { getProjectByKey } from './projectService';

const SPRINT_SELECT =
  'id,name,goal,sequence,state,starts_at,ends_at,completed_at,capacity_notes,retrospective,created_at,updated_at';

const toSprint = (row) => ({
  id: row.id,
  name: row.name,
  goal: row.goal,
  sequence: row.sequence,
  state: row.state,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  completedAt: row.completed_at,
  capacityNotes: row.capacity_notes,
  retrospective: row.retrospective,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const listSprints = async (projectKey) => {
  const project = await getProjectByKey(projectKey);
  if (!project) return null;

  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('issueboard_sprints')
    .select(SPRINT_SELECT)
    .eq('project_id', project.id)
    .order('sequence', { ascending: false });
  if (error) throw error;
  return data.map(toSprint);
};

export const createSprint = async (projectKey, { name, goal }, actor) => {
  const { data, error } = await getIssueboardSupabaseAdmin().rpc('issueboard_create_sprint', {
    project_key_input: projectKey,
    name_input: name,
    goal_input: goal ?? '',
    actor_input: actor
  });
  if (error) throw error;
  return toSprint(data);
};

export const startSprint = async (sprintId, { startsAt, endsAt, force = false }, actor) => {
  const { data, error } = await getIssueboardSupabaseAdmin().rpc('issueboard_start_sprint', {
    sprint_id_input: sprintId,
    starts_at_input: startsAt,
    ends_at_input: endsAt,
    force_input: force,
    actor_input: actor
  });
  if (error) throw error;
  return toSprint(data);
};

export const completeSprint = async (sprintId, destinationSprintId, actor) => {
  const { data, error } = await getIssueboardSupabaseAdmin().rpc('issueboard_complete_sprint', {
    sprint_id_input: sprintId,
    destination_sprint_id_input: destinationSprintId ?? null,
    actor_input: actor
  });
  if (error) throw error;
  return toSprint(data);
};

export const cancelSprint = async (sprintId, actor) => {
  const { data, error } = await getIssueboardSupabaseAdmin().rpc('issueboard_cancel_sprint', {
    sprint_id_input: sprintId,
    actor_input: actor
  });
  if (error) throw error;
  return toSprint(data);
};
