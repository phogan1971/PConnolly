import { PublicationStatus, MediaType } from "@prisma/client";
import { db } from "@/lib/db";
import { CarzoneExportAdapter } from "./carzone-export";
import type { VehicleWithRelations } from "./types";

/**
 * Build the Carzone feed payload across every vehicle currently in
 * READY_FOR_CARZONE_EXPORT or PUBLISHED state on the carzone channel.
 *
 * Output shapes (CSV + XML) are intentionally simple/portable and self-document
 * the field set the official integration team will need. When the official
 * Carzone/Motion specification is provided, we adjust these formatters
 * accordingly without changing the rest of the system.
 */
export async function buildCarzoneFeedRows() {
  const channel = await db.channel.findUnique({ where: { key: "carzone" } });
  if (!channel) return [];
  const adapter = new CarzoneExportAdapter(channel.id);

  const pubs = await db.vehicleChannelPublication.findMany({
    where: {
      channelId: channel.id,
      status: { in: [PublicationStatus.READY_FOR_CARZONE_EXPORT, PublicationStatus.PUBLISHED] },
    },
    include: {
      vehicle: { include: { media: { orderBy: { sortOrder: "asc" } }, dealership: true } },
    },
  });

  return pubs.map((p) => adapter.buildPayload(p.vehicle as VehicleWithRelations));
}

const CSV_FIELDS = [
  "stockNumber", "registration", "make", "model", "variant", "year",
  "mileageKm", "fuel", "transmission", "bodyType", "colour",
  "retailPriceEur", "vatIncluded", "financeAvailable",
  "description", "features", "images", "videos",
  "dealershipName", "dealershipLocation", "dealershipPhone", "dealershipEmail",
  "vehicleStatus",
] as const;

function csvEscape(s: unknown) {
  const str = s == null ? "" : Array.isArray(s) ? s.join("|") : String(s);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function rowsToCsv(rows: Awaited<ReturnType<typeof buildCarzoneFeedRows>>): string {
  const header = CSV_FIELDS.join(",");
  const lines = rows.map((r) => {
    const d = r.dealership as Record<string, unknown>;
    return [
      r.stockNumber, r.registration, r.make, r.model, r.variant, r.year,
      r.mileageKm, r.fuel, r.transmission, r.bodyType, r.colour,
      r.retailPriceEur, r.vatIncluded, r.financeAvailable,
      r.description, r.features, r.images, r.videos,
      d?.name, d?.location, d?.phone, d?.email,
      r.vehicleStatus,
    ].map(csvEscape).join(",");
  });
  return [header, ...lines].join("\n");
}

function xmlEscape(s: unknown) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function rowsToXml(rows: Awaited<ReturnType<typeof buildCarzoneFeedRows>>): string {
  const items = rows
    .map((r) => {
      const features = (r.features as string[] | undefined) ?? [];
      const images = (r.images as string[] | undefined) ?? [];
      const videos = (r.videos as string[] | undefined) ?? [];
      const d = r.dealership as Record<string, unknown>;
      return [
        "  <vehicle>",
        `    <stockNumber>${xmlEscape(r.stockNumber)}</stockNumber>`,
        `    <registration>${xmlEscape(r.registration)}</registration>`,
        `    <make>${xmlEscape(r.make)}</make>`,
        `    <model>${xmlEscape(r.model)}</model>`,
        `    <variant>${xmlEscape(r.variant)}</variant>`,
        `    <year>${xmlEscape(r.year)}</year>`,
        `    <mileageKm>${xmlEscape(r.mileageKm)}</mileageKm>`,
        `    <fuel>${xmlEscape(r.fuel)}</fuel>`,
        `    <transmission>${xmlEscape(r.transmission)}</transmission>`,
        `    <bodyType>${xmlEscape(r.bodyType)}</bodyType>`,
        `    <colour>${xmlEscape(r.colour)}</colour>`,
        `    <retailPriceEur>${xmlEscape(r.retailPriceEur)}</retailPriceEur>`,
        `    <vatIncluded>${xmlEscape(r.vatIncluded)}</vatIncluded>`,
        `    <financeAvailable>${xmlEscape(r.financeAvailable)}</financeAvailable>`,
        `    <description>${xmlEscape(r.description)}</description>`,
        `    <features>`,
        ...features.map((f) => `      <feature>${xmlEscape(f)}</feature>`),
        `    </features>`,
        `    <images>`,
        ...images.map((u) => `      <image>${xmlEscape(u)}</image>`),
        `    </images>`,
        `    <videos>`,
        ...videos.map((u) => `      <video>${xmlEscape(u)}</video>`),
        `    </videos>`,
        `    <dealership>`,
        `      <name>${xmlEscape(d?.name)}</name>`,
        `      <location>${xmlEscape(d?.location)}</location>`,
        `      <phone>${xmlEscape(d?.phone)}</phone>`,
        `      <email>${xmlEscape(d?.email)}</email>`,
        `    </dealership>`,
        `    <vehicleStatus>${xmlEscape(r.vehicleStatus)}</vehicleStatus>`,
        "  </vehicle>",
      ].join("\n");
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<feed generated="${new Date().toISOString()}">\n${items}\n</feed>\n`;
}

// Avoid unused-import warning for MediaType in some toolchains.
export const _CARZONE_MEDIA_HINT: typeof MediaType = MediaType;
