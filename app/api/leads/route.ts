import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leadInputSchema } from "@/lib/validators/lead";
import { LeadActivityType, LeadStatus, Role, TaskStatus } from "@prisma/client";
import { writeAudit } from "@/lib/audit";

// crude in-memory rate limiter — replace with Postgres/Upstash in prod
const HITS = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = HITS.get(ip);
  if (!entry || entry.resetAt < now) {
    HITS.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests, please try again shortly." }, { status: 429 });
    }
    const json = await req.json().catch(() => null);
    if (!json) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const parsed = leadInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
    }
    const data = parsed.data;
    if (data.website && data.website.length > 0) {
      // honeypot trip — silently accept and drop
      return NextResponse.json({ ok: true });
    }

    // Resolve dealership: vehicle's, otherwise the first dealership in DB.
    let dealershipId: string | null = null;
    if (data.vehicleId) {
      const v = await db.vehicle.findUnique({ where: { id: data.vehicleId }, select: { dealershipId: true } });
      dealershipId = v?.dealershipId ?? null;
    }
    if (!dealershipId) {
      const d = await db.dealership.findFirst();
      if (!d) return NextResponse.json({ error: "Dealership not configured" }, { status: 500 });
      dealershipId = d.id;
    }

    // Round-robin auto-assign across active sales/manager users
    const candidates = await db.user.findMany({
      where: { dealershipId, role: { in: [Role.SALES, Role.MANAGER] } },
      orderBy: { createdAt: "asc" },
    });
    const recent = await db.lead.count({ where: { dealershipId } });
    const assignee = candidates.length > 0 ? candidates[recent % candidates.length] : null;

    const lead = await db.lead.create({
      data: {
        dealershipId,
        vehicleId: data.vehicleId ?? null,
        sourceChannel: "website",
        customerName: data.customerName,
        email: data.email || null,
        phone: data.phone || null,
        message: data.message || null,
        leadType: data.leadType,
        consentMarketing: !!data.consentMarketing,
        ip,
        userAgent: req.headers.get("user-agent") ?? null,
        assignedToUserId: assignee?.id ?? null,
        status: LeadStatus.NEW,
      },
    });

    // Best-effort metric event
    if (data.vehicleId) {
      await db.vehicleMetricEvent.create({
        data: { vehicleId: data.vehicleId, eventType: "ENQUIRY" },
      }).catch(() => {});
    }

    // Auto-create a follow-up task for the assignee
    if (assignee) {
      const due = new Date(Date.now() + 60 * 60 * 1000);
      await db.task.create({
        data: {
          leadId: lead.id,
          vehicleId: data.vehicleId ?? null,
          assignedToUserId: assignee.id,
          title: `Contact ${lead.customerName} within 1 hour`,
          dueAt: due,
          status: TaskStatus.OPEN,
        },
      });
      await db.leadActivity.create({
        data: {
          leadId: lead.id,
          type: LeadActivityType.TASK_CREATED,
          body: `Auto-assigned to ${assignee.name}.`,
        },
      });
    }

    await writeAudit({
      dealershipId,
      entityType: "lead",
      entityId: lead.id,
      action: "created",
      after: { leadType: lead.leadType, sourceChannel: lead.sourceChannel },
    });

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
