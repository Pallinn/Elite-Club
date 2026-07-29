import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { activeBookingItemFilter } from "@/lib/availability";

type Db = typeof prisma | Prisma.TransactionClient;

/**
 * A person can own/buy any number of VIP tables over time, but only one at a
 * time while it's still an unpaid HOLD - they have to finish (pay/cancel) or
 * let it expire before starting another. Returns the table they're currently
 * mid-checkout on, if any.
 */
export async function hasActiveHold(
  db: Db,
  { userId, eventId }: { userId: string; eventId: string }
): Promise<{ tableLabel: string } | null> {
  const item = await db.bookingItem.findFirst({
    where: {
      ...activeBookingItemFilter(),
      tableId: { not: null },
      booking: { userId, eventId, status: "HOLD" },
    },
    include: { table: true },
  });
  return item?.table ? { tableLabel: item.table.label } : null;
}

/**
 * A person can only physically attend (hold a VALID/USED ticket for) one
 * table per event - buying a second table makes them its owner/manager, not
 * an extra attendee, and joining someone else's table is blocked if they're
 * already seated elsewhere. Returns the table where they already have a seat.
 */
export async function findAttendanceConflict(
  db: Db,
  { userId, eventId, excludeTableId }: { userId: string; eventId: string; excludeTableId: string }
): Promise<{ tableLabel: string } | null> {
  const ticket = await db.ticket.findFirst({
    where: {
      holderUserId: userId,
      status: { in: ["VALID", "USED"] },
      bookingItem: {
        tableId: { not: null, notIn: [excludeTableId] },
        booking: { eventId },
      },
    },
    include: { bookingItem: { include: { table: true } } },
  });
  return ticket?.bookingItem.table ? { tableLabel: ticket.bookingItem.table.label } : null;
}
