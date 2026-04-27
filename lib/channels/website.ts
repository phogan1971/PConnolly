import { PublicationStatus, VehicleStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { ListingChannelAdapter, PublishResult, ValidationResult, VehicleWithRelations } from "./types";

/**
 * WebsiteAdapter: real publish/unpublish for the dealer's own site.
 * The public site renders only vehicles whose website publication row is PUBLISHED.
 */
export class WebsiteAdapter implements ListingChannelAdapter {
  readonly id = "website";
  readonly displayName = "Own Website";

  constructor(private readonly channelId: string) {}

  validateVehicle(v: VehicleWithRelations): ValidationResult {
    const issues = [];
    if (!v.priceRetailCents || v.priceRetailCents <= 0) {
      issues.push({ severity: "error" as const, code: "missing_price", field: "priceRetailCents", message: "Retail price is required." });
    }
    if (!v.descriptionShort) {
      issues.push({ severity: "error" as const, code: "missing_short_desc", field: "descriptionShort", message: "Short description is required." });
    }
    if (!v.location) {
      issues.push({ severity: "error" as const, code: "missing_location", field: "location", message: "Vehicle location is required." });
    }
    if ((v.media?.length ?? 0) === 0) {
      issues.push({ severity: "error" as const, code: "no_images", message: "At least one image is required." });
    } else if ((v.media?.length ?? 0) < 5) {
      issues.push({ severity: "warning" as const, code: "few_images", message: "Listings with 5+ images perform better." });
    }
    return { ok: issues.every((i) => i.severity !== "error"), issues };
  }

  buildPayload(v: VehicleWithRelations) {
    return {
      slug: v.slug,
      year: v.year,
      make: v.make,
      model: v.model,
      variant: v.variant,
      price: v.priceRetailCents,
      mileage: v.mileageKm,
      images: v.media.map((m) => m.url),
    };
  }

  async publish(v: VehicleWithRelations): Promise<PublishResult> {
    const validation = this.validateVehicle(v);
    if (!validation.ok) {
      return { ok: false, error: "Vehicle failed validation.", issues: validation.issues };
    }
    await db.$transaction([
      db.vehicleChannelPublication.upsert({
        where: { vehicleId_channelId: { vehicleId: v.id, channelId: this.channelId } },
        update: {
          status: PublicationStatus.PUBLISHED,
          lastPublishedAt: new Date(),
          lastError: null,
          exportedPayloadJson: this.buildPayload(v) as object,
        },
        create: {
          vehicleId: v.id,
          channelId: this.channelId,
          status: PublicationStatus.PUBLISHED,
          lastPublishedAt: new Date(),
          exportedPayloadJson: this.buildPayload(v) as object,
        },
      }),
      db.vehicle.update({
        where: { id: v.id },
        data: {
          status: v.status === VehicleStatus.READY ? VehicleStatus.PUBLISHED : v.status,
          datePublished: v.datePublished ?? new Date(),
        },
      }),
    ]);
    return { ok: true, status: "published" };
  }

  async unpublish(v: VehicleWithRelations): Promise<PublishResult> {
    await db.vehicleChannelPublication.update({
      where: { vehicleId_channelId: { vehicleId: v.id, channelId: this.channelId } },
      data: { status: PublicationStatus.UNPUBLISHED },
    });
    return { ok: true, status: "unpublished" };
  }

  async update(v: VehicleWithRelations): Promise<PublishResult> {
    return this.publish(v);
  }
}
