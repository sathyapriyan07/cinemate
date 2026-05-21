# CineMate 🎬

A minimal, mobile-first movies & series exploration website powered by TMDB and Supabase.

---

## Stack

- **Frontend**: React + Vite
- **Backend/DB**: Supabase (PostgreSQL)
- **Data Source**: TMDB API
- **Routing**: React Router v6
- **Styling**: Inline styles + CSS variables (zero dependencies)

---

## Setup

### 1. Clone & install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_TMDB_API_KEY=your-tmdb-v3-api-key
```

- **Supabase**: Create a project at [supabase.com](https://supabase.com)
- **TMDB**: Get a free API key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)

### 3. Run Supabase schema

In your Supabase project → SQL Editor, paste and run the contents of `supabase_schema.sql`.

### 4. Create an admin user

1. Sign up through the app (or Supabase Auth dashboard)
2. In Supabase SQL Editor, run:

```sql
update public.profiles
set role = 'admin'
where id = '<your-user-uuid>';
```

### 5. Start dev server

```bash
npm run dev
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — featured hero + popular movies/series |
| `/movies` | Browse all movies (search + genre filter) |
| `/movies/:id` | Movie detail (cast, crew, images, trailer) |
| `/series` | Browse all series (search + genre filter) |
| `/series/:id` | Series detail (seasons, cast, crew, images) |
| `/login` | Sign in / Sign up |
| `/admin` | Admin dashboard (admin only) |
| `/admin/import` | Search TMDB and import movies/series |
| `/admin/movies` | CRUD for movies |
| `/admin/series` | CRUD for series |
| `/admin/persons` | CRUD for persons |

---

## How Import Works

1. Admin searches TMDB by title
2. Clicks **Import** on any result
3. The importer fetches the full TMDB record (all fields, images as URLs, videos, keywords, etc.)
4. Fetches all cast & crew members individually and upserts them
5. Upserts the movie/series and all credits into Supabase
6. Duplicate TMDB IDs are safely upserted (no duplicates)

---

## Role System

- **user** (default): Can browse homepage, movies, series pages
- **admin**: After login, redirected to `/admin` only. Cannot access public pages. Has full CRUD + import access.

---

## Build

```bash
npm run build
# Output in /dist — deploy to Vercel, Netlify, Cloudflare Pages, etc.
```

# cinemate
