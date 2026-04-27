# DealerOps — Route & Page Map

## Public website (`/app/(public)`)

| Path | Purpose | Notes |
|---|---|---|
| `/` | Marketing landing | Optional — links to `/stock` |
| `/stock` | Stock listing with filters | `?make=&model=&priceMax=&priceMin=&fuel=&transmission=&bodyType=&yearMin=&q=` |
| `/stock/[slug]` | Vehicle detail | SEO metadata, JSON-LD `Vehicle` structured data, image gallery, enquiry/finance/test-drive forms, click-to-call & WhatsApp tracked links |
| `/sitemap.xml` | Sitemap | Auto-generated from published vehicles |
| `/robots.txt` | Robots | |
| `/contact` | Dealer contact | Static-ish |
| `/privacy` | Privacy policy | Required for GDPR |

## Admin app (`/app/admin`)

All routes role-gated server-side via `requireRole(...)`.

| Path | Roles | Purpose |
|---|---|---|
| `/admin` | any | Redirects to dashboard |
| `/admin/dashboard` | admin, manager, office, sales | KPIs, ageing, compliance failures, channel errors |
| `/admin/stock` | admin, manager, office, sales | Stock list with filters, status, days-in-stock |
| `/admin/stock/new` | admin, manager, office | New vehicle form |
| `/admin/stock/[id]` | admin, manager, office, sales | Edit vehicle (general info, pricing, history) |
| `/admin/stock/[id]/media` | admin, manager, office | Upload, reorder, caption, set primary |
| `/admin/stock/[id]/publishing` | admin, manager, office | Per-channel status, validate, publish/unpublish, generate Carzone export |
| `/admin/stock/[id]/compliance` | admin, manager, office | Compliance checker results & quick fixes |
| `/admin/stock/[id]/ai` | admin, manager, office | AI advert assistant |
| `/admin/stock/[id]/audit` | admin, manager | Audit history for this vehicle |
| `/admin/leads` | admin, manager, sales | Inbox: filterable lead list |
| `/admin/leads/[id]` | admin, manager, sales | Lead detail, activities, tasks |
| `/admin/tasks` | admin, manager, sales | My tasks, overdue tasks |
| `/admin/reports` | admin, manager | Stock ageing, channel performance, lead funnel |
| `/admin/settings/dealership` | admin | Dealership profile |
| `/admin/settings/channels` | admin | Channel toggles & adapter config |
| `/admin/settings/users` | admin | Invite, change role, deactivate |
| `/admin/settings/audit` | admin | Global audit log |

## API routes (`/app/api`)

| Path | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/[...nextauth]` | * | — | Auth.js |
| `/api/leads` | POST | public, rate-limited | Public enquiry submissions |
| `/api/track` | POST | public, rate-limited | Public metric events (`vehicle_view`, `phone_click`, etc.) |
| `/api/uploads/sign` | POST | admin | Presigned upload URL (when S3 storage is enabled) |
| `/api/exports/carzone/feed.xml` | GET | admin or signed token | Carzone XML feed |
| `/api/exports/carzone/feed.csv` | GET | admin or signed token | Carzone CSV feed |
| `/api/jobs/run` | POST | cron secret | Run due background jobs |
| `/api/health` | GET | — | Health check |

Mutations from the admin app use **Server Actions** (not REST endpoints) so we get
type-safe forms with progressive enhancement and no manual JSON wiring.

## Information architecture (admin sidebar)

```
Dashboard
Stock
  ▸ All vehicles
  ▸ Drafts
  ▸ Ready
  ▸ Published
  ▸ Sold
Leads
Tasks
Reports
Settings
  ▸ Dealership
  ▸ Channels
  ▸ Users
  ▸ Audit
```

## Vehicle workflow state machine

```
DRAFT  ──[required fields ok]──►  IN_PREP  ──[photos + AI copy + compliance pass]──►  READY
READY  ──[publish website]──►  PUBLISHED
PUBLISHED  ──[manager marks reserved]──►  RESERVED  ──[deal falls through]──►  PUBLISHED
PUBLISHED  ──[mark sold]──►  SOLD  ──(auto unpublish all channels)
*  ──[archive]──►  ARCHIVED
```

Compliance check is required to leave `IN_PREP`. Carzone export can be generated only
from `READY` or `PUBLISHED`. Unpublishing is always allowed.
