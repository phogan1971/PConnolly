import Link from "next/link";
import { notFound } from "next/navigation";
import { Role, PublicationStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishToChannelAction, unpublishFromChannelAction } from "@/app/admin/_actions/vehicle";
import { getAdapterForChannel } from "@/lib/channels/registry";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<PublicationStatus, string> = {
  NOT_READY: "badge-gray",
  READY: "badge-blue",
  QUEUED: "badge-blue",
  PUBLISHED: "badge-green",
  FAILED: "badge-red",
  UNPUBLISHED: "badge-gray",
  READY_FOR_CARZONE_EXPORT: "badge-amber",
};

export default async function PublishingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(Role.ADMIN, Role.MANAGER, Role.OFFICE);

  const v = await db.vehicle.findUnique({
    where: { id },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      dealership: true,
      publications: { include: { channel: true }, orderBy: { channel: { key: "asc" } } },
    },
  });
  if (!v || v.dealershipId !== user.dealershipId) notFound();

  const channels = await db.channel.findMany({ orderBy: { key: "asc" } });

  // Pre-compute validation per channel for display
  const validations: Record<string, { ok: boolean; messages: string[] }> = {};
  for (const c of channels) {
    const adapter = await getAdapterForChannel(c.key);
    if (!adapter) continue;
    const r = adapter.validateVehicle(v);
    validations[c.key] = {
      ok: r.ok,
      messages: r.issues.map((i) => `${i.severity.toUpperCase()}: ${i.message}`),
    };
  }

  return (
    <div className="grid gap-6">
      <div>
        <Link href={`/admin/stock/${v.id}`} className="text-sm text-slate-500">← Vehicle</Link>
        <h1 className="text-xl font-bold text-slate-900">Publishing · {v.year} {v.make} {v.model}</h1>
      </div>

      <div className="grid gap-3">
        {channels.map((c) => {
          const pub = v.publications.find((p) => p.channelId === c.id);
          const isWebsite = c.key === "website";
          const isCarzone = c.key === "carzone";
          const validation = validations[c.key] ?? { ok: false, messages: [] };

          return (
            <div key={c.id} className="card card-pad">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.type}</div>
                </div>
                <span className={`badge ${pub ? STATUS_BADGE[pub.status] : "badge-gray"}`}>
                  {pub?.status.replace(/_/g, " ").toLowerCase() ?? "no record"}
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                <div><span className="text-slate-400">Last published:</span> {formatDate(pub?.lastPublishedAt ?? null)}</div>
                <div><span className="text-slate-400">Last exported:</span> {formatDate(pub?.lastExportedAt ?? null)}</div>
                {pub?.externalListingId && <div><span className="text-slate-400">External id:</span> {pub.externalListingId}</div>}
              </div>

              {pub?.lastError && (
                <div className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-800">Last error: {pub.lastError}</div>
              )}

              {validation.messages.length > 0 && (
                <ul className="mt-3 grid gap-1 text-xs">
                  {validation.messages.map((m, i) => (
                    <li key={i} className={m.startsWith("ERROR") ? "text-red-800" : "text-amber-800"}>{m}</li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isWebsite && (
                  <>
                    <form action={publishToChannelAction.bind(null, v.id, c.key)}>
                      <button type="submit" className="primary" disabled={!validation.ok}>Publish to website</button>
                    </form>
                    <form action={unpublishFromChannelAction.bind(null, v.id, c.key)}>
                      <button type="submit" className="secondary">Unpublish</button>
                    </form>
                  </>
                )}
                {isCarzone && (
                  <>
                    <form action={publishToChannelAction.bind(null, v.id, c.key)}>
                      <button type="submit" className="primary" disabled={!validation.ok}>Generate Carzone export</button>
                    </form>
                    <Link href="/api/exports/carzone/feed.csv" className="secondary" target="_blank">⬇ Feed (CSV)</Link>
                    <Link href="/api/exports/carzone/feed.xml" className="secondary" target="_blank">⬇ Feed (XML)</Link>
                    <form action={unpublishFromChannelAction.bind(null, v.id, c.key)}>
                      <button type="submit" className="secondary">Mark unpublished</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card card-pad bg-slate-50 text-xs text-slate-600">
        <strong className="block text-slate-800">Carzone compliance reminder.</strong>
        DealerOps does not scrape Carzone or automate the back-office. The Carzone channel
        builds a compliant export payload and exposes it as a CSV/XML feed for manual handoff
        or partner-pull. When official Motion/Carzone API credentials are issued, the adapter
        is swapped without rewriting this screen.
      </div>
    </div>
  );
}
