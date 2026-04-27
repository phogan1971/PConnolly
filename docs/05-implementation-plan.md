# DealerOps — Implementation Plan

A staged plan. Each phase ships a usable slice. Don't move to the next until the
current phase is demoable.

## Phase 0 — Foundations  ✅ this commit

- Repo bootstrap: Next.js 15 + TS + Tailwind, ESLint, Prettier.
- Prisma schema for all entities defined in `docs/03-database-schema.md`.
- Seed: 1 dealership, 5 demo users (one per role), 6 demo vehicles, 2 channels (`website`, `carzone`).
- `.env.example`, `README` with run instructions.
- Health route, structured logger, error boundary.
- Dev DB: SQLite via Prisma for the very first run so `pnpm dev` works without Docker;
  Postgres connection string toggle for prod.

## Phase 1 — Stock + Public Site (the vertical slice)

- Auth.js with email magic-link + password fallback. RBAC helpers.
- Admin shell: sidebar, top bar, role-aware nav.
- `/admin/stock` list with filters, status pills, days-in-stock badge.
- `/admin/stock/new` and `/admin/stock/[id]` forms (Zod schemas + Server Actions).
- `/admin/stock/[id]/media`: upload (Local storage in dev), reorder, captions, primary.
- `/admin/stock/[id]/publishing`: Website publish/unpublish (real), Carzone export
  (generates feed file, marks publication ready).
- Public `/stock` listing + filters + `/stock/[slug]` detail with enquiry/finance/test-drive
  forms hitting `/api/leads`.
- Compliance checker (rule-based) blocking publish-to-website until checks pass.
- Audit log writes on vehicle create/update/status-change/publish.

**Definition of done:** I can add a vehicle, upload photos, publish to the website,
see it live on `/stock`, generate a Carzone export file, and a customer can submit an
enquiry that lands in the admin lead inbox.

## Phase 2 — Leads, Tasks, Metrics

- `/admin/leads` inbox + filters; `/admin/leads/[id]` detail with timeline.
- Auto-task on new lead ("Contact within 1 hour") with assignment rule
  (round-robin across active sales users; configurable later).
- `/admin/tasks` "my tasks" and overdue.
- First-party metric tracking on public site (server-side `/api/track`).
- Nightly job rolls events into `vehicle_metrics_daily`.
- Metrics dashboard widgets: stock counts, ageing buckets, leads-by-source,
  enquiries-per-vehicle, no-image vehicles, channel errors.

## Phase 3 — AI assist + Compliance + Carzone export hardening

- AI advert assistant: title, short, long, SEO meta, social. Provider-agnostic
  interface (`OpenAIProvider`, `AnthropicProvider`); editable previews; never
  auto-publishes.
- Compliance checker hardened with: watermark detection (heuristic), too-few-images,
  finance-only price warning.
- CSV import (bulk add vehicles) with dry-run validation report.
- Carzone export: full XML feed conforming to the published spec when we receive it;
  until then, a documented internal schema in `lib/channels/carzone-export/schema.md`
  with all fields the integration team will need.
- Duplicate detection on save (registration / VIN / stock_number).

## Phase 4 — Office automation, comms, official Carzone

- Email integration: send-as Gmail/Outlook for replies; one-click "send vehicle details".
- Suggested reply drafts (LLM, operator edits before sending).
- Price-drop recommendations (rules-based first: ageing + low engagement).
- Sold-vehicle workflow that automatically unpublishes everywhere and archives leads.
- Weekly management report email.
- WhatsApp via approved BSP (Meta Cloud API or Twilio) once we have it.
- Replace `CarzoneExportAdapter` with `CarzoneApiAdapter` once Motion/Carzone provide
  credentials and spec — no caller changes.

## Engineering principles

- **Server Actions for admin mutations**, REST for public + integrations.
- **Zod at the edge**, every input validated before it touches Prisma.
- **Adapter interfaces** for anything external (channels, media, email, AI). Never
  import a vendor SDK from a feature module.
- **No third-party Carzone automation.** Ever. Hard rule.
- **Audit everything that mutates a vehicle, price, lead, or publication.**
- **Never expose `internal_notes` or PII** to public routes; enforce via separate
  `publicVehicle()` projector.
- **Feature flags via `lib/flags.ts`** (env-driven), not via runtime DB toggles in MVP.

## What I'm not doing (and why)

- Writing tests for every helper in MVP. We add tests for: compliance rules,
  channel adapters, lead validation, RBAC. UI tests come post-MVP.
- Building a full design system. shadcn-style primitives in-tree, polish later.
- Multi-tenant UI. Schema supports it; UI assumes one dealership.
- Email/WhatsApp send in Phase 1 — just receive leads first.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Carzone integration changes shape mid-build | Adapter interface; build export-first |
| Image storage costs / bandwidth | Pluggable; Cloudflare R2 cheap; lazy-load + responsive sizes |
| Spam on public forms | Rate limit + honeypot + Turnstile when traffic warrants |
| LLM hallucinations on adverts | Always operator-reviewed; never auto-publish AI copy |
| GDPR exposure | Consent fields, audit log, easy data export/delete; DPIA before launch |
