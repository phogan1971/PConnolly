import { z } from "zod";
import { FuelType, Transmission, BodyType, ServiceHistory, VehicleStatus } from "@prisma/client";

export const vehicleInputSchema = z.object({
  stockNumber: z.string().min(1, "Stock number is required").max(40),
  registration: z.string().max(20).optional().or(z.literal("")),
  vin: z.string().max(40).optional().or(z.literal("")),
  make: z.string().min(1, "Make is required").max(40),
  model: z.string().min(1, "Model is required").max(60),
  variant: z.string().max(80).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  mileageKm: z.coerce.number().int().min(0).max(2_000_000),
  fuelType: z.nativeEnum(FuelType),
  transmission: z.nativeEnum(Transmission),
  bodyType: z.nativeEnum(BodyType),
  engineSizeCc: z.coerce.number().int().min(0).max(10_000).optional().or(z.literal("")),
  colour: z.string().max(40).optional().or(z.literal("")),
  doors: z.coerce.number().int().min(1).max(7).optional().or(z.literal("")),
  seats: z.coerce.number().int().min(1).max(20).optional().or(z.literal("")),
  previousOwners: z.coerce.number().int().min(0).max(20).optional().or(z.literal("")),
  serviceHistory: z.nativeEnum(ServiceHistory).optional().or(z.literal("")),
  warrantyMonths: z.coerce.number().int().min(0).max(120).optional().or(z.literal("")),
  priceRetailEur: z.coerce.number().min(0).max(1_000_000),
  priceWasEur: z.coerce.number().min(0).max(1_000_000).optional().or(z.literal("")),
  vatIncluded: z.coerce.boolean().default(true),
  financeAvailable: z.coerce.boolean().default(false),
  monthlyPaymentFromEur: z.coerce.number().min(0).max(10_000).optional().or(z.literal("")),
  location: z.string().max(120).optional().or(z.literal("")),
  features: z.string().max(2000).optional().or(z.literal("")),
  descriptionShort: z.string().max(280).optional().or(z.literal("")),
  descriptionLong: z.string().max(8000).optional().or(z.literal("")),
  internalNotes: z.string().max(4000).optional().or(z.literal("")),
  status: z.nativeEnum(VehicleStatus).default(VehicleStatus.DRAFT),
});

export type VehicleInput = z.infer<typeof vehicleInputSchema>;

export function parseFeatures(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function emptyToUndef<T>(v: T | "" | null | undefined): T | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  return v;
}
