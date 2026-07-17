import { prisma } from "@/lib/prisma";
import { getEventAvailability } from "@/lib/availability";
import { BookingShell } from "@/components/booking/booking-shell";
import { FloorPlanBooking } from "@/components/booking/floor-plan-booking";
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

  const zones = await getEventAvailability(event.id);

  const tables: FloorTable[] = zones.flatMap((zone) =>
    zone.tables.map((table) => ({
      key: `table:${table.id}`,
      tableId: table.id,
      zoneId: zone.id,
      label: table.label,
      capacity: table.capacity,
      priceSatang: table.priceSatang ?? zone.priceSatang,
      isBooked: table.isBooked,
      floor: table.floor === 2 ? 2 : 1,
      positionXPct: table.positionXPct,
      positionYPct: table.positionYPct,
      isPremium: /vvip/i.test(zone.name),
    }))
  );

  return (
    <BookingShell step="ticket" backHref="/">
      <FloorPlanBooking
        eventId={event.id}
        eventName={event.name}
        venueName={event.venueName}
        startAt={event.startAt.toISOString()}
        tables={tables}
      />
    </BookingShell>
  );
}
