import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LeadStatus, LeadActivityType } from "@prisma/client";
import { requireUser, canManageLeads } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

async function changeStatus(leadId: string, status: LeadStatus) {
  "use server";
  const user = await requireUser();
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  if (lead.dealershipId !== user.dealershipId) throw new Error("Forbidden");
  await db.$transaction([
    db.lead.update({ where: { id: leadId }, data: { status } }),
    db.leadActivity.create({
      data: { leadId, userId: user.id, type: LeadActivityType.STATUS_CHANGE, body: `Status → ${status}` },
    }),
  ]);
  await writeAudit({
    dealershipId: user.dealershipId,
    actorUserId: user.id,
    entityType: "lead",
    entityId: leadId,
    action: `status_changed:${status}`,
    before: { status: lead.status },
    after: { status },
  });
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
}

async function addNote(leadId: string, formData: FormData) {
  "use server";
  const user = await requireUser();
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  if (lead.dealershipId !== user.dealershipId) throw new Error("Forbidden");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await db.leadActivity.create({
    data: { leadId, userId: user.id, type: LeadActivityType.NOTE, body },
  });
  revalidatePath(`/admin/leads/${leadId}`);
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      vehicle: { select: { id: true, make: true, model: true, year: true, stockNumber: true, slug: true } },
      activities: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
      tasks: { orderBy: { dueAt: "asc" } },
    },
  });
  if (!lead || lead.dealershipId !== user.dealershipId) notFound();
  const can = canManageLeads(user.role);

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/leads" className="text-sm text-slate-500">← Leads</Link>
        <h1 className="text-xl font-bold text-slate-900">{lead.customerName}</h1>
        <div className="text-sm text-slate-500">
          {lead.email ?? "—"} · {lead.phone ?? "—"} · {lead.leadType} · <span className="badge badge-gray">{lead.status}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card card-pad lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
          {can && (
            <form action={addNote.bind(null, lead.id)} className="mt-3 grid gap-2">
              <textarea name="body" rows={3} placeholder="Add note…" required />
              <div><button type="submit" className="primary">Add note</button></div>
            </form>
          )}
          <ul className="mt-4 grid gap-3">
            {lead.message && (
              <li className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="text-xs text-slate-500">Initial message · {formatDate(lead.createdAt)}</div>
                <div className="mt-1 whitespace-pre-line">{lead.message}</div>
              </li>
            )}
            {lead.activities.map((a) => (
              <li key={a.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                <div className="text-xs text-slate-500">{a.type} · {a.user?.name ?? "system"} · {formatDate(a.createdAt)}</div>
                {a.body && <div className="mt-1 whitespace-pre-line">{a.body}</div>}
              </li>
            ))}
          </ul>
        </div>

        <aside className="grid gap-4">
          <div className="card card-pad">
            <h2 className="text-sm font-semibold text-slate-900">Vehicle</h2>
            {lead.vehicle ? (
              <div className="mt-2 text-sm">
                <Link href={`/admin/stock/${lead.vehicle.id}`} className="font-medium">{lead.vehicle.year} {lead.vehicle.make} {lead.vehicle.model}</Link>
                <div className="text-xs text-slate-500">{lead.vehicle.stockNumber}</div>
                <Link href={`/stock/${lead.vehicle.slug}`} target="_blank" className="mt-2 inline-block text-xs">View public listing →</Link>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500">General enquiry — no vehicle attached.</div>
            )}
          </div>

          {can && (
            <div className="card card-pad">
              <h2 className="text-sm font-semibold text-slate-900">Update status</h2>
              <div className="mt-3 grid gap-2">
                {Object.values(LeadStatus).filter((s) => s !== lead.status).map((s) => (
                  <form key={s} action={changeStatus.bind(null, lead.id, s)}>
                    <button type="submit" className="secondary w-full">{s.replace(/_/g, " ").toLowerCase()}</button>
                  </form>
                ))}
              </div>
            </div>
          )}

          <div className="card card-pad">
            <h2 className="text-sm font-semibold text-slate-900">Tasks</h2>
            {lead.tasks.length === 0 ? (
              <div className="mt-2 text-sm text-slate-500">No tasks.</div>
            ) : (
              <ul className="mt-2 grid gap-2 text-sm">
                {lead.tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between">
                    <span>{t.title}</span>
                    <span className="badge badge-gray">{t.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
