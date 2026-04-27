import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import VehicleForm from "@/components/VehicleForm";
import { createVehicle } from "@/app/admin/_actions/vehicle";

export default async function NewVehiclePage() {
  await requireRole(Role.ADMIN, Role.MANAGER, Role.OFFICE);
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold text-slate-900">New vehicle</h1>
      <VehicleForm action={createVehicle} submitLabel="Create draft" />
    </div>
  );
}
