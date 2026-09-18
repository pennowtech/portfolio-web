-- Label management for project settings (§6.4): explicit create, edit, and
-- delete. Unlike statuses, labels are optional tags -- issueboard_issue_labels
-- already cascades on delete, so removing a label just detaches it from any
-- issues that had it rather than being blocked.

create or replace function public.issueboard_create_label(
  project_id_input uuid,
  name_input text,
  background_color_input text,
  text_color_input text,
  actor_input text
)
returns public.issueboard_labels language plpgsql security definer set search_path = '' as $$
declare created_label public.issueboard_labels;
begin
  if not exists (select 1 from public.issueboard_projects where id = project_id_input and archived_at is null) then
    raise exception 'Project not found or archived';
  end if;

  if exists (
    select 1 from public.issueboard_labels
    where project_id = project_id_input and normalized_name = lower(trim(name_input))
  ) then
    raise exception 'LABEL_EXISTS: a label with this name already exists in this project';
  end if;

  insert into public.issueboard_labels (project_id, name, background_color, text_color, created_by)
  values (project_id_input, trim(name_input), background_color_input, text_color_input, actor_input)
  returning * into created_label;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (project_id_input, actor_input, 'label.created', jsonb_build_object('labelId', created_label.id, 'name', created_label.name));

  return created_label;
end;
$$;
revoke all on function public.issueboard_create_label(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.issueboard_create_label(uuid, text, text, text, text) to service_role;

create or replace function public.issueboard_update_label(
  label_id_input uuid,
  name_input text,
  background_color_input text,
  text_color_input text,
  actor_input text
)
returns public.issueboard_labels language plpgsql security definer set search_path = '' as $$
declare updated_label public.issueboard_labels;
begin
  if not exists (select 1 from public.issueboard_labels where id = label_id_input) then
    raise exception 'Label not found';
  end if;

  if exists (
    select 1 from public.issueboard_labels l
    where l.id <> label_id_input
      and l.project_id = (select project_id from public.issueboard_labels where id = label_id_input)
      and l.normalized_name = lower(trim(name_input))
  ) then
    raise exception 'LABEL_EXISTS: a label with this name already exists in this project';
  end if;

  update public.issueboard_labels set
    name = trim(name_input),
    background_color = background_color_input,
    text_color = text_color_input
  where id = label_id_input
  returning * into updated_label;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (updated_label.project_id, actor_input, 'label.updated', jsonb_build_object('labelId', updated_label.id, 'name', updated_label.name));

  return updated_label;
end;
$$;
revoke all on function public.issueboard_update_label(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.issueboard_update_label(uuid, text, text, text, text) to service_role;

create or replace function public.issueboard_delete_label(
  label_id_input uuid,
  actor_input text
)
returns void language plpgsql security definer set search_path = '' as $$
declare target_label public.issueboard_labels;
begin
  select * into target_label from public.issueboard_labels where id = label_id_input;
  if target_label.id is null then raise exception 'Label not found'; end if;

  delete from public.issueboard_labels where id = label_id_input;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (target_label.project_id, actor_input, 'label.deleted', jsonb_build_object('labelId', label_id_input, 'name', target_label.name));
end;
$$;
revoke all on function public.issueboard_delete_label(uuid, text) from public, anon, authenticated;
grant execute on function public.issueboard_delete_label(uuid, text) to service_role;
