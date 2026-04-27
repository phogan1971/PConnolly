import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { VehicleStatus, PublicationStatus, LeadStatus } from "@prisma/client";
import { formatEUR, daysSince } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const dealershipId = user.dealershipId;

  const [
    totalStock, draftStock, readyStock, publishedStock, reservedStock, soldThisMonth,
    publishErrors, newLeads, vehicles, noImageVehicles,
  ] = await Promise.all([
    db.vehicle.count({ where: { dealershipId, status: { not: VehicleStatus.ARCHIVED } } }),
    db.vehicle.count({ where: { dealershipId, status: VehicleStatus.DRAFT } }),
    db.vehicle.count({ where: { dealershipId, status: VehicleStatus.READY } }),
    db.vehicle.count({ where: { dealershipId, status: VehicleStatus.PUBLISHED } }),
    db.vehicle.count({ where: { dealershipId, status: VehicleStatus.RESERVED } }),
    db.vehicle.count({
      where: {
        dealershipId,
        status: VehicleStatus.SOLD,
        dateSold: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    db.vehicleChannelPublication.count({ where: { status: PublicationStatus.FAILED, vehicle: { dealershipId } } }),
    db.lead.count({ where: { dealershipId, status: LeadStatus.NEW } }),
    db.vehicle.findMany({
      where: { dealershipId, status: { in: [VehicleStatus.PUBLISHED, VehicleStatus.READY] } },
      include: { _count: { select: { media: true, leads: true } } },
      orderBy: { datePublished: "asc" },
      take: 5,
    }),
    db.vehicle.count({
      where: { dealershipId, status: { in: [VehicleStatus.READY, VehicleStatus.PUBLISHED] }, media: { none: {} } },
    }),
  ]);

  const ageingBuckets = await Promise.all(
    [30, 60, 90].map(async (days) => {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const count = await db.vehicle.count({
        where: { dealershipId, status: VehicleStatus.PUBLISHED, datePublished: { lte: cutoff } },
      });
      return { days, count };
    }),
  );

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Total stock" value={totalStock} />
        <Card label="Draft" value={draftStock} />
        <Card label="Ready" value={readyStock} />
        <Card label="Published" value={publishedStock} />
        <Card label="Reserved" value={reservedStock} />
        <Card label="Sold this month" value={soldThisMonth} />
        <Card label="New leads" value={newLeads} accent={newLeads > 0 ? "amber" : "gray"} />
        <Card label="Channel errors" value={publishErrors} accent={publishErrors > 0 ? "red" : "gray"} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {ageingBuckets.map((b) => (
          <div key={b.days} className="card card-pad">
            <div className="text-xs uppercase tracking-wide text-slate-500">Aged &gt; {b.days} days</div>
            <div className={`mt-1 text-2xl font-bold ${b.count > 0 ? "text-amber-600" : "text-slate-900"}`}>{b.count}</div>
          </div>
        ))}
      </div>

      {noImageVehicles > 0 && (
        <div className="card card-pad bg-amber-50 border-amber-200">
          <div className="text-sm font-medium text-amber-900">{noImageVehicles} ready/published vehicle(s) without images.</div>
          <Link href="/admin/stock?status=PUBLISHED" className="mt-1 inline-block text-xs text-amber-900 underline">Review stock →</Link>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Oldest published / ready</h2>
          <Link href="/admin/stock" className="text-xs">View all stock →</Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {vehicles.map((v) => (
            <li key={v.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <Link href={`/admin/stock/${v.id}`} className="font-medium">{v.year} {v.make} {v.model}</Link>
                <span className="ml-2 text-xs text-slate-500">{v.stockNumber}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{formatEUR(v.priceRetailCents)}</span>
                <span>{daysSince(v.datePublished ?? v.createdAt) ?? 0}d</span>
                <span>{v._count.media} 📷</span>
                <span>{v._count.leads} leads</span>
              </div>
            </li>
          ))}
          {vehicles.length === 0 && <li className="px-5 py-6 text-sm text-slate-500">No published stock yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function Card({ label, value, accent = "gray" }: { label: string; value: number; accent?: "gray" | "amber" | "red" }) {
  const colour = accent === "amber" ? "text-amber-600" : accent === "red" ? "text-red-600" : "text-slate-900";
  return (
    <div className="card card-pad">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${colour}`}>{value}</div>
    </div>
  );
}
