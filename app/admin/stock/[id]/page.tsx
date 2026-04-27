import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, canEditStock } from "@/lib/auth";
import { db } from "@/lib/db";
import VehicleForm from "@/components/VehicleForm";
import { updateVehicle, generateAdvertCopy, setVehicleStatus } from "@/app/admin/_actions/vehicle";
import { checkCompliance, complianceSummary } from "@/lib/compliance";
import { VehicleStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const v = await db.vehicle.findUnique({
    where: { id },
    include: { media: true, dealership: true, publications: true },
  });
  if (!v || v.dealershipId !== user.dealershipId) notFound();

  const issues = checkCompliance(v);
  const summary = complianceSummary(issues);
  const editable = canEditStock(user.role);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/stock" className="text-sm text-slate-500">← Stock</Link>
          <h1 className="text-xl font-bold text-slate-900">{v.year} {v.make} {v.model} <span className="text-slate-400">· {v.stockNumber}</span></h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/stock/${v.id}/media`} className="secondary">📷 Media ({v.media.length})</Link>
          <Link href={`/admin/stock/${v.id}/publishing`} className="secondary">📡 Publishing</Link>
          {editable && (
            <form action={generateAdvertCopy.bind(null, v.id)}>
              <button type="submit" className="secondary">✨ Generate advert copy</button>
            </form>
          )}
        </div>
      </div>

      <ComplianceBox issues={issues} ok={summary.ok} />

      {editable && summary.ok && v.status !== VehicleStatus.READY && v.status !== VehicleStatus.PUBLISHED && (
        <form action={setVehicleStatus.bind(null, v.id, VehicleStatus.READY)}>
          <button type="submit" className="primary">Mark Ready</button>
        </form>
      )}

      {editable ? (
        <VehicleForm
          action={async (formData) => {
            "use server";
            await updateVehicle(v.id, formData);
          }}
          vehicle={v}
          submitLabel="Save changes"
        />
      ) : (
        <div className="card card-pad text-sm text-slate-600">You don&apos;t have permission to edit this vehicle.</div>
      )}
    </div>
  );
}

function ComplianceBox({ issues, ok }: { issues: ReturnType<typeof checkCompliance>; ok: boolean }) {
  if (issues.length === 0) {
    return (
      <div className="card card-pad bg-green-50 border-green-200 text-sm text-green-900">
        ✅ Compliance: all checks passed.
      </div>
    );
  }
  return (
    <div className={`card card-pad ${ok ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
      <div className={`text-sm font-medium ${ok ? "text-amber-900" : "text-red-900"}`}>
        {ok ? "Compliance: warnings to review" : "Compliance: blockers must be fixed before publishing"}
      </div>
      <ul className="mt-2 grid gap-1 text-sm">
        {issues.map((i, idx) => (
          <li key={idx} className={i.severity === "error" ? "text-red-800" : "text-amber-800"}>
            <span className="font-mono text-xs uppercase">{i.severity}</span> · {i.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
