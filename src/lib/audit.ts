import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type AuditInput = {
  action: string;
  actorUserId?: string | null;
  actorLabel?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

/**
 * Append-only activity log. Never throws — a broken log write must not fail
 * the operation being logged. Every write is best-effort; drop the record
 * (and console.error) if the DB is unavailable.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId ?? null,
        actorLabel: input.actorLabel ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (err) {
    console.error("audit log write failed:", err, input);
  }
}
