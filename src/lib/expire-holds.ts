import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type Db = typeof prisma | Prisma.TransactionClient;

/**
 * Flips stale HOLD bookings (past holdExpiresAt) to EXPIRED and frees their
 * BookingItems (isActive = false). The cron sweep calls this with no extra
 * filter to clean up broadly; hold creation calls it scoped to a single
 * table/zone right before checking for conflicts, so a re-book doesn't have
 * to wait for the next cron tick to see the table as free at the DB level
 * (read-only availability checks already treat expired holds as inactive,
 * but the partial unique index on Table still enforces isActive at the row
 * level, so the row itself has to be flipped before a new INSERT can land).
 */
export async function expireStaleHolds(
  db: Db,
  extraWhere: Prisma.BookingWhereInput = {},
  now: Date = new Date()
): Promise<string[]> {
  const stale = await db.booking.findMany({
    where: { status: "HOLD", holdExpiresAt: { lt: now }, ...extraWhere },
    select: { id: true },
  });

  if (stale.length === 0) return [];

  const staleIds = stale.map((b) => b.id);

  await db.booking.updateMany({
    where: { id: { in: staleIds } },
    data: { status: "EXPIRED" },
  });
  await db.bookingItem.updateMany({
    where: { bookingId: { in: staleIds } },
    data: { isActive: false },
  });

  return staleIds;
}
