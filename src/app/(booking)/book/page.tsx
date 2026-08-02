import { prisma } from "@/lib/prisma";
import { getEventAvailability } from "@/lib/availability";
import { expireStaleHolds } from "@/lib/expire-holds";
import { recordAudit } from "@/lib/audit";
import { BookPageTabs } from "@/components/booking/book-page-tabs";
import type { FloorTable } from "@/components/booking/floor-plan-map";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const event = await prisma.event.findFirst({ where: { status: "PUBLISHED" } });

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-center">
        <div>
          <h1 className="font-heading text-xl font-bold text-white">No event on sale</h1>
          <p className="mt-2 text-sm text-neutral-400">Check back soon.</p>
        </div>
      </div>
    );
  }

  // Availability reads already exclude a lapsed hold (see
  // activeBookingItemFilter), and /api/holds itself re-sweeps the specific
  // table right before creating a new one - so this isn't needed for
  // correctness, and doesn't need to block the availability read below.
  // It's extra hygiene: /book is the highest-traffic page, so sweeping here
  // keeps stale HOLD rows from sitting around (looking stuck in the admin
  // dashboard) between cron runs, for any table, not just the one someone
  // happens to click next.
  const [zones, expiredIds] = await Promise.all([
    getEventAvailability(event.id),
    expireStaleHolds(prisma, { eventId: event.id }),
  ]);
  await Promise.all(
    expiredIds.map((id) =>
      recordAudit({ action: "booking.expired", entityType: "Booking", entityId: id, actorLabel: "system" })
    )
  );

  const tables: FloorTable[] = zones.flatMap((zone) =>
    zone.tables.map((table) => ({
      key: `table:${table.id}`,
      tableId: table.id,
      zoneId: zone.id,
      label: table.label,
      capacity: table.capacity,
      priceSatang: table.priceSatang ?? zone.priceSatang,
      isBooked: table.isBooked,
      isLocked: table.isLocked,
      floor: table.floor === 2 ? 2 : 1,
      positionXPct: table.positionXPct,
      positionYPct: table.positionYPct,
      isPremium: /vvip/i.test(zone.name),
    }))
  );

  return (
    <BookPageTabs
      eventId={event.id}
      eventName={event.name}
      venueName={event.venueName}
      startAt={event.startAt.toISOString()}
      tables={tables}
    />
  );
}
