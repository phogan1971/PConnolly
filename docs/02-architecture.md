# DealerOps — Technical Architecture

## Stack (locked for MVP)

| Layer | Choice | Why |
|---|---|---|
| App framework | **Next.js 15 (App Router)** + TypeScript | One codebase for admin app, public website, and API routes |
| Styling | **Tailwind CSS** + lightweight shadcn-style primitives | Fast UI, consistent design tokens |
| Database | **PostgreSQL** | Relational data, JSON columns where useful, full-text search later |
| ORM | **Prisma** | Schema-first, type-safe, good migration story |
| Auth | **Auth.js (NextAuth) v5** with credentials + email magic-link | No vendor lock-in. Swappable for Clerk if we want hosted MFA. |
| Image storage | Pluggable `MediaStorage` interface; default `LocalStorage` for dev, `S3Storage` for prod | Avoids hard coupling to one vendor |
| Background jobs | Postgres-backed `jobs` table + `/api/jobs/run` endpoint triggered by cron (Vercel Cron / GitHub Actions) | Zero extra infra in MVP. Inngest/Trigger.dev later. |
| Email | Provider interface; `ConsoleEmail` in dev, `Resend` in prod | Same swap pattern as media |
| Analytics | First-party events table → nightly rollup into `vehicle_metrics_daily` | No third-party trackers on public pages |
| Hosting | Vercel (app) + Neon/Supabase (Postgres) + S3 (R2/Cloudflare or AWS) | All have generous free/cheap tiers |

## High-level diagram

```
                 ┌───────────────────────────┐
   Public        │   Next.js (public site)   │
   visitors ───►│   /stock, /stock/[slug]    │──► writes events &
                 │   enquiry/finance/td      │    leads to DB
                 └─────────────┬─────────────┘
                               │ same Next.js process
                 ┌─────────────▼─────────────┐
   Office  ────►│  Next.js (/admin/*)        │
   staff        │  RSC + Server Actions      │
                 └─────┬──────────────┬──────┘
                       │              │
                       ▼              ▼
                  ┌────────┐   ┌──────────────┐
                  │Postgres│   │  Channel     │
                  │ Prisma │   │  Adapters    │
                  └────────┘   │  (Website,   │
                       ▲       │   CarzoneExport,
                       │       │   MockApi)   │
                  ┌────┴────┐   └──────┬──────┘
                  │  Jobs   │          │
                  │ runner  │──────────┘
                  └─────────┘
```

## Code layout

```
/app
  /(public)            ← public website (stock, vehicle detail, forms)
  /(marketing)         ← optional landing pages
  /admin               ← admin app, role-gated
  /api                 ← REST/JSON endpoints (enquiries, jobs, webhooks, exports)
/lib
  /db                  ← Prisma client, query helpers
  /auth                ← Auth.js config, RBAC helpers
  /channels            ← ListingChannelAdapter interface + implementations
  /media               ← MediaStorage interface + Local/S3
  /email               ← Email provider interface
  /jobs                ← job runner, registered handlers
  /ai                  ← advert generator (provider-agnostic interface)
  /compliance          ← rule-based vehicle compliance checker
  /metrics             ← event recorder + daily rollup
  /audit               ← audit log writer
/components            ← shared UI
/prisma                ← schema.prisma, migrations, seed.ts
/docs                  ← this folder
```

## Adapter pattern (the key architectural decision)

Every external publishing target implements:

```ts
export interface ListingChannelAdapter {
  readonly id: string;            // 'website' | 'carzone-export' | 'carzone-api'
  readonly displayName: string;
  validateVehicle(v: Vehicle): ValidationResult;
  buildPayload(v: Vehicle): ChannelPayload;
  publish(v: Vehicle): Promise<PublishResult>;
  unpublish(v: Vehicle): Promise<PublishResult>;
  update(v: Vehicle): Promise<PublishResult>;
}
```

Implementations in MVP:

- **`WebsiteAdapter`** — flips `vehicle_channel_publications.status = published` for the
  `website` channel. The public site renders only vehicles with that row in `published`.
- **`CarzoneExportAdapter`** — validates against Carzone-required fields, writes
  payload JSON, emits a CSV + XML feed file at `/api/exports/carzone/feed.{csv,xml}`,
  and marks the publication `ready_for_carzone_export`. Operator manually hands the file
  off (or hosts it for an approved feed-pull). **No scraping. No login automation.**
- **`MockCarzoneApiAdapter`** — for local/CI; pretends to push and returns a fake
  external listing id. Never wired in production.

When the official Carzone/Motion API becomes available, we add a fourth adapter and
flip `channels.config_json.adapter` for the `carzone` channel — no caller changes.

## Auth & RBAC

- Auth.js with email magic-link primary, password fallback for the dealership owner.
- Single `User.role` enum: `admin | manager | office | sales | viewer`.
- Server-side `requireRole(...)` helper used in every Server Action and `/api` route.
- Public site is fully unauthenticated.

## Background jobs

- `jobs` table: `(id, kind, payload, run_at, attempts, status, last_error)`.
- `/api/jobs/run` pulls due jobs and runs registered handlers (idempotent).
- Triggered every minute by Vercel Cron in prod, manually in dev.
- Initial handlers: `metrics.rollupDaily`, `leads.autoAssign`, `stock.ageingDigest`,
  `channels.retryFailedPublishes`.

## Event tracking

- Public-site interactions (`vehicle_view`, `phone_click`, `whatsapp_click`,
  `finance_click`, `enquiry_submit`, `test_drive_submit`) write a row to
  `vehicle_metric_events` server-side.
- Nightly job aggregates into `vehicle_metrics_daily`.
- No third-party JS trackers on public pages by default (GDPR-light).

## Security posture

- All write paths are Server Actions or `POST /api/*` with Zod validation.
- CSRF protected by Auth.js for admin; public forms use a hashed token + Turnstile/hCaptcha.
- Rate-limit middleware on `/api/leads/*` (sliding window in Postgres or Upstash later).
- Role checks enforced server-side; UI checks are cosmetic.
- Audit log row written for every vehicle update, price change, lead status change,
  publish/unpublish event.
- Secrets in env vars only; `.env.example` committed, `.env` ignored.

## Environments

| Env | DB | Storage | Email |
|---|---|---|---|
| local | Postgres in Docker (or Neon branch) | `LocalStorage` (`/public/uploads`) | `ConsoleEmail` |
| preview | Neon branch DB | S3 dev bucket | Resend (sandbox) |
| production | Neon prod | S3 prod bucket | Resend (live) |

## Observability

- Structured logging with `pino` (JSON in prod).
- Sentry for app errors (defer to post-MVP if budget tight).
- `/api/health` returns DB + storage reachability.
