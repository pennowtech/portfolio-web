-- Private bookshelf storage. The browser never talks to this table directly;
-- authenticated admin API routes use the server-side service role.

create table public.books_library (
  id text primary key,
  title text not null check (char_length(trim(title)) between 1 and 300),
  author text not null check (char_length(trim(author)) between 1 and 300),
  shelf text not null check (shelf in ('technical', 'philosophy', 'fiction', 'business', 'wishlist')),
  status text not null check (status in ('wishlist', 'queued', 'reading', 'completed', 'reference')),
  current_page integer not null default 0 check (current_page >= 0),
  total_pages integer not null check (total_pages > 0 and current_page <= total_pages),
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  format text not null default 'physical' check (format in ('physical', 'ebook', 'audio')),
  genre text not null default 'General',
  language text not null default 'English',
  publisher text not null default '',
  published_year integer check (published_year between 1000 and 9999),
  isbn text not null default '',
  description text not null default '',
  key_themes jsonb not null default '[]'::jsonb check (jsonb_typeof(key_themes) = 'array'),
  target_audience jsonb not null default '[]'::jsonb check (jsonb_typeof(target_audience) = 'array'),
  similar_books jsonb not null default '[]'::jsonb check (jsonb_typeof(similar_books) = 'array'),
  notable_quotes jsonb not null default '[]'::jsonb check (jsonb_typeof(notable_quotes) = 'array'),
  cover_local_path text,
  cover_url text,
  cover_image text,
  cover_color text,
  notes text not null default '',
  legacy text not null default '',
  sales text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.books_library_state (
  singleton boolean primary key default true check (singleton),
  seeded_at timestamptz not null default now()
);

create index books_library_shelf_title on public.books_library (shelf, lower(title));
create index books_library_status_updated on public.books_library (status, updated_at desc);

alter table public.books_library enable row level security;
alter table public.books_library_state enable row level security;
revoke all on table public.books_library from anon, authenticated;
revoke all on table public.books_library_state from anon, authenticated;
grant all on table public.books_library to service_role;
grant all on table public.books_library_state to service_role;

create trigger books_library_updated_at
before update on public.books_library
for each row execute function public.issueboard_set_updated_at();
