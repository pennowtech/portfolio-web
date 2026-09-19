-- Sprint Board Layouts and Expanded Parent Work States
-- 1. Widen `issueboard_issues.work_state` constraint to support:
--    normal, active, approved, blocked, done, rejected
-- 2. Add `sprint_board_layout` to `issueboard_projects` ('swimlane' or 'accordion')
-- 3. Provide atomic RPC `issueboard_set_sprint_board_layout`

do $$
declare check_name text;
begin
  select con.conname into check_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
  where rel.relname = 'issueboard_issues' and con.contype = 'c' and att.attname = 'work_state';
  if check_name is not null then
    execute format('alter table public.issueboard_issues drop constraint %I', check_name);
  end if;
end $$;

alter table public.issueboard_issues
  add constraint issueboard_issues_work_state_check
  check (work_state in ('normal', 'active', 'approved', 'blocked', 'done', 'rejected'));

alter table public.issueboard_projects
  add column if not exists sprint_board_layout text not null default 'swimlane';

do $$
declare check_name text;
begin
  select con.conname into check_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
  where rel.relname = 'issueboard_projects' and con.contype = 'c' and att.attname = 'sprint_board_layout';
  if check_name is null then
    alter table public.issueboard_projects
      add constraint issueboard_projects_sprint_board_layout_check
      check (sprint_board_layout in ('swimlane', 'accordion'));
  end if;
end $$;

create or replace function public.issueboard_set_sprint_board_layout(
  project_id_input uuid,
  layout_input text,
  actor_input text
)
returns public.issueboard_projects language plpgsql security definer set search_path = '' as $$
declare updated_project public.issueboard_projects;
begin
  if layout_input not in ('swimlane', 'accordion') then
    raise exception 'INVALID_LAYOUT: Layout must be swimlane or accordion';
  end if;

  update public.issueboard_projects
  set sprint_board_layout = layout_input,
      updated_at = now(),
      updated_by = actor_input
  where id = project_id_input and archived_at is null
  returning * into updated_project;

  if updated_project.id is null then
    raise exception 'Project not found or archived';
  end if;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (project_id_input, actor_input, 'project.layout_updated', jsonb_build_object('sprintBoardLayout', layout_input));

  return updated_project;
end;
$$;

revoke all on function public.issueboard_set_sprint_board_layout(uuid, text, text) from public, anon, authenticated;
grant execute on function public.issueboard_set_sprint_board_layout(uuid, text, text) to service_role;
