import { NextResponse } from "next/server";
import { leadInputSchema } from "@/lib/validators/lead";

// In-memory rate limiter — good enough for demo
const HITS = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = HITS.get(ip);
  if (!entry || entry.resetAt < now) {
    HITS.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 10;
}

export async function POST(req: Request) {
  try {
    if (rateLimited(getClientIp(req))) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }
    const json = await req.json().catch(() => null);
    if (!json) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const parsed = leadInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
    }
    if (parsed.data.website) {
      // honeypot — silently accept
      return NextResponse.json({ ok: true });
    }

    // Demo mode: log to console, don't persist.
    console.log("[LEAD]", {
      name: parsed.data.customerName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      type: parsed.data.leadType,
      vehicleId: parsed.data.vehicleId,
      message: parsed.data.message,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
