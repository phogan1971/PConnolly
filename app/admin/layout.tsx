import Link from "next/link";
import { getSessionUser, ROLE_LABELS } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const dealership = user ? await db.dealership.findUnique({ where: { id: user.dealershipId } }) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-600 text-white text-sm">D</span>
              DealerOps
            </Link>
            <span className="hidden text-xs text-slate-500 sm:inline">{dealership?.tradingName ?? dealership?.name ?? ""}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            {user ? (
              <>
                <span>{user.name} · <span className="badge badge-blue">{ROLE_LABELS[user.role]}</span></span>
                <form action="/api/auth/logout" method="post">
                  <button className="secondary" type="submit">Log out</button>
                </form>
              </>
            ) : (
              <Link href="/admin/login" className="secondary inline-flex">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {user && (
          <nav className="hidden w-52 shrink-0 lg:block">
            <ul className="space-y-1 text-sm">
              {[
                ["/admin/dashboard", "Dashboard"],
                ["/admin/stock", "Stock"],
                ["/admin/leads", "Leads"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-md border border-dashed border-slate-300 p-3 text-xs text-slate-500">
              <strong className="block text-slate-700">Phase 1 vertical slice.</strong>
              Tasks, reports & settings UIs land in Phase 2.
            </div>
          </nav>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
