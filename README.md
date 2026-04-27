# DealerOps

Internal operations app for an Irish car dealership: stock management, website
publishing, Carzone export adapter, leads, tasks, and reporting.

> **Working name.** Final brand TBD. See `docs/01-prd.md`.

## What's in this commit

This is the **Phase 0 + Phase 1 vertical slice**. You can:

- Add, edit, photograph, price, and publish a vehicle to your own site.
- See the vehicle live on the public `/stock` and `/stock/[slug]` pages.
- Run the **compliance checker** before publish.
- Generate a **Carzone export** file (CSV + XML) for compliant manual handoff to Carzone — **no scraping, no shared logins**.
- Receive enquiries from the public site into the admin **lead inbox**.
- See an **audit log** of every change.

Carzone official API integration is stubbed behind an adapter interface. When credentials and spec are issued by Motion/Carzone, swap the adapter — no caller changes.

## Documentation

- [`docs/01-prd.md`](docs/01-prd.md) — product spec, scope, success metrics
- [`docs/02-architecture.md`](docs/02-architecture.md) — stack, code layout, adapter pattern
- [`docs/03-database-schema.md`](docs/03-database-schema.md) — entity reference
- [`docs/04-route-map.md`](docs/04-route-map.md) — routes, page map, workflow
- [`docs/05-implementation-plan.md`](docs/05-implementation-plan.md) — phased roadmap

## Running locally

Requirements: Node 20+, pnpm, Docker (for Postgres).

```bash
# 1. Start Postgres
docker compose up -d

# 2. Install deps
pnpm install

# 3. Configure env
cp .env.example .env

# 4. Apply schema and seed demo data (1 dealership, 5 users, 6 vehicles, 2 channels)
pnpm db:setup

# 5. Run dev server
pnpm dev
```

Open http://localhost:3000 — public site at `/stock`, admin at `/admin`.

Demo logins (from seed):

| Email | Role |
|---|---|
| `owner@dealerops.local` | admin |
| `manager@dealerops.local` | manager |
| `office@dealerops.local` | office |
| `sales@dealerops.local` | sales |
| `viewer@dealerops.local` | viewer |

Password for all demo users: `dealerops`.

## Compliance: Carzone

This app does **not** scrape Carzone, automate the Carzone back-office, or share
logins. Three adapter modes are supported:

- `export` (default) — generates a CSV/XML feed file at
  `/api/exports/carzone/feed.{csv,xml}` for manual upload or feed-pull by an
  approved partner.
- `mock-api` — local-dev only.
- `api` — to be implemented once Motion/Carzone provide credentials and spec.

Switch via `CARZONE_ADAPTER` in `.env`.
