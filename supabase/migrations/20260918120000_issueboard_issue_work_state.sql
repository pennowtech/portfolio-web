-- Sets an issue's work_state (normal/blocked/rejected) -- the sprint board's
-- parent-issue state indicator, which had no update path until now.

create or replace function public.issueboard_set_issue_work_state(
  issue_id_input uuid,
  work_state_input text,
  actor_input text
)
returns public.issueboard_issues language plpgsql security definer set search_path = '' as $$
declare updated_issue public.issueboard_issues;
begin
  update public.issueboard_issues
    set work_state = work_state_input, updated_by = actor_input
    where id = issue_id_input and deleted_at is null
    returning * into updated_issue;
  if updated_issue.id is null then raise exception 'Issue not found'; end if;

  insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
  values (updated_issue.project_id, issue_id_input, actor_input, 'issue.work_state_changed', jsonb_build_object('workState', work_state_input));

  return updated_issue;
end;
$$;
revoke all on function public.issueboard_set_issue_work_state(uuid, text, text) from public, anon, authenticated;
grant execute on function public.issueboard_set_issue_work_state(uuid, text, text) to service_role;
