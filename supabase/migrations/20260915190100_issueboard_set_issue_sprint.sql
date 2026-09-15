-- Moves a single issue between the backlog (sprint_id null) and a sprint,
-- recording an audit event. Used by drag/keyboard backlog<->sprint moves.

create or replace function public.issueboard_set_issue_sprint(
  issue_id_input uuid,
  sprint_id_input uuid,
  actor_input text
)
returns public.issueboard_issues language plpgsql security definer set search_path = '' as $$
declare
  current_issue public.issueboard_issues;
  updated_issue public.issueboard_issues;
begin
  select * into current_issue from public.issueboard_issues where id = issue_id_input and deleted_at is null;
  if current_issue.id is null then raise exception 'Issue not found'; end if;

  if sprint_id_input is not null then
    if not exists (
      select 1 from public.issueboard_sprints
      where id = sprint_id_input and project_id = current_issue.project_id and state in ('planned', 'active')
    ) then
      raise exception 'Sprint not found in project or not open for planning';
    end if;
  end if;

  update public.issueboard_issues set sprint_id = sprint_id_input, updated_by = actor_input
  where id = issue_id_input
  returning * into updated_issue;

  insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
  values (
    current_issue.project_id, issue_id_input, actor_input, 'issue.sprint_changed',
    jsonb_build_object('fromSprintId', current_issue.sprint_id, 'toSprintId', sprint_id_input)
  );

  return updated_issue;
end;
$$;
revoke all on function public.issueboard_set_issue_sprint(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.issueboard_set_issue_sprint(uuid, uuid, text) to service_role;
