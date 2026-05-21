-- ============================================================
-- CineMate - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles (extends auth.users) ───────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Persons ─────────────────────────────────────────────────
create table if not exists public.persons (
  id uuid primary key default uuid_generate_v4(),
  tmdb_id integer unique not null,
  name text not null,
  biography text,
  birthday date,
  deathday date,
  place_of_birth text,
  gender integer,
  known_for_department text,
  popularity numeric,
  profile_path text,
  homepage text,
  imdb_id text,
  also_known_as jsonb default '[]',
  images jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists persons_tmdb_id_idx on public.persons(tmdb_id);
create index if not exists persons_name_idx on public.persons using gin(to_tsvector('english', name));

-- ─── Movies ───────────────────────────────────────────────────
create table if not exists public.movies (
  id uuid primary key default uuid_generate_v4(),
  tmdb_id integer unique not null,
  title text not null,
  original_title text,
  overview text,
  tagline text,
  status text,
  release_date date,
  runtime integer,
  budget bigint,
  revenue bigint,
  popularity numeric,
  vote_average numeric,
  vote_count integer,
  adult boolean default false,
  original_language text,
  homepage text,
  imdb_id text,
  poster_path text,
  backdrop_path text,
  genres jsonb default '[]',
  production_companies jsonb default '[]',
  production_countries jsonb default '[]',
  spoken_languages jsonb default '[]',
  keywords jsonb default '[]',
  videos jsonb default '[]',
  images jsonb default '{}',
  external_ids jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists movies_tmdb_id_idx on public.movies(tmdb_id);
create index if not exists movies_title_idx on public.movies using gin(to_tsvector('english', title));
create index if not exists movies_popularity_idx on public.movies(popularity desc);

-- ─── Series ───────────────────────────────────────────────────
create table if not exists public.series (
  id uuid primary key default uuid_generate_v4(),
  tmdb_id integer unique not null,
  name text not null,
  original_name text,
  overview text,
  tagline text,
  status text,
  type text,
  first_air_date date,
  last_air_date date,
  number_of_episodes integer,
  number_of_seasons integer,
  episode_run_time jsonb default '[]',
  popularity numeric,
  vote_average numeric,
  vote_count integer,
  adult boolean default false,
  original_language text,
  homepage text,
  in_production boolean,
  origin_country jsonb default '[]',
  languages jsonb default '[]',
  poster_path text,
  backdrop_path text,
  genres jsonb default '[]',
  networks jsonb default '[]',
  production_companies jsonb default '[]',
  production_countries jsonb default '[]',
  spoken_languages jsonb default '[]',
  seasons jsonb default '[]',
  keywords jsonb default '[]',
  videos jsonb default '[]',
  images jsonb default '{}',
  external_ids jsonb default '{}',
  created_by jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists series_tmdb_id_idx on public.series(tmdb_id);
create index if not exists series_name_idx on public.series using gin(to_tsvector('english', name));
create index if not exists series_popularity_idx on public.series(popularity desc);

-- ─── Movie Credits ────────────────────────────────────────────
create table if not exists public.movie_credits (
  id uuid primary key default uuid_generate_v4(),
  movie_id uuid references public.movies(id) on delete cascade,
  person_id uuid references public.persons(id) on delete cascade,
  tmdb_person_id integer,
  department text,
  job text,
  character text,
  credit_id text unique,
  "order" integer,
  cast_id integer,
  created_at timestamptz default now()
);

create index if not exists movie_credits_movie_id_idx on public.movie_credits(movie_id);
create index if not exists movie_credits_person_id_idx on public.movie_credits(person_id);

-- ─── Series Credits ───────────────────────────────────────────
create table if not exists public.series_credits (
  id uuid primary key default uuid_generate_v4(),
  series_id uuid references public.series(id) on delete cascade,
  person_id uuid references public.persons(id) on delete cascade,
  tmdb_person_id integer,
  department text,
  job text,
  character text,
  credit_id text unique,
  "order" integer,
  created_at timestamptz default now()
);

create index if not exists series_credits_series_id_idx on public.series_credits(series_id);
create index if not exists series_credits_person_id_idx on public.series_credits(person_id);

-- ─── Updated At Trigger ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists movies_updated_at on public.movies;
create trigger movies_updated_at before update on public.movies
  for each row execute procedure public.set_updated_at();

drop trigger if exists series_updated_at on public.series;
create trigger series_updated_at before update on public.series
  for each row execute procedure public.set_updated_at();

drop trigger if exists persons_updated_at on public.persons;
create trigger persons_updated_at before update on public.persons
  for each row execute procedure public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────

-- Profiles
alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert
  with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Movies (public read, admin write)
alter table public.movies enable row level security;
drop policy if exists "Anyone can read movies" on public.movies;
create policy "Anyone can read movies" on public.movies for select using (true);
drop policy if exists "Admins can insert movies" on public.movies;
create policy "Admins can insert movies" on public.movies for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "Admins can update movies" on public.movies;
create policy "Admins can update movies" on public.movies for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "Admins can delete movies" on public.movies;
create policy "Admins can delete movies" on public.movies for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Series (public read, admin write)
alter table public.series enable row level security;
drop policy if exists "Anyone can read series" on public.series;
create policy "Anyone can read series" on public.series for select using (true);
drop policy if exists "Admins can insert series" on public.series;
create policy "Admins can insert series" on public.series for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "Admins can update series" on public.series;
create policy "Admins can update series" on public.series for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "Admins can delete series" on public.series;
create policy "Admins can delete series" on public.series for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Persons (public read, admin write)
alter table public.persons enable row level security;
drop policy if exists "Anyone can read persons" on public.persons;
create policy "Anyone can read persons" on public.persons for select using (true);
drop policy if exists "Admins can insert persons" on public.persons;
create policy "Admins can insert persons" on public.persons for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "Admins can update persons" on public.persons;
create policy "Admins can update persons" on public.persons for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "Admins can delete persons" on public.persons;
create policy "Admins can delete persons" on public.persons for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Credits (public read, admin write)
alter table public.movie_credits enable row level security;
drop policy if exists "Anyone can read movie_credits" on public.movie_credits;
create policy "Anyone can read movie_credits" on public.movie_credits for select using (true);
drop policy if exists "Admins can manage movie_credits" on public.movie_credits;
create policy "Admins can manage movie_credits" on public.movie_credits for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

alter table public.series_credits enable row level security;
drop policy if exists "Anyone can read series_credits" on public.series_credits;
create policy "Anyone can read series_credits" on public.series_credits for select using (true);
drop policy if exists "Admins can manage series_credits" on public.series_credits;
create policy "Admins can manage series_credits" on public.series_credits for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ─── Grants (required for PostgREST access) ───────────────────
-- RLS policies are necessary but not sufficient: roles must also have table privileges.
grant usage on schema public to anon, authenticated;

grant select on table public.movies, public.series, public.persons to anon, authenticated;
grant select on table public.movie_credits, public.series_credits to anon, authenticated;

-- Admin operations happen as the `authenticated` role; RLS enforces admin-only access.
grant insert, update, delete on table public.movies, public.series, public.persons to authenticated;
grant insert, update, delete on table public.movie_credits, public.series_credits to authenticated;

-- Profiles are private to the signed-in user.
grant select, insert, update on table public.profiles to authenticated;

-- ─── Make a user admin (run manually) ────────────────────────
-- update public.profiles set role = 'admin' where id = '<user-uuid>';
