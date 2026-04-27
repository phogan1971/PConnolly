import {
  FuelType, Transmission, BodyType, ServiceHistory, VehicleStatus,
} from "@prisma/client";
import type { Vehicle } from "@prisma/client";

export type VehicleFormProps = {
  action: (formData: FormData) => Promise<void>;
  vehicle?: Vehicle | null;
  submitLabel: string;
};

function val(v: unknown, def: string = "") {
  return v == null ? def : String(v);
}

export default function VehicleForm({ action, vehicle, submitLabel }: VehicleFormProps) {
  const features = Array.isArray(vehicle?.features) ? (vehicle?.features as string[]).join("\n") : "";

  return (
    <form action={action} className="grid gap-6">
      <Section title="Identification">
        <Field label="Stock number" name="stockNumber" required defaultValue={val(vehicle?.stockNumber)} />
        <Field label="Registration" name="registration" defaultValue={val(vehicle?.registration)} />
        <Field label="VIN" name="vin" defaultValue={val(vehicle?.vin)} />
        <Field label="Status" name="status">
          <select name="status" defaultValue={vehicle?.status ?? VehicleStatus.DRAFT}>
            {Object.values(VehicleStatus).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </Section>

      <Section title="Vehicle">
        <Field label="Make" name="make" required defaultValue={val(vehicle?.make)} />
        <Field label="Model" name="model" required defaultValue={val(vehicle?.model)} />
        <Field label="Variant" name="variant" defaultValue={val(vehicle?.variant)} />
        <Field label="Year" name="year" type="number" required defaultValue={val(vehicle?.year)} />
        <Field label="Mileage (km)" name="mileageKm" type="number" required defaultValue={val(vehicle?.mileageKm)} />
        <Field label="Fuel type" name="fuelType">
          <select name="fuelType" defaultValue={vehicle?.fuelType ?? FuelType.PETROL}>
            {Object.values(FuelType).map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Transmission" name="transmission">
          <select name="transmission" defaultValue={vehicle?.transmission ?? Transmission.MANUAL}>
            {Object.values(Transmission).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Body type" name="bodyType">
          <select name="bodyType" defaultValue={vehicle?.bodyType ?? BodyType.HATCHBACK}>
            {Object.values(BodyType).map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Engine size (cc)" name="engineSizeCc" type="number" defaultValue={val(vehicle?.engineSizeCc)} />
        <Field label="Colour" name="colour" defaultValue={val(vehicle?.colour)} />
        <Field label="Doors" name="doors" type="number" defaultValue={val(vehicle?.doors)} />
        <Field label="Seats" name="seats" type="number" defaultValue={val(vehicle?.seats)} />
        <Field label="Previous owners" name="previousOwners" type="number" defaultValue={val(vehicle?.previousOwners)} />
        <Field label="Service history" name="serviceHistory">
          <select name="serviceHistory" defaultValue={vehicle?.serviceHistory ?? ""}>
            <option value="">—</option>
            {Object.values(ServiceHistory).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Warranty (months)" name="warrantyMonths" type="number" defaultValue={val(vehicle?.warrantyMonths)} />
      </Section>

      <Section title="Pricing">
        <Field label="Retail price (€)" name="priceRetailEur" type="number" step="0.01" required
          defaultValue={vehicle?.priceRetailCents != null ? String(vehicle.priceRetailCents / 100) : ""} />
        <Field label="Was price (€)" name="priceWasEur" type="number" step="0.01"
          defaultValue={vehicle?.priceWasCents != null ? String(vehicle.priceWasCents / 100) : ""} />
        <Field label="VAT included" name="vatIncluded">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="vatIncluded" value="true" defaultChecked={vehicle?.vatIncluded ?? true} />
            <span>Price includes VAT</span>
          </label>
        </Field>
        <Field label="Finance available" name="financeAvailable">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="financeAvailable" value="true" defaultChecked={vehicle?.financeAvailable ?? false} />
            <span>Show finance CTA</span>
          </label>
        </Field>
        <Field label="Monthly from (€)" name="monthlyPaymentFromEur" type="number" step="0.01"
          defaultValue={vehicle?.monthlyPaymentFromCents != null ? String(vehicle.monthlyPaymentFromCents / 100) : ""} />
      </Section>

      <Section title="Description & location">
        <Field label="Location" name="location" defaultValue={val(vehicle?.location)} />
        <div className="sm:col-span-2">
          <label htmlFor="descriptionShort">Short description (≤ 280 chars)</label>
          <textarea id="descriptionShort" name="descriptionShort" rows={2} maxLength={280} defaultValue={val(vehicle?.descriptionShort)} className="mt-1 w-full" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="descriptionLong">Long description</label>
          <textarea id="descriptionLong" name="descriptionLong" rows={6} maxLength={8000} defaultValue={val(vehicle?.descriptionLong)} className="mt-1 w-full" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="features">Features (one per line or comma-separated)</label>
          <textarea id="features" name="features" rows={4} defaultValue={features} className="mt-1 w-full" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="internalNotes">Internal notes (never published)</label>
          <textarea id="internalNotes" name="internalNotes" rows={3} maxLength={4000} defaultValue={val(vehicle?.internalNotes)} className="mt-1 w-full" />
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button type="submit" className="primary">{submitLabel}</button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card card-pad">
      <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  step,
  children,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  step?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <label htmlFor={name}>{label}{required ? " *" : ""}</label>
      {children ?? <input id={name} name={name} type={type} step={step} required={required} defaultValue={defaultValue} />}
    </div>
  );
}
