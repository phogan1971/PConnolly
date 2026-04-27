import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LeadStatus, Prisma } from "@prisma/client";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<LeadStatus, string> = {
  NEW: "badge-amber",
  CONTACTED: "badge-blue",
  APPOINTMENT_BOOKED: "badge-purple",
  CLOSED_WON: "badge-green",
  CLOSED_LOST: "badge-gray",
  SPAM: "badge-red",
};

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const where: Prisma.LeadWhereInput = { dealershipId: user.dealershipId };
  if (params.status && Object.values(LeadStatus).includes(params.status as LeadStatus)) {
    where.status = params.status as LeadStatus;
  }
  const leads = await db.lead.findMany({
    where,
    include: { vehicle: { select: { make: true, model: true, year: true, stockNumber: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Lead inbox</h1>
      <form className="mt-4 flex gap-3">
        <select name="status" defaultValue={params.status ?? ""}>
          <option value="">All statuses</option>
          {Object.values(LeadStatus).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="primary">Filter</button>
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Vehicle</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-xs text-slate-500">{formatDate(l.createdAt)}</td>
                <td className="px-4 py-2">
                  <Link href={`/admin/leads/${l.id}`} className="font-medium">{l.customerName}</Link>
                  <div className="text-xs text-slate-500">{l.email ?? "—"} · {l.phone ?? "—"}</div>
                </td>
                <td className="px-4 py-2">
                  {l.vehicle ? `${l.vehicle.year} ${l.vehicle.make} ${l.vehicle.model} (${l.vehicle.stockNumber})` : <span className="text-slate-400">General</span>}
                </td>
                <td className="px-4 py-2"><span className="badge badge-gray">{l.leadType}</span></td>
                <td className="px-4 py-2"><span className={`badge ${STATUS_BADGE[l.status]}`}>{l.status}</span></td>
                <td className="px-4 py-2 text-xs text-slate-500">{l.sourceChannel}</td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No leads yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
