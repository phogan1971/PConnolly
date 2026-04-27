# Deploying DealerOps to Netlify

## 1. Create a free Postgres database on Neon

1. Go to **https://neon.tech** and sign up (free tier is plenty for the MVP).
2. Create a project → name it `dealerops`.
3. On the dashboard, click **Connection string** → copy the `postgresql://...` URL.
   It looks like: `postgresql://dealerops_owner:XXXX@ep-xxx.eu-west-2.aws.neon.tech/dealerops?sslmode=require`

## 2. Run the schema + seed against Neon (one-time)

```bash
# In the repo root on your machine (or paste this into the Claude Code terminal):
DATABASE_URL="<your-neon-url>" pnpm db:push
DATABASE_URL="<your-neon-url>" pnpm db:seed
```

## 3. Connect the repo to Netlify

1. Go to **https://app.netlify.com** → Add new site → Import from Git → pick `phogan1971/PConnolly`.
2. Branch: `main` (or `claude/dealership-stock-app-GcZ7u` while in draft).
3. Build settings are auto-detected from `netlify.toml`:
   - Build command: `pnpm run build`
   - Publish directory: `.next`

## 4. Set environment variables in Netlify

In **Site settings → Environment variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `AUTH_SECRET` | Run `openssl rand -base64 32` and paste the result |
| `NEXTAUTH_URL` | Your Netlify site URL e.g. `https://dealerops.netlify.app` |
| `CARZONE_FEED_TOKEN` | Any random string — protects the feed endpoints |

Everything else is optional for the MVP (AI, email, SMS, S3 all fall back to safe defaults).

## 5. Deploy

Click **Deploy site**. The build runs `prisma generate && next build` — no DB connection
needed at build time. All DB calls happen at runtime via your Neon URL.

## 6. After deploy

- Public site: `https://your-site.netlify.app/stock`
- Admin: `https://your-site.netlify.app/admin/login`
- Demo logins: `owner@dealerops.local` / `dealerops` (from seed)

## Notes

- Netlify uses the `@netlify/plugin-nextjs` adapter (already in `netlify.toml`) which
  handles App Router server components, server actions, and API routes correctly.
- The Carzone export feed is at `/api/exports/carzone/feed.xml` — add `?token=<CARZONE_FEED_TOKEN>`
  if fetching without an admin session.
- To run the DB seed on Neon again: set `DATABASE_URL` to the Neon URL in a `.env.neon`
  file and run `dotenv -f .env.neon pnpm db:seed`, or just set it temporarily in your shell.
