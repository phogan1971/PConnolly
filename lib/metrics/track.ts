import { db } from "@/lib/db";
import { MetricEventType } from "@prisma/client";

export async function recordMetricEvent(args: {
  vehicleId: string;
  channelId?: string | null;
  eventType: MetricEventType;
  sessionId?: string | null;
}) {
  try {
    await db.vehicleMetricEvent.create({
      data: {
        vehicleId: args.vehicleId,
        channelId: args.channelId ?? null,
        eventType: args.eventType,
        sessionId: args.sessionId ?? null,
      },
    });
  } catch {
    // Metrics are best-effort. Never block a user-facing path on them.
  }
}
