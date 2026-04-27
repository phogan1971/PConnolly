import Link from "next/link";
import { DEMO_DEALERSHIP } from "@/lib/demo-data";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const dealership = DEMO_DEALERSHIP;
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/stock" className="flex items-center gap-2 text-lg font-semibold text-slate-900 hover:text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-600 text-white">D</span>
            <span>{dealership.tradingName ?? dealership.name}</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-slate-700">
            <Link href="/stock">Stock</Link>
            <a href={`tel:${dealership.phone.replace(/\s+/g, "")}`} className="hidden sm:inline">
              {dealership.phone}
            </a>
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-16 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {dealership.tradingName ?? dealership.name}. Powered by DealerOps.
      </footer>
    </div>
  );
}
