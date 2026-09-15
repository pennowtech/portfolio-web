-- Transactional issue update: validates the target status belongs to the
-- issue's own project, enforces optimistic concurrency against the caller's
-- last-known updated_at, keeps completed_at in sync with the status category,
-- and records an audit event -- mirroring issueboard_create_issue.

create or replace function public.issueboard_update_issue(
  issue_id_input uuid,
  title_input text,
  description_input text,
  priority_input text,
  assignee_input text,
  status_id_input uuid,
  expected_updated_at_input timestamptz,
  actor_input text
)
returns public.issueboard_issues language plpgsql security definer set search_path = '' as $$
declare
  current_issue public.issueboard_issues;
  updated_issue public.issueboard_issues;
  target_status public.issueboard_statuses;
  status_changed boolean;
begin
  select * into current_issue from public.issueboard_issues where id = issue_id_input and deleted_at is null;
  if current_issue.id is null then raise exception 'Issue not found'; end if;

  if current_issue.updated_at <> expected_updated_at_input then
    raise exception 'CONFLICT: issue was modified since it was loaded';
  end if;

  select * into target_status from public.issueboard_statuses
    where id = status_id_input and project_id = current_issue.project_id;
  if target_status.id is null then raise exception 'Status not found in project'; end if;

  status_changed := current_issue.status_id <> status_id_input;

  update public.issueboard_issues set
    title = trim(title_input),
    description = coalesce(description_input, ''),
    priority = priority_input,
    assignee = nullif(trim(coalesce(assignee_input, '')), ''),
    status_id = status_id_input,
    completed_at = case
      when target_status.category = 'done' and current_issue.completed_at is null then now()
      when target_status.category <> 'done' then null
      else current_issue.completed_at
    end,
    updated_by = actor_input
  where id = issue_id_input
  returning * into updated_issue;

  insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
  values (
    current_issue.project_id, issue_id_input, actor_input, 'issue.updated',
    jsonb_build_object('statusChanged', status_changed, 'fromStatusId', current_issue.status_id, 'toStatusId', status_id_input)
  );

  return updated_issue;
end;
$$;
revoke all on function public.issueboard_update_issue(uuid, text, text, text, text, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.issueboard_update_issue(uuid, text, text, text, text, uuid, timestamptz, text) to service_role;
