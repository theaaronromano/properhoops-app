# ProperHoops — Basketball Digg

Tracks 500 basketball voices across Bluesky, Threads and the Fediverse.
Surfaces what's rising fastest in the basketball world right now.

## How it works

1. `/api/discover` — finds basketball voices on Bluesky, Threads and Mastodon (runs daily at 2am)
2. `/api/ingest` — fetches recent posts from tracked voices, extracts shared URLs (runs every 30 mins)
3. `/api/stories` — sends URL data to Claude AI, clusters into ranked stories by velocity (runs every 35 mins)
4. `/api/scores` — fetches live scores from ESPN API

## Deploy to Vercel

### Step 1 — Database
Run `supabase-schema.sql` in your Supabase SQL Editor (Project → SQL Editor → New query → paste → Run)

### Step 2 — GitHub
Push this entire folder to a new GitHub repo called `properhoops-app`

### Step 3 — Vercel
1. Go to vercel.com → New Project → Import from GitHub → select `properhoops-app`
2. Add these Environment Variables in Vercel (Project Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://vhpufzqavhsivzzvrwdm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
ANTHROPIC_API_KEY=<your anthropic key>
BSKY_HANDLE=properazza.bsky.social
BSKY_APP_PASSWORD=<your bluesky app password>
THREADS_APP_ID=<your threads app id>
THREADS_APP_SECRET=<your threads app secret>
INGEST_SECRET=properhoops_ingest_2026
```

3. Deploy

### Step 4 — Add logo
Put your `logo.png` in the `/public` folder and push to GitHub

### Step 5 — Point domain
In Cloudflare DNS for properhoops.au:
- CNAME → @ → cname.vercel-dns.com → Proxied ON
- CNAME → www → cname.vercel-dns.com → Proxied ON

In Vercel → Project Settings → Domains → Add → properhoops.au

### Step 6 — Bootstrap voices
After deploying, visit: `https://properhoops.au/api/discover` (POST with header `x-ingest-secret: properhoops_ingest_2026`)
Or just open the site — it will auto-bootstrap on first load.

## Local development
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Rotate keys before going live
1. Anthropic Console → API Keys → delete old → create new
2. Supabase → Settings → API → regenerate service role key
3. Update both in Vercel environment variables
