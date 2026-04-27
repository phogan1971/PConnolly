import Link from "next/link";
import Image from "next/image";
import { DEMO_VEHICLES } from "@/lib/demo-data";
import { formatEUR, formatKm } from "@/lib/format";

type SearchParams = Promise<{
  make?: string;
  fuel?: string;
  transmission?: string;
  bodyType?: string;
  priceMax?: string;
  q?: string;
}>;

export default async function PublicStockPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  let vehicles = DEMO_VEHICLES;

  if (params.q) {
    const q = params.q.toLowerCase();
    vehicles = vehicles.filter(
      (v) =>
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.variant.toLowerCase().includes(q),
    );
  }
  if (params.make) vehicles = vehicles.filter((v) => v.make === params.make);
  if (params.fuel) vehicles = vehicles.filter((v) => v.fuelType === params.fuel);
  if (params.transmission) vehicles = vehicles.filter((v) => v.transmission === params.transmission);
  if (params.bodyType) vehicles = vehicles.filter((v) => v.bodyType === params.bodyType);
  if (params.priceMax) vehicles = vehicles.filter((v) => v.priceRetailCents <= Number(params.priceMax) * 100);

  const allMakes = [...new Set(DEMO_VEHICLES.map((v) => v.make))].sort();
  const allFuels = [...new Set(DEMO_VEHICLES.map((v) => v.fuelType))].sort();
  const allBodies = [...new Set(DEMO_VEHICLES.map((v) => v.bodyType))].sort();

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
          {allMakes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select name="fuel" defaultValue={params.fuel ?? ""}>
          <option value="">Any fuel</option>
          {allFuels.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select name="bodyType" defaultValue={params.bodyType ?? ""}>
          <option value="">Any body</option>
          {allBodies.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <input name="priceMax" type="number" placeholder="Max price (€)" defaultValue={params.priceMax ?? ""} />
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
                    <Image
                      src={cover}
                      alt={v.media[0]?.altText ?? `${v.year} ${v.make} ${v.model}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-slate-400">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {v.year} · {v.fuelType} · {v.transmission}
                  </div>
                  <div className="mt-1 line-clamp-1 text-base font-semibold text-slate-900">
                    {v.make} {v.model}
                  </div>
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
