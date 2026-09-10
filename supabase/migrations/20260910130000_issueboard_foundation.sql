-- Issueboard foundation. Interactive users authenticate with NextAuth; only the
-- server-side service role accesses these tables. RLS therefore defaults closed.

create extension if not exists pgcrypto;

create table public.issueboard_schema_versions (
  version text primary key,
  applied_at timestamptz not null default now()
);

create table public.issueboard_rate_limits (
  bucket_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count > 0)
);

create or replace function public.issueboard_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.issueboard_projects (
  id uuid primary key default gen_random_uuid(),
  project_key text not null unique check (project_key ~ '^[A-Z][A-Z0-9]{1,9}$'),
  name text not null check (char_length(trim(name)) between 2 and 100),
  description text not null default '',
  color text not null default '#047857',
  next_issue_number bigint not null default 1 check (next_issue_number > 0),
  default_issue_type text not null default 'task',
  default_priority text not null default 'medium',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null,
  updated_by text not null
);

create table public.issueboard_statuses (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.issueboard_projects on delete cascade,
  name text not null, category text not null check (category in ('backlog','todo','in_progress','done')),
  color text not null, position integer not null check (position >= 0), wip_limit integer check (wip_limit > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (project_id, name), unique (project_id, position)
);

create table public.issueboard_sprints (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.issueboard_projects on delete cascade,
  name text not null, goal text not null default '', sequence integer not null check (sequence > 0),
  state text not null default 'planned' check (state in ('planned','active','completed','cancelled')),
  starts_at timestamptz, ends_at timestamptz, completed_at timestamptz, capacity_notes text not null default '', retrospective text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by text not null, updated_by text not null,
  unique (project_id, sequence), check (starts_at is null or ends_at is null or starts_at < ends_at)
);
create unique index issueboard_one_active_sprint_per_project on public.issueboard_sprints(project_id) where state = 'active';

create table public.issueboard_issues (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.issueboard_projects on delete restrict,
  issue_number bigint not null check (issue_number > 0), sprint_id uuid references public.issueboard_sprints on delete set null,
  parent_issue_id uuid references public.issueboard_issues on delete set null, status_id uuid not null references public.issueboard_statuses on delete restrict,
  issue_type text not null check (issue_type in ('task','story','bug','epic','feature','improvement','research','subtask')),
  title text not null check (char_length(trim(title)) between 3 and 200), description text not null default '',
  priority text not null default 'medium' check (priority in ('highest','high','medium','low','lowest')),
  work_state text not null default 'normal' check (work_state in ('normal','blocked','rejected')),
  reporter text not null, assignee text, story_points numeric(6,2) check (story_points >= 0),
  start_at timestamptz, due_at timestamptz, completed_at timestamptz, rank text not null,
  source text not null default 'website' check (source in ('website','slack','api','import','system')),
  source_reference text, archived_at timestamptz, deleted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by text not null, updated_by text not null,
  unique (project_id, issue_number), check (parent_issue_id is null or parent_issue_id <> id)
);
create unique index issueboard_issues_source_reference on public.issueboard_issues(source, source_reference) where source_reference is not null;
create index issueboard_issues_project_status_rank on public.issueboard_issues(project_id, status_id, rank) where deleted_at is null;
create index issueboard_issues_sprint_rank on public.issueboard_issues(sprint_id, rank) where deleted_at is null;
create index issueboard_issues_parent on public.issueboard_issues(parent_issue_id) where parent_issue_id is not null;
create index issueboard_issues_due on public.issueboard_issues(due_at) where completed_at is null and deleted_at is null;

create table public.issueboard_labels (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.issueboard_projects on delete cascade,
  name text not null, normalized_name text generated always as (lower(trim(name))) stored, background_color text not null, text_color text not null,
  created_at timestamptz not null default now(), created_by text not null, unique (project_id, normalized_name)
);
create table public.issueboard_issue_labels (
  issue_id uuid not null references public.issueboard_issues on delete cascade, label_id uuid not null references public.issueboard_labels on delete cascade,
  created_at timestamptz not null default now(), created_by text not null, primary key (issue_id, label_id)
);

create table public.issueboard_checklists (
  id uuid primary key default gen_random_uuid(), issue_id uuid not null references public.issueboard_issues on delete cascade,
  title text not null default 'Checklist', position integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by text not null, updated_by text not null
);
create table public.issueboard_checklist_items (
  id uuid primary key default gen_random_uuid(), checklist_id uuid not null references public.issueboard_checklists on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000), is_complete boolean not null default false,
  linked_subtask_id uuid references public.issueboard_issues on delete set null, position integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by text not null, updated_by text not null
);

create table public.issueboard_relationships (
  id uuid primary key default gen_random_uuid(), source_issue_id uuid not null references public.issueboard_issues on delete cascade,
  target_issue_id uuid not null references public.issueboard_issues on delete cascade,
  relationship_type text not null check (relationship_type in ('relates_to','blocks','duplicates')),
  created_at timestamptz not null default now(), created_by text not null,
  check (source_issue_id <> target_issue_id), unique (source_issue_id, target_issue_id, relationship_type)
);

create table public.issueboard_comments (
  id uuid primary key default gen_random_uuid(), issue_id uuid not null references public.issueboard_issues on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 50000), author text not null, edited_at timestamptz, deleted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.issueboard_attachments (
  id uuid primary key default gen_random_uuid(), issue_id uuid not null references public.issueboard_issues on delete cascade,
  bucket_id text not null default 'issueboard-private', object_path text not null unique,
  original_filename text not null, display_name text not null, mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  byte_size bigint not null check (byte_size > 0), width integer check (width > 0), height integer check (height > 0), checksum_sha256 text,
  state text not null default 'pending' check (state in ('pending','ready','failed','deleted')),
  created_at timestamptz not null default now(), finalized_at timestamptz, deleted_at timestamptz, created_by text not null
);

create table public.issueboard_audit_events (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.issueboard_projects on delete restrict,
  issue_id uuid references public.issueboard_issues on delete set null, actor text not null, action text not null,
  safe_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_metadata) = 'object'),
  request_id text, created_at timestamptz not null default now()
);
create index issueboard_audit_project_created on public.issueboard_audit_events(project_id, created_at desc);
create index issueboard_audit_issue_created on public.issueboard_audit_events(issue_id, created_at desc) where issue_id is not null;

create or replace function public.issueboard_allocate_issue_number(target_project_id uuid)
returns bigint language plpgsql security definer set search_path = '' as $$
declare allocated bigint;
begin
  update public.issueboard_projects set next_issue_number = next_issue_number + 1
  where id = target_project_id and archived_at is null returning next_issue_number - 1 into allocated;
  if allocated is null then raise exception 'Project not found or archived'; end if;
  return allocated;
end;
$$;
revoke all on function public.issueboard_allocate_issue_number(uuid) from public, anon, authenticated;
grant execute on function public.issueboard_allocate_issue_number(uuid) to service_role;

create or replace function public.issueboard_consume_rate_limit(
  target_bucket_key text,
  request_limit integer default 20,
  window_seconds integer default 60
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare allowed boolean;
begin
  if request_limit < 1 or window_seconds < 1 then raise exception 'Invalid rate limit configuration'; end if;
  insert into public.issueboard_rate_limits (bucket_key, window_started_at, request_count)
  values (target_bucket_key, now(), 1)
  on conflict (bucket_key) do update set
    request_count = case when public.issueboard_rate_limits.window_started_at <= now() - make_interval(secs => window_seconds) then 1 else public.issueboard_rate_limits.request_count + 1 end,
    window_started_at = case when public.issueboard_rate_limits.window_started_at <= now() - make_interval(secs => window_seconds) then now() else public.issueboard_rate_limits.window_started_at end
  returning request_count <= request_limit into allowed;
  return allowed;
end;
$$;
revoke all on function public.issueboard_consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.issueboard_consume_rate_limit(text, integer, integer) to service_role;

create or replace function public.issueboard_create_project(
  project_key_input text,
  name_input text,
  description_input text,
  default_issue_type_input text,
  actor_input text
)
returns public.issueboard_projects language plpgsql security definer set search_path = '' as $$
declare created_project public.issueboard_projects;
begin
  insert into public.issueboard_projects (project_key, name, description, default_issue_type, created_by, updated_by)
  values (upper(trim(project_key_input)), trim(name_input), coalesce(trim(description_input), ''), default_issue_type_input, actor_input, actor_input)
  returning * into created_project;

  insert into public.issueboard_statuses (project_id, name, category, color, position, wip_limit) values
    (created_project.id, 'Backlog', 'backlog', '#94a3b8', 0, null),
    (created_project.id, 'To do', 'todo', '#64748b', 1, 8),
    (created_project.id, 'In progress', 'in_progress', '#3b82f6', 2, 4),
    (created_project.id, 'Review', 'in_progress', '#f59e0b', 3, 3),
    (created_project.id, 'Testing', 'in_progress', '#8b5cf6', 4, 3),
    (created_project.id, 'Done', 'done', '#10b981', 5, null);

  insert into public.issueboard_audit_events (project_id, actor, action, safe_metadata)
  values (created_project.id, actor_input, 'project.created', jsonb_build_object('projectKey', created_project.project_key));
  return created_project;
end;
$$;
revoke all on function public.issueboard_create_project(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.issueboard_create_project(text, text, text, text, text) to service_role;

do $$ declare table_name text; begin
  foreach table_name in array array['issueboard_schema_versions','issueboard_rate_limits','issueboard_projects','issueboard_statuses','issueboard_sprints','issueboard_issues','issueboard_labels','issueboard_issue_labels','issueboard_checklists','issueboard_checklist_items','issueboard_relationships','issueboard_comments','issueboard_attachments','issueboard_audit_events']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
  end loop;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['issueboard_projects','issueboard_statuses','issueboard_sprints','issueboard_issues','issueboard_checklists','issueboard_checklist_items','issueboard_comments']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.issueboard_set_updated_at()', table_name || '_updated_at', table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('issueboard-private', 'issueboard-private', false, 1048576, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into public.issueboard_schema_versions (version) values ('20260910130000');

-- No storage.objects policies are created: browser reads and writes require
-- short-lived server-authorized signed URLs; anon/authenticated access stays denied.
