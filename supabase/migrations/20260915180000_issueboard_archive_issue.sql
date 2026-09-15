-- Archive/restore lifecycle for issues, mirroring the transactional +
-- audit-event pattern used by issueboard_create_issue and
-- issueboard_update_issue. Archiving/restoring does not delete the row.

create or replace function public.issueboard_set_issue_archived(
  issue_id_input uuid,
  archived_input boolean,
  actor_input text
)
returns public.issueboard_issues language plpgsql security definer set search_path = '' as $$
declare
  current_issue public.issueboard_issues;
  updated_issue public.issueboard_issues;
begin
  select * into current_issue from public.issueboard_issues where id = issue_id_input and deleted_at is null;
  if current_issue.id is null then raise exception 'Issue not found'; end if;

  update public.issueboard_issues set
    archived_at = case when archived_input then coalesce(archived_at, now()) else null end,
    updated_by = actor_input
  where id = issue_id_input
  returning * into updated_issue;

  insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
  values (
    current_issue.project_id, issue_id_input, actor_input,
    case when archived_input then 'issue.archived' else 'issue.restored' end,
    '{}'::jsonb
  );

  return updated_issue;
end;
$$;
revoke all on function public.issueboard_set_issue_archived(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.issueboard_set_issue_archived(uuid, boolean, text) to service_role;
