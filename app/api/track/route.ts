import { NextResponse } from "next/server";
import { z } from "zod";
import { MetricEventType } from "@prisma/client";
import { recordMetricEvent } from "@/lib/metrics/track";

const inputSchema = z.object({
  vehicleId: z.string().min(1),
  eventType: z.nativeEnum(MetricEventType),
  sessionId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    if (!json) return NextResponse.json({ ok: false }, { status: 400 });
    const parsed = inputSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
    await recordMetricEvent(parsed.data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
