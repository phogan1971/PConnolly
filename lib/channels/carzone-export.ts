import { PublicationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { ListingChannelAdapter, PublishResult, ValidationResult, VehicleWithRelations, ChannelPayload } from "./types";

/**
 * CarzoneExportAdapter
 *
 * Generates a compliant feed payload for Carzone.ie. **Does not** scrape or
 * automate the Carzone back-office. The payload is exposed via
 * /api/exports/carzone/feed.{csv,xml} for manual upload or — when an approved
 * partner / official feed-pull route is set up — for fetching by Carzone's
 * systems.
 *
 * When an official Carzone API/feed spec arrives, swap this with a
 * CarzoneApiAdapter that implements the same interface.
 */
export class CarzoneExportAdapter implements ListingChannelAdapter {
  readonly id = "carzone-export";
  readonly displayName = "Carzone (manual export)";

  constructor(private readonly channelId: string) {}

  validateVehicle(v: VehicleWithRelations): ValidationResult {
    const issues = [];
    const required: Array<[unknown, string, string]> = [
      [v.stockNumber, "stockNumber", "Stock number is required."],
      [v.registration, "registration", "Registration is required for Carzone."],
      [v.make, "make", "Make is required."],
      [v.model, "model", "Model is required."],
      [v.year, "year", "Year is required."],
      [v.mileageKm, "mileageKm", "Mileage is required."],
      [v.fuelType, "fuelType", "Fuel type is required."],
      [v.transmission, "transmission", "Transmission is required."],
      [v.bodyType, "bodyType", "Body type is required."],
      [v.colour, "colour", "Colour is required."],
      [v.priceRetailCents, "priceRetailCents", "Retail price is required."],
      [v.descriptionShort, "descriptionShort", "A description is required."],
      [v.location, "location", "Location is required."],
    ];
    for (const [val, field, message] of required) {
      if (val === null || val === undefined || val === "" || (typeof val === "number" && val <= 0)) {
        issues.push({ severity: "error" as const, code: `missing_${field}`, field, message });
      }
    }
    if ((v.media?.length ?? 0) < 5) {
      issues.push({
        severity: "warning" as const,
        code: "few_images",
        message: "Carzone listings perform best with 5+ images.",
      });
    }
    return { ok: issues.every((i) => i.severity !== "error"), issues };
  }

  buildPayload(v: VehicleWithRelations): ChannelPayload {
    return {
      stockNumber: v.stockNumber,
      registration: v.registration,
      make: v.make,
      model: v.model,
      variant: v.variant,
      year: v.year,
      mileageKm: v.mileageKm,
      fuel: v.fuelType,
      transmission: v.transmission,
      bodyType: v.bodyType,
      colour: v.colour,
      retailPriceEur: v.priceRetailCents / 100,
      vatIncluded: v.vatIncluded,
      financeAvailable: v.financeAvailable,
      description: v.descriptionLong ?? v.descriptionShort ?? "",
      features: v.features ?? [],
      images: v.media.filter((m) => m.type === "IMAGE").sort((a, b) => a.sortOrder - b.sortOrder).map((m) => m.url),
      videos: v.media.filter((m) => m.type === "VIDEO").map((m) => m.url),
      dealership: {
        name: v.dealership.tradingName ?? v.dealership.name,
        location: v.dealership.address,
        phone: v.dealership.phone,
        email: v.dealership.email,
        website: v.dealership.websiteUrl,
      },
      vehicleStatus: v.status,
    };
  }

  async publish(v: VehicleWithRelations): Promise<PublishResult> {
    const validation = this.validateVehicle(v);
    if (!validation.ok) {
      return { ok: false, error: "Vehicle missing required Carzone fields.", issues: validation.issues };
    }
    const payload = this.buildPayload(v);
    await db.vehicleChannelPublication.upsert({
      where: { vehicleId_channelId: { vehicleId: v.id, channelId: this.channelId } },
      update: {
        status: PublicationStatus.READY_FOR_CARZONE_EXPORT,
        exportedPayloadJson: payload as object,
        lastExportedAt: new Date(),
        lastError: null,
      },
      create: {
        vehicleId: v.id,
        channelId: this.channelId,
        status: PublicationStatus.READY_FOR_CARZONE_EXPORT,
        exportedPayloadJson: payload as object,
        lastExportedAt: new Date(),
      },
    });
    return { ok: true, status: "ready_for_export", payload };
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
