-- Sprint lifecycle: create (planned), start (planned -> active, requires
-- start/end dates and at least one issue unless explicitly forced),
-- complete (active -> completed, incomplete issues move to backlog or a
-- chosen planned sprint), cancel (planned/active -> cancelled, all issues
-- return to backlog). The existing issueboard_one_active_sprint_per_project
-- unique index already enforces at most one active sprint.

create or replace function public.issueboard_create_sprint(
  project_key_input text,
  name_input text,
  goal_input text,
  actor_input text
)
returns public.issueboard_sprints language plpgsql security definer set search_path = '' as $$
declare
  target_project public.issueboard_projects;
  next_sequence integer;
  created_sprint public.issueboard_sprints;
begin
  select * into target_project from public.issueboard_projects
    where project_key = upper(trim(project_key_input)) and archived_at is null;
  if target_project.id is null then raise exception 'Project not found or archived'; end if;

  select coalesce(max(sequence), 0) + 1 into next_sequence
    from public.issueboard_sprints where project_id = target_project.id;

  insert into public.issueboard_sprints (project_id, name, goal, sequence, created_by, updated_by)
  values (target_project.id, trim(name_input), coalesce(trim(goal_input), ''), next_sequence, actor_input, actor_input)
  returning * into created_sprint;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (target_project.id, actor_input, 'sprint.created', jsonb_build_object('sprintId', created_sprint.id, 'name', created_sprint.name));

  return created_sprint;
end;
$$;
revoke all on function public.issueboard_create_sprint(text, text, text, text) from public, anon, authenticated;
grant execute on function public.issueboard_create_sprint(text, text, text, text) to service_role;

create or replace function public.issueboard_start_sprint(
  sprint_id_input uuid,
  starts_at_input timestamptz,
  ends_at_input timestamptz,
  force_input boolean,
  actor_input text
)
returns public.issueboard_sprints language plpgsql security definer set search_path = '' as $$
declare
  current_sprint public.issueboard_sprints;
  planned_issue_count integer;
  updated_sprint public.issueboard_sprints;
begin
  select * into current_sprint from public.issueboard_sprints where id = sprint_id_input;
  if current_sprint.id is null then raise exception 'Sprint not found'; end if;
  if current_sprint.state <> 'planned' then raise exception 'Only a planned sprint can be started'; end if;
  if starts_at_input is null or ends_at_input is null or starts_at_input >= ends_at_input then
    raise exception 'A sprint requires a valid start date before its end date';
  end if;

  select count(*) into planned_issue_count from public.issueboard_issues
    where sprint_id = sprint_id_input and deleted_at is null;
  if planned_issue_count = 0 and not force_input then
    raise exception 'EMPTY_SPRINT: no issues are planned in this sprint';
  end if;

  update public.issueboard_sprints set
    state = 'active', starts_at = starts_at_input, ends_at = ends_at_input, updated_by = actor_input
  where id = sprint_id_input
  returning * into updated_sprint;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (updated_sprint.project_id, actor_input, 'sprint.started', jsonb_build_object('sprintId', sprint_id_input));

  return updated_sprint;
end;
$$;
revoke all on function public.issueboard_start_sprint(uuid, timestamptz, timestamptz, boolean, text) from public, anon, authenticated;
grant execute on function public.issueboard_start_sprint(uuid, timestamptz, timestamptz, boolean, text) to service_role;

create or replace function public.issueboard_complete_sprint(
  sprint_id_input uuid,
  destination_sprint_id_input uuid,
  actor_input text
)
returns public.issueboard_sprints language plpgsql security definer set search_path = '' as $$
declare
  current_sprint public.issueboard_sprints;
  updated_sprint public.issueboard_sprints;
  moved_count integer;
begin
  select * into current_sprint from public.issueboard_sprints where id = sprint_id_input;
  if current_sprint.id is null then raise exception 'Sprint not found'; end if;
  if current_sprint.state <> 'active' then raise exception 'Only an active sprint can be completed'; end if;

  if destination_sprint_id_input is not null then
    if not exists (
      select 1 from public.issueboard_sprints
      where id = destination_sprint_id_input and project_id = current_sprint.project_id and state = 'planned'
    ) then
      raise exception 'Destination sprint must be a planned sprint in the same project';
    end if;
  end if;

  with incomplete as (
    update public.issueboard_issues set sprint_id = destination_sprint_id_input, updated_by = actor_input
    where sprint_id = sprint_id_input and deleted_at is null
      and status_id not in (select id from public.issueboard_statuses where project_id = current_sprint.project_id and category = 'done')
    returning 1
  )
  select count(*) into moved_count from incomplete;

  update public.issueboard_sprints set state = 'completed', completed_at = now(), updated_by = actor_input
  where id = sprint_id_input
  returning * into updated_sprint;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (
    updated_sprint.project_id, actor_input, 'sprint.completed',
    jsonb_build_object('sprintId', sprint_id_input, 'carriedOverIssues', moved_count, 'destinationSprintId', destination_sprint_id_input)
  );

  return updated_sprint;
end;
$$;
revoke all on function public.issueboard_complete_sprint(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.issueboard_complete_sprint(uuid, uuid, text) to service_role;

create or replace function public.issueboard_cancel_sprint(
  sprint_id_input uuid,
  actor_input text
)
returns public.issueboard_sprints language plpgsql security definer set search_path = '' as $$
declare
  current_sprint public.issueboard_sprints;
  updated_sprint public.issueboard_sprints;
begin
  select * into current_sprint from public.issueboard_sprints where id = sprint_id_input;
  if current_sprint.id is null then raise exception 'Sprint not found'; end if;
  if current_sprint.state not in ('planned', 'active') then
    raise exception 'Only a planned or active sprint can be cancelled';
  end if;

  update public.issueboard_issues set sprint_id = null
  where sprint_id = sprint_id_input and deleted_at is null;

  update public.issueboard_sprints set state = 'cancelled', updated_by = actor_input
  where id = sprint_id_input
  returning * into updated_sprint;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (updated_sprint.project_id, actor_input, 'sprint.cancelled', jsonb_build_object('sprintId', sprint_id_input));

  return updated_sprint;
end;
$$;
revoke all on function public.issueboard_cancel_sprint(uuid, text) from public, anon, authenticated;
grant execute on function public.issueboard_cancel_sprint(uuid, text) to service_role;
