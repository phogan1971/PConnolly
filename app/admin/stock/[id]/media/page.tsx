import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { addMediaUrl, deleteMedia, setPrimaryMedia, reorderMedia } from "@/app/admin/_actions/vehicle";

export const dynamic = "force-dynamic";

export default async function VehicleMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(Role.ADMIN, Role.MANAGER, Role.OFFICE);
  const v = await db.vehicle.findUnique({ where: { id }, include: { media: { orderBy: { sortOrder: "asc" } } } });
  if (!v || v.dealershipId !== user.dealershipId) notFound();

  return (
    <div className="grid gap-6">
      <div>
        <Link href={`/admin/stock/${v.id}`} className="text-sm text-slate-500">← Vehicle</Link>
        <h1 className="text-xl font-bold text-slate-900">Media · {v.year} {v.make} {v.model}</h1>
        <p className="mt-1 text-sm text-slate-500">
          MVP placeholder: paste an image URL (S3 / Cloudinary / R2). Direct file upload lands with the storage adapter in Phase 2.
        </p>
      </div>

      <form
        action={async (fd: FormData) => {
          "use server";
          const url = String(fd.get("url") ?? "").trim();
          const alt = String(fd.get("altText") ?? "").trim() || null;
          if (url) await addMediaUrl(v.id, url, alt);
        }}
        className="card card-pad grid gap-3 sm:grid-cols-3"
      >
        <div className="grid gap-1 sm:col-span-2">
          <label htmlFor="url">Image URL</label>
          <input id="url" name="url" type="url" placeholder="https://…" required />
        </div>
        <div className="grid gap-1">
          <label htmlFor="altText">Alt text</label>
          <input id="altText" name="altText" />
        </div>
        <div className="sm:col-span-3">
          <button type="submit" className="primary">Add image</button>
        </div>
      </form>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {v.media.map((m) => (
          <li key={m.id} className="card overflow-hidden">
            <div className="relative aspect-[4/3] bg-slate-100">
              <Image src={m.url} alt={m.altText ?? ""} fill sizes="33vw" className="object-cover" />
              {m.isPrimary && <span className="absolute left-2 top-2 badge badge-green">Primary</span>}
              <span className="absolute right-2 top-2 badge badge-gray">#{m.sortOrder}</span>
            </div>
            <div className="grid gap-2 p-3 text-xs">
              <div className="truncate text-slate-500">{m.altText ?? <em className="opacity-60">no alt</em>}</div>
              <div className="flex flex-wrap gap-2">
                <form action={setPrimaryMedia.bind(null, v.id, m.id)}>
                  <button className="secondary" type="submit">Make primary</button>
                </form>
                <form action={reorderMedia.bind(null, v.id, m.id, "up")}>
                  <button className="secondary" type="submit">↑</button>
                </form>
                <form action={reorderMedia.bind(null, v.id, m.id, "down")}>
                  <button className="secondary" type="submit">↓</button>
                </form>
                <form action={deleteMedia.bind(null, v.id, m.id)}>
                  <button className="danger" type="submit">Delete</button>
                </form>
              </div>
            </div>
          </li>
        ))}
        {v.media.length === 0 && <li className="card card-pad text-sm text-slate-500">No images yet.</li>}
      </ul>
    </div>
  );
}
