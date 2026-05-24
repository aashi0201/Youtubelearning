-- Supabase foundation schema for the YouTube Learning Platform.
-- This keeps auth/account data compatible with the existing app while feature
-- routes migrate from MongoDB to Postgres incrementally.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  email text unique not null,
  avatar text default '',
  bio text default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  level integer not null default 0,
  stats jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  unlocked_features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text unique not null,
  title text default '',
  description text default '',
  channel_title text default '',
  thumbnails jsonb not null default '{}'::jsonb,
  duration text default '',
  duration_sec integer not null default 0,
  tags text[] not null default '{}',
  transcript_text text default '',
  metadata_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  source_playlist_id text default '',
  videos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  youtube_id text not null,
  title text default '',
  watch_time_sec integer not null default 0,
  last_position_sec integer not null default 0,
  max_position_sec integer not null default 0,
  duration_sec integer not null default 0,
  completed boolean not null default false,
  last_watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, youtube_id)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  youtube_id text not null,
  title text default '',
  content text not null,
  timestamp_sec integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  youtube_id text not null,
  label text default '',
  note text default '',
  timestamp_sec integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  youtube_id text default '',
  type text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  source text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.app_health (
  id integer primary key default 1,
  checked_at timestamptz not null default now()
);

insert into public.app_health (id) values (1)
on conflict (id) do nothing;

create index if not exists idx_playlists_user_created on public.playlists(user_id, created_at desc);
create index if not exists idx_notes_user_video on public.notes(user_id, youtube_id);
create index if not exists idx_bookmarks_user_video on public.bookmarks(user_id, youtube_id);
create index if not exists idx_ai_interactions_user_created on public.ai_interactions(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.playlists enable row level security;
alter table public.progress enable row level security;
alter table public.notes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.ai_interactions enable row level security;

-- Policies should be tightened once Supabase Auth becomes the primary auth layer.
-- Backend service-role access bypasses RLS for the current incremental migration.
