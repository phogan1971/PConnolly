import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { PublicationStatus, VehicleStatus, FuelType, Transmission, BodyType, Prisma } from "@prisma/client";
import { formatEUR, formatKm } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  make?: string;
  model?: string;
  fuel?: string;
  transmission?: string;
  bodyType?: string;
  priceMin?: string;
  priceMax?: string;
  yearMin?: string;
  q?: string;
}>;

export default async function PublicStockPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const where: Prisma.VehicleWhereInput = {
    status: VehicleStatus.PUBLISHED,
    publications: {
      some: {
        status: PublicationStatus.PUBLISHED,
        channel: { key: "website" },
      },
    },
  };
  if (params.make) where.make = params.make;
  if (params.model) where.model = params.model;
  if (params.fuel) where.fuelType = params.fuel as FuelType;
  if (params.transmission) where.transmission = params.transmission as Transmission;
  if (params.bodyType) where.bodyType = params.bodyType as BodyType;
  if (params.priceMin || params.priceMax) {
    const range: Prisma.IntFilter = {};
    if (params.priceMin) range.gte = Number(params.priceMin) * 100;
    if (params.priceMax) range.lte = Number(params.priceMax) * 100;
    where.priceRetailCents = range;
  }
  if (params.yearMin) where.year = { gte: Number(params.yearMin) };
  if (params.q) {
    where.OR = [
      { make: { contains: params.q, mode: "insensitive" } },
      { model: { contains: params.q, mode: "insensitive" } },
      { variant: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const vehicles = await db.vehicle.findMany({
    where,
    include: { media: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ datePublished: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  // Distinct facets — cheap for MVP catalog sizes.
  const allMakes = await db.vehicle.findMany({
    where: { status: VehicleStatus.PUBLISHED },
    select: { make: true },
    distinct: ["make"],
    orderBy: { make: "asc" },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Our stock</h1>
      <p className="mt-1 text-sm text-slate-500">
        {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"} available.
      </p>

      <form className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" placeholder="Search make / model" defaultValue={params.q ?? ""} className="lg:col-span-2" />
        <select name="make" defaultValue={params.make ?? ""}>
          <option value="">Any make</option>
          {allMakes.map((m) => (
            <option key={m.make} value={m.make}>{m.make}</option>
          ))}
        </select>
        <select name="fuel" defaultValue={params.fuel ?? ""}>
          <option value="">Any fuel</option>
          {Object.values(FuelType).map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select name="transmission" defaultValue={params.transmission ?? ""}>
          <option value="">Any transmission</option>
          {Object.values(Transmission).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select name="bodyType" defaultValue={params.bodyType ?? ""}>
          <option value="">Any body</option>
          {Object.values(BodyType).map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <input name="priceMax" type="number" placeholder="Max price (€)" defaultValue={params.priceMax ?? ""} />
        <input name="yearMin" type="number" placeholder="From year" defaultValue={params.yearMin ?? ""} />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-2">
          <button type="submit" className="primary">Filter</button>
          <Link href="/stock" className="secondary inline-flex items-center justify-center">Reset</Link>
        </div>
      </form>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v) => {
          const cover = v.media[0]?.url;
          return (
            <li key={v.id} className="card overflow-hidden transition hover:shadow-md">
              <Link href={`/stock/${v.slug}`} className="block">
                <div className="relative aspect-[4/3] bg-slate-100">
                  {cover ? (
                    <Image src={cover} alt={v.media[0]?.altText ?? `${v.year} ${v.make} ${v.model}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-slate-400">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">{v.year} · {v.fuelType} · {v.transmission}</div>
                  <div className="mt-1 line-clamp-1 text-base font-semibold text-slate-900">{v.make} {v.model}</div>
                  <div className="text-sm text-slate-600 line-clamp-1">{v.variant}</div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-slate-900">{formatEUR(v.priceRetailCents)}</span>
                    <span className="text-xs text-slate-500">{formatKm(v.mileageKm)}</span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {vehicles.length === 0 && (
        <div className="mt-12 rounded-lg border border-dashed border-slate-300 p-12 text-center text-slate-500">
          No vehicles match those filters.
        </div>
      )}
    </main>
  );
}
