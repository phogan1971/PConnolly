import { VehicleStatus } from "@prisma/client";
import type { VehicleWithRelations, ValidationIssue } from "@/lib/channels/types";
import type { VehicleChannelPublication } from "@prisma/client";

export type ComplianceContext = VehicleWithRelations & {
  publications: VehicleChannelPublication[];
};

/**
 * Pre-publish compliance rules. Errors block publish-to-website. Warnings inform.
 */
export function checkCompliance(v: ComplianceContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!v.priceRetailCents || v.priceRetailCents <= 0) {
    issues.push({ severity: "error", code: "missing_price", field: "priceRetailCents", message: "Price is required." });
  }

  if (v.financeAvailable && v.monthlyPaymentFromCents && (!v.priceRetailCents || v.priceRetailCents <= 0)) {
    issues.push({
      severity: "error",
      code: "finance_only_price",
      message: "A retail price is required when 'finance available' is on. Finance-only pricing is misleading.",
    });
  }

  if (!v.vatIncluded) {
    issues.push({
      severity: "warning",
      code: "vat_not_included",
      field: "vatIncluded",
      message: "Price is not marked VAT inclusive. Confirm this is correct for the buyer audience.",
    });
  }

  if (!v.mileageKm || v.mileageKm <= 0) {
    issues.push({ severity: "error", code: "missing_mileage", field: "mileageKm", message: "Mileage is required." });
  }

  if (!v.location) {
    issues.push({ severity: "error", code: "missing_location", field: "location", message: "Vehicle location is required." });
  }

  if (!v.registration && !v.vin) {
    issues.push({
      severity: "warning",
      code: "missing_reg_or_vin",
      message: "Internal: missing registration and VIN. Required for Carzone export.",
    });
  }

  const imageCount = v.media.filter((m) => m.type === "IMAGE").length;
  if (imageCount === 0) {
    issues.push({ severity: "error", code: "no_images", message: "At least one image is required." });
  } else if (imageCount < 5) {
    issues.push({
      severity: "warning",
      code: "few_images",
      message: `Only ${imageCount} images. 5+ recommended.`,
    });
  }

  // Naive watermark heuristic — flagged for operator review.
  for (const m of v.media) {
    const u = m.url.toLowerCase();
    if (u.includes("watermark") || u.includes("dealer-")) {
      issues.push({
        severity: "warning",
        code: "possible_watermark",
        message: `Image ${m.id} may contain another dealer's watermark.`,
      });
    }
  }

  if (!v.descriptionLong && !v.descriptionShort) {
    issues.push({ severity: "error", code: "empty_description", message: "Add at least a short description." });
  }

  if (v.status === VehicleStatus.SOLD) {
    const stillPublished = v.publications.some((p) => p.status === "PUBLISHED");
    if (stillPublished) {
      issues.push({
        severity: "error",
        code: "sold_but_published",
        message: "Vehicle is marked SOLD but is still PUBLISHED on at least one channel. Unpublish everywhere.",
      });
    }
  }

  return issues;
}

export function complianceSummary(issues: ValidationIssue[]) {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return { ok: errors.length === 0, errors, warnings };
}
