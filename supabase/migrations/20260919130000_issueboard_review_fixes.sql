-- Code review fixes for the issue-detail/project-settings rebuild:
--   1. `issueboard_attachments.mime_type` only allowed the 3 original image
--      types, so the app layer had started smuggling the real mime type into
--      the unrelated `created_by` audit column to work around it. Widen the
--      constraint to the full set the app actually wants to support (still no
--      SVG -- see utils/issueboard/attachmentTypes.js for why) so the app can
--      store the real value directly.
--   2. Match the storage bucket's own `allowed_mime_types`/`file_size_limit`
--      to the same set, since that's the layer that was actually still
--      enforcing the old 3-type/1MB limits regardless of app-level checks.
--   3. `issueboard_relationships` had the same smuggling problem for the
--      predecessor/successor/parent/child distinction (encoded into
--      `created_by` as `#rel:<kind>`). Add a real `relationship_kind` column.
--   4. Project "users" had no table at all -- they were being reconstructed
--      by mining `issueboard_audit_events` rows and guessing emails from
--      issue reporter/assignee names. Add a real table + atomic RPCs,
--      following the same pattern as issueboard_labels.

do $$
declare check_name text;
begin
  select con.conname into check_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
  where rel.relname = 'issueboard_attachments' and con.contype = 'c' and att.attname = 'mime_type';
  if check_name is not null then
    execute format('alter table public.issueboard_attachments drop constraint %I', check_name);
  end if;
end $$;

alter table public.issueboard_attachments
  add constraint issueboard_attachments_mime_type_check
  check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'application/json', 'application/zip'));

update storage.buckets
  set file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'application/json', 'application/zip']
  where id = 'issueboard-private';

alter table public.issueboard_relationships add column if not exists relationship_kind text;

create table if not exists public.issueboard_project_users (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.issueboard_projects on delete cascade,
  name text not null,
  email text not null,
  normalized_email text generated always as (lower(trim(email))) stored,
  role text not null default 'Member',
  avatar_url text,
  created_at timestamptz not null default now(),
  created_by text not null,
  unique (project_id, normalized_email)
);
alter table public.issueboard_project_users enable row level security;
revoke all on table public.issueboard_project_users from anon, authenticated;
grant all on table public.issueboard_project_users to service_role;

create or replace function public.issueboard_add_project_user(
  project_id_input uuid,
  name_input text,
  email_input text,
  role_input text,
  actor_input text
)
returns public.issueboard_project_users language plpgsql security definer set search_path = '' as $$
declare created_user public.issueboard_project_users;
begin
  if not exists (select 1 from public.issueboard_projects where id = project_id_input and archived_at is null) then
    raise exception 'Project not found or archived';
  end if;

  if exists (
    select 1 from public.issueboard_project_users
    where project_id = project_id_input and normalized_email = lower(trim(email_input))
  ) then
    raise exception 'USER_EXISTS: a user with this email already exists in this project';
  end if;

  insert into public.issueboard_project_users (project_id, name, email, role, created_by)
  values (project_id_input, trim(name_input), trim(email_input), coalesce(nullif(trim(role_input), ''), 'Member'), actor_input)
  returning * into created_user;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (project_id_input, actor_input, 'user.added', jsonb_build_object('userId', created_user.id, 'email', created_user.email));

  return created_user;
end;
$$;
revoke all on function public.issueboard_add_project_user(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.issueboard_add_project_user(uuid, text, text, text, text) to service_role;

create or replace function public.issueboard_remove_project_user(
  project_id_input uuid,
  email_input text,
  actor_input text
)
returns void language plpgsql security definer set search_path = '' as $$
declare target_user public.issueboard_project_users;
begin
  select * into target_user from public.issueboard_project_users
    where project_id = project_id_input and normalized_email = lower(trim(email_input));
  if target_user.id is null then raise exception 'User not found'; end if;

  delete from public.issueboard_project_users where id = target_user.id;

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (project_id_input, actor_input, 'user.removed', jsonb_build_object('userId', target_user.id, 'email', target_user.email));
end;
$$;
revoke all on function public.issueboard_remove_project_user(uuid, text, text) from public, anon, authenticated;
grant execute on function public.issueboard_remove_project_user(uuid, text, text) to service_role;
