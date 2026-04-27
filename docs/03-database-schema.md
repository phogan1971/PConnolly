# DealerOps — Database Schema

PostgreSQL via Prisma. The canonical source is `prisma/schema.prisma`. This doc is the
human-readable reference and notes the design choices.

## Conventions

- All ids are `cuid`.
- Money stored as **integer cents** (`Int`) to avoid float drift. Display layer formats EUR.
- Timestamps `created_at` / `updated_at` on every entity (`@default(now())`, `@updatedAt`).
- Soft-delete is not used in MVP. Vehicles use a `status = archived` instead.
- Enum values are screaming_snake_case in DB, normalised at the edge.

## Entities

### `dealerships`
| col | type | notes |
|---|---|---|
| id | text PK | |
| name | text | |
| trading_name | text? | |
| address | text | |
| phone | text | |
| email | text | |
| website_url | text? | |
| vat_number | text? | |
| opening_hours | jsonb? | `{ mon: "9-18", ... }` |
| created_at | timestamptz | |

### `users`
| col | type | notes |
|---|---|---|
| id | text PK | |
| dealership_id | text FK | |
| name | text | |
| email | text UNIQUE | |
| email_verified | timestamptz? | |
| password_hash | text? | optional, magic-link is primary |
| role | enum `Role` | `ADMIN, MANAGER, OFFICE, SALES, VIEWER` |
| created_at | timestamptz | |

### `vehicles`
| col | type | notes |
|---|---|---|
| id | text PK | |
| dealership_id | text FK | |
| status | enum `VehicleStatus` | `DRAFT, IN_PREP, READY, PUBLISHED, RESERVED, SOLD, ARCHIVED` |
| stock_number | text UNIQUE per dealership | |
| registration | text? | Irish reg, normalised uppercase |
| vin | text? | |
| slug | text UNIQUE | derived from year-make-model-stock |
| make / model / variant | text | |
| year | int | |
| mileage_km | int | |
| fuel_type | enum | `PETROL, DIESEL, HYBRID, PHEV, EV, LPG, OTHER` |
| transmission | enum | `MANUAL, AUTOMATIC, SEMI_AUTOMATIC` |
| body_type | enum | `HATCHBACK, SALOON, ESTATE, SUV, MPV, COUPE, CONVERTIBLE, VAN, PICKUP, OTHER` |
| engine_size_cc | int? | |
| colour | text? | |
| doors / seats | int? | |
| previous_owners | int? | |
| nct_expiry / tax_expiry | date? | |
| service_history | enum? | `FULL, PARTIAL, NONE, UNKNOWN` |
| warranty_months | int? | |
| price_retail_cents | int | |
| price_was_cents | int? | |
| vat_included | bool | default `true` (IE retail) |
| finance_available | bool | default `false` |
| monthly_payment_from_cents | int? | |
| location | text? | |
| features | jsonb | array of strings or grouped object |
| description_short | text? | |
| description_long | text? | |
| internal_notes | text? | **never rendered publicly** |
| date_acquired / date_prepared / date_published / date_sold | date? | |
| created_at / updated_at | timestamptz | |

Indexes: `(dealership_id, status)`, `(slug)`, `(stock_number, dealership_id)`,
`(registration)`, `(price_retail_cents)`, `(make, model)`.

### `vehicle_media`
| col | type | notes |
|---|---|---|
| id | text PK | |
| vehicle_id | text FK | cascade delete |
| url | text | full URL or storage key |
| type | enum | `IMAGE, VIDEO` |
| sort_order | int | |
| caption | text? | |
| alt_text | text? | |
| is_primary | bool | exactly one per vehicle (enforced in app) |
| upload_status | enum | `PENDING, READY, FAILED` |
| width / height | int? | |
| created_at | timestamptz | |

Indexes: `(vehicle_id, sort_order)`.

### `channels`
Seed rows for `website` and `carzone`. Adapter id stored in `config_json.adapter`.

| col | type | notes |
|---|---|---|
| id | text PK | |
| key | text UNIQUE | `website`, `carzone`, ... |
| name | text | |
| type | enum | `OWN_WEBSITE, EXTERNAL_FEED, EXTERNAL_API, PARTNER` |
| is_enabled | bool | |
| config_json | jsonb | `{ adapter: 'website' \| 'carzone-export' \| 'carzone-api' \| 'mock-carzone-api' }` |

### `vehicle_channel_publications`
One row per (vehicle, channel) pair.

| col | type | notes |
|---|---|---|
| id | text PK | |
| vehicle_id / channel_id | FK | |
| status | enum `PublicationStatus` | `NOT_READY, READY, QUEUED, PUBLISHED, FAILED, UNPUBLISHED, READY_FOR_CARZONE_EXPORT` |
| external_listing_id | text? | |
| exported_payload_json | jsonb? | last built payload, for diffing |
| last_exported_at | timestamptz? | |
| last_published_at | timestamptz? | |
| last_error | text? | |
| created_at / updated_at | timestamptz | |

Unique: `(vehicle_id, channel_id)`.

### `leads`
| col | type | notes |
|---|---|---|
| id | text PK | |
| vehicle_id | text FK? | nullable for general enquiries |
| dealership_id | text FK | |
| source_channel | text | `website`, `carzone`, `manual` |
| customer_name | text | |
| email | text? | |
| phone | text? | |
| message | text? | |
| lead_type | enum | `ENQUIRY, FINANCE, TEST_DRIVE, TRADE_IN, CALL_BACK, WHATSAPP` |
| status | enum | `NEW, CONTACTED, APPOINTMENT_BOOKED, CLOSED_WON, CLOSED_LOST, SPAM` |
| assigned_to_user_id | text FK? | |
| consent_marketing | bool | default false |
| ip / user_agent | text? | for spam triage, purged after 30 days |
| created_at / updated_at | timestamptz | |

Indexes: `(dealership_id, status)`, `(vehicle_id)`, `(assigned_to_user_id, status)`.

### `lead_activities`
| col | type | notes |
|---|---|---|
| id | text PK | |
| lead_id | text FK | |
| user_id | text FK? | null for system events |
| type | enum | `NOTE, CALL, EMAIL, SMS, WHATSAPP, STATUS_CHANGE, TASK_CREATED` |
| body | text? | |
| metadata | jsonb? | |
| created_at | timestamptz | |

### `tasks`
| col | type | notes |
|---|---|---|
| id | text PK | |
| lead_id / vehicle_id | text FK? | |
| assigned_to_user_id | text FK | |
| title | text | |
| due_at | timestamptz? | |
| status | enum | `OPEN, DONE, OVERDUE` (overdue is computed; we don't store transitions) |
| created_at | timestamptz | |

### `price_history`
| col | type | notes |
|---|---|---|
| id | text PK | |
| vehicle_id | text FK | |
| old_price_cents / new_price_cents | int | |
| changed_by_user_id | text FK? | |
| reason | text? | |
| created_at | timestamptz | |

### `vehicle_metric_events` (raw)
Append-only. Trimmed by job after 90 days.

| col | type | notes |
|---|---|---|
| id | text PK | |
| vehicle_id | text FK | |
| channel_id | text FK? | |
| event_type | enum | `LIST_VIEW, DETAIL_VIEW, ENQUIRY, PHONE_CLICK, WHATSAPP_CLICK, FINANCE_CLICK, TEST_DRIVE_REQUEST` |
| session_id | text? | |
| created_at | timestamptz | |

### `vehicle_metrics_daily` (rollup)
| col | type | notes |
|---|---|---|
| id | text PK | |
| vehicle_id / channel_id | FK | |
| date | date | |
| views / detail_views / enquiries / phone_clicks / whatsapp_clicks / finance_clicks / test_drive_requests | int | |

Unique: `(vehicle_id, channel_id, date)`.

### `audit_logs`
| col | type | notes |
|---|---|---|
| id | text PK | |
| actor_user_id | text FK? | |
| dealership_id | text FK | |
| entity_type | text | `vehicle`, `lead`, `price`, `publication`, ... |
| entity_id | text | |
| action | text | `created`, `updated`, `published`, `unpublished`, `status_changed`, ... |
| before_json / after_json | jsonb? | |
| created_at | timestamptz | |

### `jobs` (background)
| col | type | notes |
|---|---|---|
| id | text PK | |
| kind | text | handler key |
| payload | jsonb | |
| run_at | timestamptz | |
| attempts | int | |
| status | enum | `PENDING, RUNNING, SUCCEEDED, FAILED, DEAD` |
| last_error | text? | |
| created_at / updated_at | timestamptz | |

## Derived / computed (not stored)

- `days_in_stock` = `now() - coalesce(date_published, date_acquired, created_at)`.
- `task.status = OVERDUE` when `due_at < now() AND status = OPEN`.
- `vehicle.is_compliant` — computed by `lib/compliance` on demand (cached on save).

## Migration strategy

- Single Prisma migration for the MVP shape; subsequent feature migrations are additive
  (new columns nullable with defaults).
- Carzone API integration will add columns to `vehicle_channel_publications`
  (e.g. `provider_listing_url`) without breaking existing rows.
