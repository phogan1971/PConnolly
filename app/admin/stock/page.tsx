import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { VehicleStatus, Prisma } from "@prisma/client";
import { formatEUR, formatKm, daysSince } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<VehicleStatus, string> = {
  DRAFT: "badge-gray",
  IN_PREP: "badge-amber",
  READY: "badge-blue",
  PUBLISHED: "badge-green",
  RESERVED: "badge-purple",
  SOLD: "badge-gray",
  ARCHIVED: "badge-gray",
};

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const where: Prisma.VehicleWhereInput = { dealershipId: user.dealershipId };
  if (params.status && Object.values(VehicleStatus).includes(params.status as VehicleStatus)) {
    where.status = params.status as VehicleStatus;
  }
  if (params.q) {
    where.OR = [
      { make: { contains: params.q, mode: "insensitive" } },
      { model: { contains: params.q, mode: "insensitive" } },
      { stockNumber: { contains: params.q, mode: "insensitive" } },
      { registration: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const vehicles = await db.vehicle.findMany({
    where,
    include: {
      _count: { select: { media: true, leads: true } },
      publications: { include: { channel: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Stock</h1>
        <Link href="/admin/stock/new" className="primary">+ New vehicle</Link>
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3">
        <input name="q" placeholder="Search make / model / stock / reg" defaultValue={params.q ?? ""} className="min-w-[280px]" />
        <select name="status" defaultValue={params.status ?? ""}>
          <option value="">Any status</option>
          {Object.values(VehicleStatus).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="primary">Filter</button>
        <Link href="/admin/stock" className="secondary">Reset</Link>
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Vehicle</th>
              <th className="px-4 py-2">Reg</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Mileage</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Channels</th>
              <th className="px-4 py-2 text-right">Days</th>
              <th className="px-4 py-2 text-right">Photos</th>
              <th className="px-4 py-2 text-right">Leads</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{v.stockNumber}</td>
                <td className="px-4 py-2">
                  <Link href={`/admin/stock/${v.id}`} className="font-medium">{v.year} {v.make} {v.model}</Link>
                  {v.variant && <div className="text-xs text-slate-500">{v.variant}</div>}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{v.registration ?? "—"}</td>
                <td className="px-4 py-2 text-right">{formatEUR(v.priceRetailCents)}</td>
                <td className="px-4 py-2 text-right">{formatKm(v.mileageKm)}</td>
                <td className="px-4 py-2"><span className={`badge ${STATUS_BADGE[v.status]}`}>{v.status}</span></td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1 text-xs">
                    {v.publications.map((p) => (
                      <span key={p.id} className={`badge ${p.status === "PUBLISHED" ? "badge-green" : p.status === "FAILED" ? "badge-red" : p.status === "READY_FOR_CARZONE_EXPORT" ? "badge-amber" : "badge-gray"}`}>
                        {p.channel.key}: {p.status.replace(/_/g, " ").toLowerCase()}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2 text-right">{daysSince(v.datePublished ?? v.createdAt)}d</td>
                <td className="px-4 py-2 text-right">{v._count.media}</td>
                <td className="px-4 py-2 text-right">{v._count.leads}</td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">No vehicles match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
