-- Article Studio version history. Notion's API exposes no readable revision
-- history, so the studio keeps its own snapshots: one is written after each
-- successful save/publish/restore. Access is server-only (service role), the
-- same as the issueboard tables; rows are scoped to the signed-in author.

create table if not exists public.article_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner text not null,
  -- Notion page id of the article; 'new' is never stored (unsaved drafts stay local).
  article_key text not null,
  kind text not null check (kind in ('notion_saved', 'published', 'restored')),
  title text not null default '',
  form jsonb not null check (jsonb_typeof(form) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists article_snapshots_lookup
  on public.article_snapshots (owner, article_key, created_at desc);

alter table public.article_snapshots enable row level security;
revoke all on table public.article_snapshots from anon, authenticated;
grant all on table public.article_snapshots to service_role;
