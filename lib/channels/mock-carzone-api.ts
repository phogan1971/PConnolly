import { PublicationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { CarzoneExportAdapter } from "./carzone-export";
import type { ListingChannelAdapter, PublishResult, VehicleWithRelations } from "./types";

/**
 * MockCarzoneApiAdapter — DEV/CI ONLY.
 * Pretends to push to a Carzone API. Never wired in production. We use the export
 * adapter's validation + payload builder so tests resemble reality.
 */
export class MockCarzoneApiAdapter implements ListingChannelAdapter {
  readonly id = "mock-carzone-api";
  readonly displayName = "Carzone (mock API, dev only)";

  private inner: CarzoneExportAdapter;

  constructor(private readonly channelId: string) {
    this.inner = new CarzoneExportAdapter(channelId);
  }

  validateVehicle(v: VehicleWithRelations) {
    return this.inner.validateVehicle(v);
  }

  buildPayload(v: VehicleWithRelations) {
    return this.inner.buildPayload(v);
  }

  async publish(v: VehicleWithRelations): Promise<PublishResult> {
    const validation = this.validateVehicle(v);
    if (!validation.ok) return { ok: false, error: "Validation failed", issues: validation.issues };
    const fakeExternalId = `mock-cz-${v.id}`;
    await db.vehicleChannelPublication.upsert({
      where: { vehicleId_channelId: { vehicleId: v.id, channelId: this.channelId } },
      update: {
        status: PublicationStatus.PUBLISHED,
        externalListingId: fakeExternalId,
        lastPublishedAt: new Date(),
        exportedPayloadJson: this.buildPayload(v) as object,
      },
      create: {
        vehicleId: v.id,
        channelId: this.channelId,
        status: PublicationStatus.PUBLISHED,
        externalListingId: fakeExternalId,
        lastPublishedAt: new Date(),
        exportedPayloadJson: this.buildPayload(v) as object,
      },
    });
    return { ok: true, status: "published", externalListingId: fakeExternalId };
  }

  async unpublish(v: VehicleWithRelations): Promise<PublishResult> {
    await db.vehicleChannelPublication.update({
      where: { vehicleId_channelId: { vehicleId: v.id, channelId: this.channelId } },
      data: { status: PublicationStatus.UNPUBLISHED, externalListingId: null },
    });
    return { ok: true, status: "unpublished" };
  }

  async update(v: VehicleWithRelations): Promise<PublishResult> {
    return this.publish(v);
  }
}
