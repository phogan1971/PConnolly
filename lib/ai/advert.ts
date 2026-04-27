import type { Vehicle } from "@prisma/client";
import { formatEUR } from "@/lib/format";

export type AdvertCopy = {
  title: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  metaDescription: string;
  socialPost: string;
  featureHighlights: string[];
  source: "template" | "anthropic" | "openai";
};

/**
 * AI advert generator.
 *
 * MVP behaviour: provider-agnostic interface. If no provider is configured
 * (AI_PROVIDER=none), falls back to a deterministic template that produces
 * acceptable copy from structured vehicle data. Operator always reviews and
 * edits before publishing.
 */
export async function generateAdvert(
  v: Pick<
    Vehicle,
    | "year" | "make" | "model" | "variant" | "mileageKm" | "fuelType" | "transmission"
    | "bodyType" | "colour" | "priceRetailCents" | "vatIncluded" | "financeAvailable"
  > & { features?: string[] | unknown },
): Promise<AdvertCopy> {
  const provider = (process.env.AI_PROVIDER ?? "none").toLowerCase();
  if (provider === "anthropic" || provider === "openai") {
    // TODO(phase 3): real provider call. Keep template fallback below for safety.
  }
  return templateAdvert(v);
}

function templateAdvert(v: Parameters<typeof generateAdvert>[0]): AdvertCopy {
  const features = Array.isArray(v.features) ? (v.features as string[]) : [];
  const headline = `${v.year} ${v.make} ${v.model}${v.variant ? ` ${v.variant}` : ""}`;
  const km = new Intl.NumberFormat("en-IE").format(v.mileageKm);
  const price = formatEUR(v.priceRetailCents);
  const fuelLabel = v.fuelType.toLowerCase().replace(/_/g, " ");
  const transLabel = v.transmission.toLowerCase().replace(/_/g, " ");

  const highlights = features.slice(0, 6);

  const longDescription = [
    `${headline} in ${v.colour ?? "great condition"}, ${km}km, ${fuelLabel}, ${transLabel}.`,
    highlights.length ? `Spec highlights: ${highlights.join(", ")}.` : "",
    `Priced at ${price}${v.vatIncluded ? " (VAT included)" : ""}.`,
    v.financeAvailable ? "Finance available subject to lender approval." : "",
    "Trade-ins welcome. Contact us today to arrange a viewing or test drive.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title: headline,
    shortDescription: `${headline}, ${km}km. ${highlights.slice(0, 2).join(", ")}.`.replace(/\.\s*\.$/, "."),
    longDescription,
    seoTitle: `${headline} for sale — ${price}`,
    metaDescription: `${headline}, ${km}km, ${fuelLabel}, ${transLabel}. ${price}. Trade-ins welcome.`.slice(0, 160),
    socialPost: `Just landed: ${headline} ${highlights[0] ? `(${highlights[0]})` : ""} — ${price}. DM us to test drive.`,
    featureHighlights: highlights,
    source: "template",
  };
}
