-- Project details editing and archive/restore, mirroring the transactional +
-- audit-event pattern used by issueboard_create_issue and
-- issueboard_set_issue_archived. Archiving does not delete the row.

create or replace function public.issueboard_update_project(
  project_id_input uuid,
  name_input text,
  description_input text,
  default_issue_type_input text,
  default_priority_input text,
  actor_input text
)
returns public.issueboard_projects language plpgsql security definer set search_path = '' as $$
declare updated_project public.issueboard_projects;
begin
  update public.issueboard_projects set
    name = trim(name_input),
    description = coalesce(trim(description_input), ''),
    default_issue_type = default_issue_type_input,
    default_priority = default_priority_input,
    updated_by = actor_input
  where id = project_id_input and archived_at is null
  returning * into updated_project;
  if updated_project.id is null then raise exception 'Project not found'; end if;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (project_id_input, actor_input, 'project.updated', '{}'::jsonb);

  return updated_project;
end;
$$;
revoke all on function public.issueboard_update_project(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.issueboard_update_project(uuid, text, text, text, text, text) to service_role;

create or replace function public.issueboard_set_project_archived(
  project_id_input uuid,
  archived_input boolean,
  actor_input text
)
returns public.issueboard_projects language plpgsql security definer set search_path = '' as $$
declare updated_project public.issueboard_projects;
begin
  update public.issueboard_projects set
    archived_at = case when archived_input then coalesce(archived_at, now()) else null end,
    updated_by = actor_input
  where id = project_id_input
  returning * into updated_project;
  if updated_project.id is null then raise exception 'Project not found'; end if;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (
    project_id_input, actor_input,
    case when archived_input then 'project.archived' else 'project.restored' end,
    '{}'::jsonb
  );

  return updated_project;
end;
$$;
revoke all on function public.issueboard_set_project_archived(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.issueboard_set_project_archived(uuid, boolean, text) to service_role;
