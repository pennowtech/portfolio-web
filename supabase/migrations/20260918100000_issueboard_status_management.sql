-- Workflow status management for project settings (§6.2): create, edit,
-- delete (only when unused), and reorder a project's statuses.

create or replace function public.issueboard_create_status(
  project_id_input uuid,
  name_input text,
  category_input text,
  color_input text,
  wip_limit_input integer,
  actor_input text
)
returns public.issueboard_statuses language plpgsql security definer set search_path = '' as $$
declare
  next_position integer;
  created_status public.issueboard_statuses;
begin
  if not exists (select 1 from public.issueboard_projects where id = project_id_input and archived_at is null) then
    raise exception 'Project not found or archived';
  end if;

  select coalesce(max(position) + 1, 0) into next_position
    from public.issueboard_statuses where project_id = project_id_input;

  insert into public.issueboard_statuses (project_id, name, category, color, position, wip_limit)
  values (project_id_input, trim(name_input), category_input, color_input, next_position, wip_limit_input)
  returning * into created_status;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (project_id_input, actor_input, 'status.created', jsonb_build_object('statusId', created_status.id, 'name', created_status.name));

  return created_status;
end;
$$;
revoke all on function public.issueboard_create_status(uuid, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.issueboard_create_status(uuid, text, text, text, integer, text) to service_role;

create or replace function public.issueboard_update_status(
  status_id_input uuid,
  name_input text,
  category_input text,
  color_input text,
  wip_limit_input integer,
  actor_input text
)
returns public.issueboard_statuses language plpgsql security definer set search_path = '' as $$
declare updated_status public.issueboard_statuses;
begin
  update public.issueboard_statuses set
    name = trim(name_input),
    category = category_input,
    color = color_input,
    wip_limit = wip_limit_input
  where id = status_id_input
  returning * into updated_status;
  if updated_status.id is null then raise exception 'Status not found'; end if;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (updated_status.project_id, actor_input, 'status.updated', jsonb_build_object('statusId', updated_status.id, 'name', updated_status.name));

  return updated_status;
end;
$$;
revoke all on function public.issueboard_update_status(uuid, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.issueboard_update_status(uuid, text, text, text, integer, text) to service_role;

create or replace function public.issueboard_delete_status(
  status_id_input uuid,
  actor_input text
)
returns void language plpgsql security definer set search_path = '' as $$
declare target_status public.issueboard_statuses;
begin
  select * into target_status from public.issueboard_statuses where id = status_id_input;
  if target_status.id is null then raise exception 'Status not found'; end if;

  if exists (select 1 from public.issueboard_issues where status_id = status_id_input and deleted_at is null) then
    raise exception 'STATUS_IN_USE: status has issues assigned to it';
  end if;

  delete from public.issueboard_statuses where id = status_id_input;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (target_status.project_id, actor_input, 'status.deleted', jsonb_build_object('statusId', status_id_input, 'name', target_status.name));
end;
$$;
revoke all on function public.issueboard_delete_status(uuid, text) from public, anon, authenticated;
grant execute on function public.issueboard_delete_status(uuid, text) to service_role;

-- Reassigns positions from an explicit, complete ordering of a project's
-- status ids. `position` has its own `>= 0` check constraint, so unlike a
-- typical reorder swap this can't stage through negative values -- it bumps
-- every row into a temporary range above any real position first (still
-- pairwise distinct, since it's each row's own prior value plus a constant),
-- then assigns final positions, so the per-row unique (project_id, position)
-- and >= 0 checks never see a transient collision or negative value.
create or replace function public.issueboard_reorder_statuses(
  project_id_input uuid,
  ordered_status_ids uuid[],
  actor_input text
)
returns setof public.issueboard_statuses language plpgsql security definer set search_path = '' as $$
declare
  expected_count integer;
  status_id uuid;
  idx integer := 0;
begin
  select count(*) into expected_count from public.issueboard_statuses where project_id = project_id_input;
  if expected_count <> array_length(ordered_status_ids, 1)
     or expected_count <> (
       select count(*) from public.issueboard_statuses
       where project_id = project_id_input and id = any(ordered_status_ids)
     )
  then
    raise exception 'Reorder must include every status in the project exactly once';
  end if;

  update public.issueboard_statuses set position = position + 100000
  where project_id = project_id_input;

  foreach status_id in array ordered_status_ids loop
    update public.issueboard_statuses set position = idx where id = status_id;
    idx := idx + 1;
  end loop;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (project_id_input, actor_input, 'status.reordered', jsonb_build_object('order', ordered_status_ids));

  return query select * from public.issueboard_statuses where project_id = project_id_input order by position;
end;
$$;
revoke all on function public.issueboard_reorder_statuses(uuid, uuid[], text) from public, anon, authenticated;
grant execute on function public.issueboard_reorder_statuses(uuid, uuid[], text) to service_role;
