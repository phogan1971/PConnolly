import { db } from "@/lib/db";

type AuditEntry = {
  dealershipId: string;
  actorUserId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
};

export async function writeAudit(entry: AuditEntry) {
  await db.auditLog.create({
    data: {
      dealershipId: entry.dealershipId,
      actorUserId: entry.actorUserId ?? null,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      beforeJson: (entry.before ?? undefined) as object | undefined,
      afterJson: (entry.after ?? undefined) as object | undefined,
    },
  });
}
