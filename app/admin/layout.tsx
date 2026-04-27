import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isDemoMode = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("localhost");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-600 text-white text-sm">D</span>
            DealerOps Admin
          </Link>
          <Link href="/stock" className="secondary inline-flex text-xs">← Back to site</Link>
        </div>
      </header>

      {isDemoMode && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          <strong>Demo mode.</strong> Admin features require a database connection.{" "}
          <a href="https://neon.tech" target="_blank" rel="noreferrer" className="underline">
            Connect a Neon database
          </a>{" "}
          and set <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> to enable the full admin app.
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {!isDemoMode && (
          <nav className="hidden w-52 shrink-0 lg:block">
            <ul className="space-y-1 text-sm">
              {[
                ["/admin/dashboard", "Dashboard"],
                ["/admin/stock", "Stock"],
                ["/admin/leads", "Leads"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
