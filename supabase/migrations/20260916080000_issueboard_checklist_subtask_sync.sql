-- Checklist item <-> subtask linking and bidirectional completion sync (§6.6).
-- A checklist item may link to at most one subtask, and a subtask may link
-- back to at most one checklist item (enforced by the partial unique index
-- below). Once linked, the two share one completion outcome. There are no
-- triggers here: each mutation only ever writes the *other* side once inside
-- its own transaction, and every sync write is skipped when the target is
-- already in the desired state, so there is no path back into the writer
-- that just ran -- this makes the sync inherently idempotent and loop-safe
-- without needing recursion guards.

create unique index if not exists issueboard_checklist_items_linked_subtask_unique
  on public.issueboard_checklist_items (linked_subtask_id)
  where linked_subtask_id is not null;

-- Picks the status a linked subtask should move to for a given completion
-- state: the lowest-position 'done' status when completing, or the
-- highest-position non-done status (the one closest to done) when reopening.
create or replace function public.issueboard_pick_sync_status(target_project_id uuid, want_done boolean)
returns uuid language sql security definer set search_path = '' stable as $$
  select id from public.issueboard_statuses
  where project_id = target_project_id and (category = 'done') = want_done
  order by case when want_done then position end asc, case when not want_done then position end desc
  limit 1;
$$;
revoke all on function public.issueboard_pick_sync_status(uuid, boolean) from public, anon, authenticated;
grant execute on function public.issueboard_pick_sync_status(uuid, boolean) to service_role;

-- Adds the checklist-item <-> subtask sync step to issue updates: when a
-- status change lands an issue on/off a 'done' status and that issue is
-- linked from a checklist item, the checklist item's checked state follows.
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
  linked_item public.issueboard_checklist_items;
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

  if status_changed then
    select * into linked_item from public.issueboard_checklist_items where linked_subtask_id = issue_id_input;
    if linked_item.id is not null and linked_item.is_complete <> (target_status.category = 'done') then
      update public.issueboard_checklist_items
        set is_complete = (target_status.category = 'done'), updated_by = actor_input
        where id = linked_item.id;

      insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
      values (
        current_issue.project_id, issue_id_input, actor_input,
        case when target_status.category = 'done' then 'checklist_item.completed' else 'checklist_item.reopened' end,
        jsonb_build_object('checklistItemId', linked_item.id, 'syncedFromIssue', true)
      );
    end if;
  end if;

  return updated_issue;
end;
$$;
revoke all on function public.issueboard_update_issue(uuid, text, text, text, text, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.issueboard_update_issue(uuid, text, text, text, text, uuid, timestamptz, text) to service_role;

-- Sets a checklist item's completion state and, if it links to a subtask,
-- syncs that subtask's status to match.
create or replace function public.issueboard_set_checklist_item_complete(
  checklist_item_id_input uuid,
  is_complete_input boolean,
  actor_input text
)
returns public.issueboard_checklist_items language plpgsql security definer set search_path = '' as $$
declare
  current_item public.issueboard_checklist_items;
  updated_item public.issueboard_checklist_items;
  linked_issue public.issueboard_issues;
  linked_status_category text;
  target_status_id uuid;
begin
  select * into current_item from public.issueboard_checklist_items where id = checklist_item_id_input;
  if current_item.id is null then raise exception 'Checklist item not found'; end if;

  update public.issueboard_checklist_items
    set is_complete = is_complete_input, updated_by = actor_input
    where id = checklist_item_id_input
    returning * into updated_item;

  if current_item.linked_subtask_id is not null then
    select * into linked_issue from public.issueboard_issues
      where id = current_item.linked_subtask_id and deleted_at is null;
    if linked_issue.id is not null then
      select category into linked_status_category from public.issueboard_statuses where id = linked_issue.status_id;
    end if;

    if linked_issue.id is not null and (linked_status_category = 'done') <> is_complete_input then
      target_status_id := public.issueboard_pick_sync_status(linked_issue.project_id, is_complete_input);
      if target_status_id is not null then
        update public.issueboard_issues set
          status_id = target_status_id,
          completed_at = case when is_complete_input then coalesce(completed_at, now()) else null end,
          updated_by = actor_input
        where id = linked_issue.id;

        insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
        values (
          linked_issue.project_id, linked_issue.id, actor_input, 'issue.updated',
          jsonb_build_object('statusChanged', true, 'toStatusId', target_status_id, 'syncedFromChecklistItem', true)
        );
      end if;
    end if;
  end if;

  insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
  select i.project_id, i.id, actor_input,
    case when is_complete_input then 'checklist_item.completed' else 'checklist_item.reopened' end,
    jsonb_build_object('checklistItemId', checklist_item_id_input)
  from public.issueboard_checklists c
  join public.issueboard_issues i on i.id = c.issue_id
  where c.id = current_item.checklist_id;

  return updated_item;
end;
$$;
revoke all on function public.issueboard_set_checklist_item_complete(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.issueboard_set_checklist_item_complete(uuid, boolean, text) to service_role;

-- Creates a new subtask under the checklist item's parent issue, seeded from
-- the item's text and current completion state, and links the two.
create or replace function public.issueboard_create_linked_subtask(
  checklist_item_id_input uuid,
  actor_input text
)
returns public.issueboard_issues language plpgsql security definer set search_path = '' as $$
declare
  current_item public.issueboard_checklist_items;
  parent_issue public.issueboard_issues;
  target_status_id uuid;
  allocated_number bigint;
  created_issue public.issueboard_issues;
begin
  select * into current_item from public.issueboard_checklist_items where id = checklist_item_id_input;
  if current_item.id is null then raise exception 'Checklist item not found'; end if;
  if current_item.linked_subtask_id is not null then
    raise exception 'Checklist item is already linked to a subtask';
  end if;

  select i.* into parent_issue from public.issueboard_issues i
    join public.issueboard_checklists c on c.id = current_item.checklist_id
    where i.id = c.issue_id and i.deleted_at is null;
  if parent_issue.id is null then raise exception 'Parent issue not found'; end if;
  if parent_issue.parent_issue_id is not null then
    raise exception 'NESTING_LIMIT: parent issue is already a subtask; only one level of nesting is supported';
  end if;

  target_status_id := public.issueboard_pick_sync_status(parent_issue.project_id, current_item.is_complete);
  if target_status_id is null then raise exception 'Project has no usable status for the new subtask'; end if;

  allocated_number := public.issueboard_allocate_issue_number(parent_issue.project_id);

  insert into public.issueboard_issues (
    project_id, issue_number, status_id, issue_type, title, description, priority,
    reporter, parent_issue_id, rank, source, completed_at, created_by, updated_by
  ) values (
    parent_issue.project_id, allocated_number, target_status_id, 'subtask', trim(current_item.body), '', 'medium',
    actor_input, parent_issue.id, lpad(allocated_number::text, 12, '0'), 'website',
    case when current_item.is_complete then now() else null end, actor_input, actor_input
  ) returning * into created_issue;

  update public.issueboard_checklist_items
    set linked_subtask_id = created_issue.id, updated_by = actor_input
    where id = checklist_item_id_input;

  insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
  values (
    parent_issue.project_id, created_issue.id, actor_input, 'issue.created',
    jsonb_build_object('issueNumber', allocated_number, 'issueType', 'subtask', 'fromChecklistItemId', checklist_item_id_input)
  );
  insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
  values (
    parent_issue.project_id, created_issue.id, actor_input, 'checklist_item.linked',
    jsonb_build_object('checklistItemId', checklist_item_id_input, 'created', true)
  );

  return created_issue;
end;
$$;
revoke all on function public.issueboard_create_linked_subtask(uuid, text) from public, anon, authenticated;
grant execute on function public.issueboard_create_linked_subtask(uuid, text) to service_role;

-- Links an existing subtask (of the same parent issue) to a checklist item.
-- When the two sides disagree on completion, resolution_input ('checklist'
-- or 'subtask') must say which state wins; the loser is updated to match.
create or replace function public.issueboard_link_checklist_item_subtask(
  checklist_item_id_input uuid,
  subtask_id_input uuid,
  resolution_input text,
  actor_input text
)
returns public.issueboard_checklist_items language plpgsql security definer set search_path = '' as $$
declare
  current_item public.issueboard_checklist_items;
  parent_issue public.issueboard_issues;
  subtask_issue public.issueboard_issues;
  subtask_status_category text;
  subtask_done boolean;
  target_status_id uuid;
  updated_item public.issueboard_checklist_items;
begin
  if resolution_input is not null and resolution_input not in ('checklist', 'subtask') then
    raise exception 'Invalid resolution';
  end if;

  select * into current_item from public.issueboard_checklist_items where id = checklist_item_id_input;
  if current_item.id is null then raise exception 'Checklist item not found'; end if;
  if current_item.linked_subtask_id is not null then
    raise exception 'Checklist item is already linked to a subtask';
  end if;

  select i.* into parent_issue from public.issueboard_issues i
    join public.issueboard_checklists c on c.id = current_item.checklist_id
    where i.id = c.issue_id and i.deleted_at is null;
  if parent_issue.id is null then raise exception 'Parent issue not found'; end if;

  select * into subtask_issue from public.issueboard_issues where id = subtask_id_input and deleted_at is null;
  if subtask_issue.id is null then raise exception 'Subtask not found'; end if;
  if subtask_issue.parent_issue_id is distinct from parent_issue.id then
    raise exception 'Subtask must belong to the same issue as the checklist';
  end if;
  if exists (select 1 from public.issueboard_checklist_items where linked_subtask_id = subtask_id_input) then
    raise exception 'Subtask is already linked to another checklist item';
  end if;

  select category into subtask_status_category from public.issueboard_statuses where id = subtask_issue.status_id;
  subtask_done := (subtask_status_category = 'done');

  if current_item.is_complete <> subtask_done then
    if resolution_input is null then
      raise exception 'RESOLUTION_REQUIRED: choose which state should win before linking';
    elsif resolution_input = 'checklist' then
      target_status_id := public.issueboard_pick_sync_status(subtask_issue.project_id, current_item.is_complete);
      if target_status_id is not null then
        update public.issueboard_issues set
          status_id = target_status_id,
          completed_at = case when current_item.is_complete then coalesce(completed_at, now()) else null end,
          updated_by = actor_input
        where id = subtask_issue.id;

        insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
        values (
          subtask_issue.project_id, subtask_issue.id, actor_input, 'issue.updated',
          jsonb_build_object('statusChanged', true, 'toStatusId', target_status_id, 'syncedFromChecklistItem', true)
        );
      end if;
    else
      update public.issueboard_checklist_items
        set is_complete = subtask_done
        where id = checklist_item_id_input
        returning * into current_item;
    end if;
  end if;

  update public.issueboard_checklist_items
    set linked_subtask_id = subtask_id_input, updated_by = actor_input
    where id = checklist_item_id_input
    returning * into updated_item;

  insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
  values (
    parent_issue.project_id, subtask_issue.id, actor_input, 'checklist_item.linked',
    jsonb_build_object('checklistItemId', checklist_item_id_input, 'created', false, 'resolution', resolution_input)
  );

  return updated_item;
end;
$$;
revoke all on function public.issueboard_link_checklist_item_subtask(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.issueboard_link_checklist_item_subtask(uuid, uuid, text, text) to service_role;

-- Unlinks a checklist item from its subtask without deleting either record.
create or replace function public.issueboard_unlink_checklist_item_subtask(
  checklist_item_id_input uuid,
  actor_input text
)
returns public.issueboard_checklist_items language plpgsql security definer set search_path = '' as $$
declare
  current_item public.issueboard_checklist_items;
  updated_item public.issueboard_checklist_items;
  owning_issue_id uuid;
  owning_project_id uuid;
begin
  select * into current_item from public.issueboard_checklist_items where id = checklist_item_id_input;
  if current_item.id is null then raise exception 'Checklist item not found'; end if;
  if current_item.linked_subtask_id is null then raise exception 'Checklist item is not linked to a subtask'; end if;

  select c.issue_id into owning_issue_id from public.issueboard_checklists c where c.id = current_item.checklist_id;
  select project_id into owning_project_id from public.issueboard_issues where id = owning_issue_id;

  update public.issueboard_checklist_items
    set linked_subtask_id = null, updated_by = actor_input
    where id = checklist_item_id_input
    returning * into updated_item;

  insert into public.issueboard_audit_events (project_id, issue_id, actor, action, safe_metadata)
  values (
    owning_project_id, current_item.linked_subtask_id, actor_input, 'checklist_item.unlinked',
    jsonb_build_object('checklistItemId', checklist_item_id_input)
  );

  return updated_item;
end;
$$;
revoke all on function public.issueboard_unlink_checklist_item_subtask(uuid, text) from public, anon, authenticated;
grant execute on function public.issueboard_unlink_checklist_item_subtask(uuid, text) to service_role;
