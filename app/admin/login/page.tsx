import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-8">
      <div className="card card-pad">
        <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-xs text-slate-500">
          Demo: <code>owner@dealerops.local</code> / <code>dealerops</code>
        </p>
        <LoginForm />
        <p className="mt-4 text-xs text-slate-500">
          <Link href="/stock">← Back to public site</Link>
        </p>
      </div>
    </div>
  );
}

async function LoginForm() {
  return (
    <form method="post" action="/api/auth/login" className="mt-4 grid gap-3">
      <div className="grid gap-1">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="grid gap-1">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <button type="submit" className="primary">Sign in</button>
    </form>
  );
}
