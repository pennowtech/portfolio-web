-- Transactional issue creation: allocates the project-scoped issue number,
-- assigns the project's default backlog status, and records an audit event
-- in one atomic operation, mirroring issueboard_create_project.

create or replace function public.issueboard_create_issue(
  project_key_input text,
  issue_type_input text,
  title_input text,
  description_input text,
  priority_input text,
  actor_input text,
  assignee_input text default null,
  story_points_input numeric default null,
  due_at_input timestamptz default null,
  parent_issue_id_input uuid default null
)
returns public.issueboard_issues language plpgsql security definer set search_path = '' as $$
declare
  target_project public.issueboard_projects;
  backlog_status_id uuid;
  allocated_number bigint;
  created_issue public.issueboard_issues;
begin
  select * into target_project from public.issueboard_projects
    where project_key = upper(trim(project_key_input)) and archived_at is null;
  if target_project.id is null then raise exception 'Project not found or archived'; end if;

  if parent_issue_id_input is not null then
    if not exists (
      select 1 from public.issueboard_issues
      where id = parent_issue_id_input and project_id = target_project.id and deleted_at is null
    ) then
      raise exception 'Parent issue not found in project';
    end if;
  end if;

  select id into backlog_status_id from public.issueboard_statuses
    where project_id = target_project.id and category = 'backlog' order by position limit 1;
  if backlog_status_id is null then raise exception 'Project has no backlog status'; end if;

  allocated_number := public.issueboard_allocate_issue_number(target_project.id);

  insert into public.issueboard_issues (
    project_id, issue_number, status_id, issue_type, title, description, priority,
    reporter, assignee, story_points, due_at, parent_issue_id, rank, source, created_by, updated_by
  ) values (
    target_project.id, allocated_number, backlog_status_id, issue_type_input, trim(title_input),
    coalesce(description_input, ''), priority_input, actor_input, assignee_input, story_points_input,
    due_at_input, parent_issue_id_input, lpad(allocated_number::text, 12, '0'), 'website', actor_input, actor_input
  ) returning * into created_issue;

  insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
  values (
    target_project.id, created_issue.id, actor_input, 'issue.created',
    jsonb_build_object('issueNumber', allocated_number, 'issueType', issue_type_input)
  );

  return created_issue;
end;
$$;
revoke all on function public.issueboard_create_issue(text, text, text, text, text, text, text, numeric, timestamptz, uuid) from public, anon, authenticated;
grant execute on function public.issueboard_create_issue(text, text, text, text, text, text, text, numeric, timestamptz, uuid) to service_role;
