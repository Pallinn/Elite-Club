import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/**
 * A BookingItem counts against capacity while it's an unexpired hold or a paid booking.
 * Expired holds are excluded here even before the cron sweep flips their status -
 * this is what actually guarantees no double-booking, the cron is just hygiene.
 */
export function activeBookingItemFilter(now: Date = new Date()): Prisma.BookingItemWhereInput {
  return {
    isActive: true,
    booking: {
      OR: [
        { status: "PAID" },
        { status: "HOLD", holdExpiresAt: { gt: now } },
      ],
    },
  };
}

export async function getEventAvailability(eventId: string) {
  const now = new Date();
  const activeFilter = activeBookingItemFilter(now);

  const zones = await prisma.zone.findMany({
    where: { eventId, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { tables: { where: { isActive: true } } },
  });

  const zoneIds = zones.map((z) => z.id);

  const [gaUsage, activeTableItems] = await Promise.all([
    prisma.bookingItem.groupBy({
      by: ["zoneId"],
      where: { ...activeFilter, zoneId: { in: zoneIds }, tableId: null },
      _sum: { quantity: true },
    }),
    prisma.bookingItem.findMany({
      where: { ...activeFilter, tableId: { not: null } },
      select: { tableId: true },
    }),
  ]);

  const gaUsageByZone = new Map(gaUsage.map((g) => [g.zoneId, g._sum.quantity ?? 0]));
  const bookedTableIds = new Set(activeTableItems.map((i) => i.tableId));

  return zones.map((zone) => {
    const used = gaUsageByZone.get(zone.id) ?? 0;
    return {
      ...zone,
      available: zone.type === "GENERAL_ADMISSION" ? Math.max(0, zone.totalCapacity - used) : 0,
      tables: zone.tables.map((table) => ({
        ...table,
        isBooked: bookedTableIds.has(table.id),
      })),
    };
  });
}

export type EventAvailability = Awaited<ReturnType<typeof getEventAvailability>>;
