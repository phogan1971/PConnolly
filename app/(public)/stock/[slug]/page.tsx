import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PublicationStatus, VehicleStatus, MetricEventType } from "@prisma/client";
import { formatEUR, formatKm, formatDate } from "@/lib/format";
import EnquiryForm from "@/components/EnquiryForm";
import TrackedLink from "@/components/TrackedLink";
import { recordMetricEvent } from "@/lib/metrics/track";

export const dynamic = "force-dynamic";

async function getVehicle(slug: string) {
  return db.vehicle.findFirst({
    where: {
      slug,
      status: VehicleStatus.PUBLISHED,
      publications: { some: { status: PublicationStatus.PUBLISHED, channel: { key: "website" } } },
    },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      dealership: true,
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVehicle(slug);
  if (!v) return { title: "Vehicle not found" };
  const title = `${v.year} ${v.make} ${v.model}${v.variant ? " " + v.variant : ""}`;
  return {
    title,
    description: v.descriptionShort ?? `${title}, ${formatKm(v.mileageKm)}, ${formatEUR(v.priceRetailCents)}`,
    openGraph: { images: v.media[0]?.url ? [v.media[0].url] : [] },
  };
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = await getVehicle(slug);
  if (!v) notFound();

  // best-effort detail-view event
  recordMetricEvent({ vehicleId: v.id, eventType: MetricEventType.DETAIL_VIEW });

  const phoneHref = v.dealership.phone ? `tel:${v.dealership.phone.replace(/\s+/g, "")}` : null;
  const waNumber = v.dealership.phone?.replace(/\D/g, "");
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi, I'm interested in your ${v.year} ${v.make} ${v.model} (stock ${v.stockNumber}).`)}` : null;

  const features: string[] = Array.isArray(v.features) ? (v.features as string[]) : [];

  const ldJson = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${v.year} ${v.make} ${v.model}`,
    brand: v.make,
    model: v.model,
    vehicleModelDate: v.year,
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.mileageKm, unitCode: "KMT" },
    fuelType: v.fuelType,
    vehicleTransmission: v.transmission,
    color: v.colour,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (v.priceRetailCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      seller: { "@type": "AutoDealer", name: v.dealership.tradingName ?? v.dealership.name },
    },
    image: v.media.map((m) => m.url),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }} />

      <Link href="/stock" className="text-sm text-slate-500 hover:text-slate-700">← All stock</Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-3">
        {/* Gallery + details */}
        <div className="lg:col-span-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-slate-100">
            {v.media[0]?.url ? (
              <Image src={v.media[0].url} alt={v.media[0].altText ?? `${v.year} ${v.make} ${v.model}`} fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" priority />
            ) : null}
          </div>
          {v.media.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {v.media.slice(1, 6).map((m) => (
                <div key={m.id} className="relative aspect-square overflow-hidden rounded-md bg-slate-100">
                  <Image src={m.url} alt={m.altText ?? ""} fill sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <h1 className="text-2xl font-bold text-slate-900">{v.year} {v.make} {v.model}</h1>
            {v.variant && <div className="text-base text-slate-600">{v.variant}</div>}

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900">{formatEUR(v.priceRetailCents)}</span>
              {v.priceWasCents && <span className="text-base text-slate-400 line-through">{formatEUR(v.priceWasCents)}</span>}
              {v.vatIncluded && <span className="badge badge-gray">VAT included</span>}
            </div>

            {v.descriptionShort && <p className="mt-4 text-slate-700">{v.descriptionShort}</p>}
            {v.descriptionLong && <p className="mt-4 whitespace-pre-line text-slate-700">{v.descriptionLong}</p>}

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                ["Mileage", formatKm(v.mileageKm)],
                ["Fuel", v.fuelType],
                ["Transmission", v.transmission],
                ["Body", v.bodyType],
                ["Colour", v.colour],
                ["Engine", v.engineSizeCc ? `${v.engineSizeCc}cc` : null],
                ["Doors", v.doors],
                ["Seats", v.seats],
                ["Owners", v.previousOwners],
                ["NCT", formatDate(v.nctExpiry)],
                ["Service history", v.serviceHistory],
                ["Warranty", v.warrantyMonths ? `${v.warrantyMonths} months` : null],
              ].map(([k, val]) =>
                val == null || val === "" ? null : (
                  <div key={k as string} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">{k}</div>
                    <div className="font-medium text-slate-900">{String(val)}</div>
                  </div>
                ),
              )}
            </div>

            {features.length > 0 && (
              <div className="mt-6">
                <h2 className="text-base font-semibold text-slate-900">Features</h2>
                <ul className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-700 sm:grid-cols-2">
                  {features.map((f) => <li key={f}>· {f}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Side: contact + enquiry */}
        <aside className="lg:col-span-1">
          <div className="card card-pad">
            <div className="text-sm font-semibold text-slate-900">{v.dealership.tradingName ?? v.dealership.name}</div>
            <div className="text-xs text-slate-500">{v.dealership.address}</div>

            <div className="mt-4 grid gap-2">
              {phoneHref && (
                <TrackedLink href={phoneHref} vehicleId={v.id} eventType="PHONE_CLICK" className="primary">
                  Call {v.dealership.phone}
                </TrackedLink>
              )}
              {waHref && (
                <TrackedLink href={waHref} vehicleId={v.id} eventType="WHATSAPP_CLICK" className="secondary">
                  WhatsApp us
                </TrackedLink>
              )}
            </div>
          </div>

          <div className="card card-pad mt-4">
            <h2 className="text-sm font-semibold text-slate-900">Enquire about this vehicle</h2>
            <EnquiryForm vehicleId={v.id} stockNumber={v.stockNumber} />
          </div>
        </aside>
      </div>
    </main>
  );
}
