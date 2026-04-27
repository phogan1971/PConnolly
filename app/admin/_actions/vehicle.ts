"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, VehicleStatus, MediaType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { vehicleInputSchema, parseFeatures } from "@/lib/validators/vehicle";
import { slugify } from "@/lib/format";
import { generateAdvert } from "@/lib/ai/advert";
import { getAdapterForChannel } from "@/lib/channels/registry";

const editRoles: Role[] = [Role.ADMIN, Role.MANAGER, Role.OFFICE];

function fdToObject(fd: FormData) {
  const obj: Record<string, string> = {};
  for (const [k, v] of fd.entries()) obj[k] = typeof v === "string" ? v : "";
  // Coerce checkboxes (presence-only)
  if (!("vatIncluded" in obj)) obj.vatIncluded = "false";
  if (!("financeAvailable" in obj)) obj.financeAvailable = "false";
  return obj;
}

function eurToCents(v: unknown): number | null {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

function emptyToNull<T>(v: T | "" | null | undefined): T | null {
  return v === "" || v === null || v === undefined ? null : v;
}

export async function createVehicle(formData: FormData) {
  const user = await requireRole(...editRoles);
  const parsed = vehicleInputSchema.safeParse(fdToObject(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const v = parsed.data;
  const baseSlug = slugify(`${v.year}-${v.make}-${v.model}-${v.stockNumber}`);

  const created = await db.vehicle.create({
    data: {
      dealershipId: user.dealershipId,
      stockNumber: v.stockNumber,
      registration: emptyToNull(v.registration) as string | null,
      vin: emptyToNull(v.vin) as string | null,
      slug: baseSlug,
      make: v.make,
      model: v.model,
      variant: emptyToNull(v.variant) as string | null,
      year: v.year,
      mileageKm: v.mileageKm,
      fuelType: v.fuelType,
      transmission: v.transmission,
      bodyType: v.bodyType,
      engineSizeCc: emptyToNull(v.engineSizeCc) as number | null,
      colour: emptyToNull(v.colour) as string | null,
      doors: emptyToNull(v.doors) as number | null,
      seats: emptyToNull(v.seats) as number | null,
      previousOwners: emptyToNull(v.previousOwners) as number | null,
      serviceHistory: v.serviceHistory ? v.serviceHistory : null,
      warrantyMonths: emptyToNull(v.warrantyMonths) as number | null,
      priceRetailCents: eurToCents(v.priceRetailEur) ?? 0,
      priceWasCents: eurToCents(v.priceWasEur),
      vatIncluded: !!v.vatIncluded,
      financeAvailable: !!v.financeAvailable,
      monthlyPaymentFromCents: eurToCents(v.monthlyPaymentFromEur),
      location: emptyToNull(v.location) as string | null,
      features: parseFeatures(v.features),
      descriptionShort: emptyToNull(v.descriptionShort) as string | null,
      descriptionLong: emptyToNull(v.descriptionLong) as string | null,
      internalNotes: emptyToNull(v.internalNotes) as string | null,
      status: v.status,
    },
  });

  // Ensure publication rows exist for all channels
  const channels = await db.channel.findMany();
  await db.vehicleChannelPublication.createMany({
    data: channels.map((c) => ({ vehicleId: created.id, channelId: c.id })),
    skipDuplicates: true,
  });

  await writeAudit({
    dealershipId: user.dealershipId,
    actorUserId: user.id,
    entityType: "vehicle",
    entityId: created.id,
    action: "created",
    after: { stockNumber: created.stockNumber, status: created.status },
  });

  revalidatePath("/admin/stock");
  redirect(`/admin/stock/${created.id}`);
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const user = await requireRole(...editRoles);
  const parsed = vehicleInputSchema.safeParse(fdToObject(formData));
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  const v = parsed.data;
  const before = await db.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  if (before.dealershipId !== user.dealershipId) throw new Error("Forbidden");

  const newPriceCents = eurToCents(v.priceRetailEur) ?? 0;
  const updated = await db.vehicle.update({
    where: { id: vehicleId },
    data: {
      stockNumber: v.stockNumber,
      registration: emptyToNull(v.registration) as string | null,
      vin: emptyToNull(v.vin) as string | null,
      make: v.make,
      model: v.model,
      variant: emptyToNull(v.variant) as string | null,
      year: v.year,
      mileageKm: v.mileageKm,
      fuelType: v.fuelType,
      transmission: v.transmission,
      bodyType: v.bodyType,
      engineSizeCc: emptyToNull(v.engineSizeCc) as number | null,
      colour: emptyToNull(v.colour) as string | null,
      doors: emptyToNull(v.doors) as number | null,
      seats: emptyToNull(v.seats) as number | null,
      previousOwners: emptyToNull(v.previousOwners) as number | null,
      serviceHistory: v.serviceHistory ? v.serviceHistory : null,
      warrantyMonths: emptyToNull(v.warrantyMonths) as number | null,
      priceRetailCents: newPriceCents,
      priceWasCents: eurToCents(v.priceWasEur),
      vatIncluded: !!v.vatIncluded,
      financeAvailable: !!v.financeAvailable,
      monthlyPaymentFromCents: eurToCents(v.monthlyPaymentFromEur),
      location: emptyToNull(v.location) as string | null,
      features: parseFeatures(v.features),
      descriptionShort: emptyToNull(v.descriptionShort) as string | null,
      descriptionLong: emptyToNull(v.descriptionLong) as string | null,
      internalNotes: emptyToNull(v.internalNotes) as string | null,
      status: v.status,
    },
  });

  if (before.priceRetailCents !== newPriceCents) {
    await db.priceHistory.create({
      data: {
        vehicleId: updated.id,
        oldPriceCents: before.priceRetailCents,
        newPriceCents,
        changedByUserId: user.id,
      },
    });
  }

  await writeAudit({
    dealershipId: user.dealershipId,
    actorUserId: user.id,
    entityType: "vehicle",
    entityId: updated.id,
    action: "updated",
    before: { ...before, features: undefined },
    after: { stockNumber: updated.stockNumber, status: updated.status, priceRetailCents: newPriceCents },
  });

  revalidatePath(`/admin/stock/${vehicleId}`);
  revalidatePath("/admin/stock");
}

export async function setVehicleStatus(vehicleId: string, status: VehicleStatus) {
  const user = await requireRole(...editRoles);
  const before = await db.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  if (before.dealershipId !== user.dealershipId) throw new Error("Forbidden");
  const updated = await db.vehicle.update({
    where: { id: vehicleId },
    data: {
      status,
      dateSold: status === VehicleStatus.SOLD ? new Date() : before.dateSold,
    },
    include: { media: true, dealership: true, publications: true },
  });

  // Sold cascade: unpublish everywhere via adapters.
  if (status === VehicleStatus.SOLD) {
    const channels = await db.channel.findMany();
    for (const c of channels) {
      const adapter = await getAdapterForChannel(c.key);
      if (adapter) await adapter.unpublish(updated as Parameters<typeof adapter.unpublish>[0]);
    }
  }

  await writeAudit({
    dealershipId: user.dealershipId,
    actorUserId: user.id,
    entityType: "vehicle",
    entityId: vehicleId,
    action: `status_changed:${status}`,
    before: { status: before.status },
    after: { status },
  });

  revalidatePath(`/admin/stock/${vehicleId}`);
  revalidatePath("/admin/stock");
}

export async function addMediaUrl(vehicleId: string, url: string, altText: string | null) {
  const user = await requireRole(...editRoles);
  const v = await db.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  if (v.dealershipId !== user.dealershipId) throw new Error("Forbidden");
  const last = await db.vehicleMedia.findFirst({ where: { vehicleId }, orderBy: { sortOrder: "desc" } });
  const isFirst = !(await db.vehicleMedia.findFirst({ where: { vehicleId } }));
  await db.vehicleMedia.create({
    data: {
      vehicleId,
      url,
      type: MediaType.IMAGE,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      altText: altText ?? null,
      isPrimary: isFirst,
    },
  });
  revalidatePath(`/admin/stock/${vehicleId}/media`);
  revalidatePath(`/admin/stock/${vehicleId}`);
}

export async function deleteMedia(vehicleId: string, mediaId: string) {
  const user = await requireRole(...editRoles);
  const v = await db.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  if (v.dealershipId !== user.dealershipId) throw new Error("Forbidden");
  await db.vehicleMedia.delete({ where: { id: mediaId } });
  revalidatePath(`/admin/stock/${vehicleId}/media`);
}

export async function setPrimaryMedia(vehicleId: string, mediaId: string) {
  const user = await requireRole(...editRoles);
  const v = await db.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  if (v.dealershipId !== user.dealershipId) throw new Error("Forbidden");
  await db.$transaction([
    db.vehicleMedia.updateMany({ where: { vehicleId }, data: { isPrimary: false } }),
    db.vehicleMedia.update({ where: { id: mediaId }, data: { isPrimary: true, sortOrder: 0 } }),
  ]);
  revalidatePath(`/admin/stock/${vehicleId}/media`);
  revalidatePath(`/admin/stock/${vehicleId}`);
}

export async function reorderMedia(vehicleId: string, mediaId: string, direction: "up" | "down") {
  const user = await requireRole(...editRoles);
  const v = await db.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  if (v.dealershipId !== user.dealershipId) throw new Error("Forbidden");
  const all = await db.vehicleMedia.findMany({ where: { vehicleId }, orderBy: { sortOrder: "asc" } });
  const idx = all.findIndex((m) => m.id === mediaId);
  if (idx < 0) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= all.length) return;
  const a = all[idx];
  const b = all[swap];
  await db.$transaction([
    db.vehicleMedia.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    db.vehicleMedia.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidatePath(`/admin/stock/${vehicleId}/media`);
}

export async function generateAdvertCopy(vehicleId: string) {
  const user = await requireRole(...editRoles);
  const v = await db.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  if (v.dealershipId !== user.dealershipId) throw new Error("Forbidden");
  const features = Array.isArray(v.features) ? (v.features as string[]) : [];
  const advert = await generateAdvert({ ...v, features });
  await db.vehicle.update({
    where: { id: vehicleId },
    data: {
      descriptionShort: advert.shortDescription,
      descriptionLong: advert.longDescription,
    },
  });
  await writeAudit({
    dealershipId: user.dealershipId,
    actorUserId: user.id,
    entityType: "vehicle",
    entityId: vehicleId,
    action: "advert_generated",
    after: { source: advert.source },
  });
  revalidatePath(`/admin/stock/${vehicleId}`);
}

export async function publishToChannelAction(vehicleId: string, channelKey: string): Promise<void> {
  await publishToChannel(vehicleId, channelKey);
}

export async function unpublishFromChannelAction(vehicleId: string, channelKey: string): Promise<void> {
  await unpublishFromChannel(vehicleId, channelKey);
}

export async function publishToChannel(vehicleId: string, channelKey: string) {
  const user = await requireRole(...editRoles);
  const v = await db.vehicle.findUnique({
    where: { id: vehicleId },
    include: { media: { orderBy: { sortOrder: "asc" } }, dealership: true, publications: true },
  });
  if (!v || v.dealershipId !== user.dealershipId) throw new Error("Forbidden");
  const adapter = await getAdapterForChannel(channelKey);
  if (!adapter) throw new Error(`Unknown channel: ${channelKey}`);
  const result = await adapter.publish(v);
  await writeAudit({
    dealershipId: user.dealershipId,
    actorUserId: user.id,
    entityType: "publication",
    entityId: vehicleId,
    action: result.ok ? `published:${channelKey}` : `publish_failed:${channelKey}`,
    after: result,
  });
  revalidatePath(`/admin/stock/${vehicleId}/publishing`);
  revalidatePath("/stock");
  revalidatePath(`/stock/${v.slug}`);
  return result;
}

export async function unpublishFromChannel(vehicleId: string, channelKey: string) {
  const user = await requireRole(...editRoles);
  const v = await db.vehicle.findUnique({
    where: { id: vehicleId },
    include: { media: true, dealership: true, publications: true },
  });
  if (!v || v.dealershipId !== user.dealershipId) throw new Error("Forbidden");
  const adapter = await getAdapterForChannel(channelKey);
  if (!adapter) throw new Error(`Unknown channel: ${channelKey}`);
  const result = await adapter.unpublish(v);
  await writeAudit({
    dealershipId: user.dealershipId,
    actorUserId: user.id,
    entityType: "publication",
    entityId: vehicleId,
    action: `unpublished:${channelKey}`,
    after: result,
  });
  revalidatePath(`/admin/stock/${vehicleId}/publishing`);
  revalidatePath("/stock");
  return result;
}
