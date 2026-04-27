import type { Vehicle, VehicleMedia, Dealership } from "@prisma/client";

export type VehicleWithRelations = Vehicle & {
  media: VehicleMedia[];
  dealership: Dealership;
};

export type ValidationIssue = {
  field?: string;
  severity: "error" | "warning";
  code: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

export type ChannelPayload = Record<string, unknown>;

export type PublishResult =
  | { ok: true; status: "published" | "ready_for_export" | "unpublished"; externalListingId?: string; payload?: ChannelPayload }
  | { ok: false; error: string; issues?: ValidationIssue[] };

export interface ListingChannelAdapter {
  readonly id: string;
  readonly displayName: string;
  validateVehicle(v: VehicleWithRelations): ValidationResult;
  buildPayload(v: VehicleWithRelations): ChannelPayload;
  publish(v: VehicleWithRelations): Promise<PublishResult>;
  unpublish(v: VehicleWithRelations): Promise<PublishResult>;
  update(v: VehicleWithRelations): Promise<PublishResult>;
}
