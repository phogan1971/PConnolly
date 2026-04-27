# DealerOps — Product Requirements (MVP)

_Working name. Final brand TBD._

## 1. Problem

An Irish car dealership runs stock, marketing, leads, and admin across spreadsheets,
WhatsApp, the website CMS, and Carzone's back-office. The same vehicle data is re-typed
into multiple systems. Listings are inconsistent, photos are managed ad-hoc, leads fall
through the cracks, and management has no live view of stock health.

## 2. Goal

A single internal app — **DealerOps** — that becomes the operating system for stock:
add a car once, and reuse the data on the dealer website, on Carzone (via a compliant
adapter), in marketing, and in CRM follow-up. Reduce repetitive office work. Give
management a live dashboard.

## 3. Non-goals (MVP)

- Multi-dealership tenanting (data model supports it; UI assumes one).
- Native mobile apps.
- Full accounting/DMS replacement.
- Automating Carzone via scraping or shared logins. **Hard rule.**
- Direct payment / deposit collection.

## 4. Users & top jobs

| Role | Top jobs |
|---|---|
| Dealer principal / admin | Daily stock & lead overview, pricing decisions, channel performance, user management |
| Sales manager | Assign leads, monitor follow-ups, ageing stock, prep status |
| Office / admin staff | Add/edit vehicles, upload photos, run compliance checks, publish to web, generate Carzone exports |
| Salesperson | See their leads & tasks, log activities, send vehicle details |
| Website visitor | Browse stock, filter, see vehicle detail, submit enquiry / finance / test-drive |

## 5. MVP scope (what ships)

1. Secure login + roles (`admin`, `manager`, `office`, `sales`, `viewer`).
2. Vehicle stock database with full lifecycle status.
3. Vehicle create / edit form with checklist of required fields.
4. Vehicle media: upload, reorder, caption, alt text, primary image.
5. AI-assisted advert copy (title, short, long, SEO meta, social).
6. Compliance checker (price, VAT, mileage, location, sold-but-published, etc.).
7. Public website pages: `/stock`, `/stock/[slug]` with enquiry, finance, test-drive forms.
8. Channel publishing with **adapter architecture**:
   - `WebsiteAdapter` — real publish/unpublish.
   - `CarzoneExportAdapter` — generates compliant feed file (CSV + XML); marks status `ready_for_carzone_export`. **No scraping, no shared logins.**
   - `MockCarzoneApiAdapter` — dev/test only.
9. Lead inbox + per-lead activity timeline.
10. Tasks (auto-created on new lead, manual creation).
11. Metrics dashboard: stock health, ageing, leads by source/vehicle, channel errors.
12. Audit log on vehicles, prices, leads.

## 6. Compliance & privacy (must-haves)

- **No scraping or browser automation against Carzone.** External channels go through
  exports today, official API/feed when credentials and spec are available, or an
  approved partner intermediary. Adapter interface lets us swap without rewrites.
- **Human-in-the-loop** before any third-party publish in MVP — operator clicks
  "Generate export" / "Publish to Carzone" explicitly.
- GDPR: lawful-basis fields on leads, marketing-consent flag, data export & delete on
  request, encrypted at rest (managed by Postgres provider), audit trail.
- Customer data is never exposed publicly. Internal notes never leave admin pages.
- Rate limit + spam protection on every public form.
- All third-party API credentials server-side in env vars only.

## 7. Success metrics (first 90 days post-launch)

| Outcome | Metric | Target |
|---|---|---|
| Faster listing | Median time from "vehicle acquired" to "live on website" | < 24h |
| Less double entry | Vehicles created in DealerOps and re-typed elsewhere | 0 |
| Lead capture | Enquiries logged in DealerOps / month | ≥ 95% of total |
| Stock health visibility | Cars > 60 days unflagged | 0 |
| Compliance | Listings published with missing required field | 0 |

## 8. Assumptions (carrying forward, override anytime)

- One dealership at first. Data model is multi-dealer; UI assumes one.
- Ireland market. EUR. Kilometres. Cars first; commercials later.
- VAT-inclusive pricing supported with explicit `vat_included` flag.
- Own-website publishing comes before Carzone automation.
- Carzone integration is adapter-based and compliant; manual export is the default.
- Human approval is required before any third-party publish.

## 9. Open questions (do not block MVP)

1. Carzone official feed/API — available? Through Motion/Cox Automotive?
2. Existing dealer website — replace, or does DealerOps embed via API?
3. Email provider — Gmail Workspace or Microsoft 365? (affects send-as later)
4. WhatsApp — personal numbers or WhatsApp Business API via approved BSP?
5. Finance partner — which lender(s) for finance enquiries?
