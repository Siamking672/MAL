# Deploy MAL Dashboard to Cloudflare Workers

This project uses API routes, so deploy it as a **Cloudflare Worker using OpenNext**, not as a static Cloudflare Pages export.

## 1. Install dependencies

```bash
npm install
```

## 2. Add local environment variables

Copy the example file:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:

```env
NEXTJS_ENV=development
MAL_USERNAME=your_mal_username
TURSO_DATABASE_URL=libsql://your-db-name-your-org.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
JIKAN_BASE_URL=https://api.jikan.moe/v4
CACHE_TTL_SECONDS=21600
```

## 3. Test locally

```bash
npm run dev
```

For a Cloudflare-like local preview:

```bash
npm run preview
```

## 4. Login to Cloudflare

```bash
npx wrangler login
```

## 5. Add Cloudflare Worker secrets

```bash
npx wrangler secret put TURSO_DATABASE_URL
npx wrangler secret put TURSO_AUTH_TOKEN
npx wrangler secret put MAL_USERNAME
npx wrangler secret put JIKAN_BASE_URL
npx wrangler secret put CACHE_TTL_SECONDS
```

Use these values:

```txt
JIKAN_BASE_URL=https://api.jikan.moe/v4
CACHE_TTL_SECONDS=21600
```

## 6. Deploy

```bash
npm run deploy
```

After deployment, Wrangler will show a `workers.dev` URL.

## 7. Custom domain

Cloudflare Dashboard → Workers & Pages → your Worker → Settings → Domains & Routes → Add custom domain.

## Notes

- The app uses Turso as cache storage.
- Jikan is public/read-only, so there is no MAL OAuth login in this version.
- The Settings page can save a MAL username into Turso and run manual sync.


## Cloudflare/Turso import note

This project imports Turso with `@libsql/client/web` because Cloudflare Workers need the web driver. Do not change it back to `@libsql/client`, or OpenNext/Cloudflare may fail while bundling the Worker.
