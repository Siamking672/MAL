# MAL Dashboard

A modern personal MyAnimeList dashboard built with **Next.js**, **TypeScript**, **Tailwind CSS**, **Jikan API**, and **Turso/libSQL cache**.

## What this project does

- Pulls public MyAnimeList profile data using Jikan.
- Pulls anime list and manga list.
- Stores synced data in Turso cache so the site loads fast.
- Shows a modern dashboard with stats, filters, sorting, detail modal, dark/light mode, and responsive design.
- Lets you save a MAL username and manually sync from the Settings page.

## Important note about Jikan

Jikan is an unofficial, auth-less, read-only MyAnimeList API. That means this project does **not** use MAL access tokens or refresh tokens. It can display public user list data, but it cannot update your MAL account.

If you later want real login/private list access/update-progress support, replace Jikan with the official MyAnimeList API OAuth flow.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open:

```txt
http://localhost:3000
```

## Environment variables

```env
MAL_USERNAME=your_mal_username
TURSO_DATABASE_URL=libsql://your-db-name-your-org.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
JIKAN_BASE_URL=https://api.jikan.moe/v4
CACHE_TTL_SECONDS=21600
```

For local development, if `TURSO_DATABASE_URL` is empty, the app uses a local file database:

```txt
file:local.db
```

## Turso setup

```bash
turso db create mal-dashboard
turso db show mal-dashboard
turso db tokens create mal-dashboard
```

Put the database URL and auth token in `.env.local` or `.dev.vars`.

The app automatically creates this table:

```sql
CREATE TABLE IF NOT EXISTS cache_entries (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## Pages

- `/` - Home dashboard
- `/anime` - Anime list with search, filters, sort, grid/list view
- `/manga` - Manga list with search, filters, sort, grid/list view
- `/stats` - Score and status stats
- `/settings` - Save MAL username and manual sync

## API routes

- `GET /api/dashboard` - Returns cached/synced dashboard data
- `POST /api/sync` - Manually syncs profile, anime list, and manga list
- `GET /api/settings` - Reads saved username and last sync
- `POST /api/settings` - Saves username
- `GET /api/details?kind=anime&id=1` - Pulls and caches full anime/manga details

## Cloudflare deployment

This app has API routes, so deploy it to **Cloudflare Workers using OpenNext**.

```bash
npm install
cp .dev.vars.example .dev.vars
npx wrangler login
npm run preview
npm run deploy
```

Add production secrets before deploying:

```bash
npx wrangler secret put TURSO_DATABASE_URL
npx wrangler secret put TURSO_AUTH_TOKEN
npx wrangler secret put MAL_USERNAME
npx wrangler secret put JIKAN_BASE_URL
npx wrangler secret put CACHE_TTL_SECONDS
```

Full deployment steps are in `CLOUDFLARE_DEPLOY.md`.


## Cloudflare/Turso import note

This project imports Turso with `@tursodatabase/serverless/web` because Cloudflare Workers need the web driver. Do not change it back to `@tursodatabase/serverless`, or OpenNext/Cloudflare may fail while bundling the Worker.
