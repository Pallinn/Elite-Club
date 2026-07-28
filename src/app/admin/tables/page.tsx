import { prisma } from "@/lib/prisma";
import { getEventAvailability, activeBookingItemFilter } from "@/lib/availability";
import { TableManager, type AdminTable } from "@/components/admin/table-manager";
import { tierOf } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export default async function AdminTablesPage() {
  const event = await prisma.event.findFirst({ where: { status: "PUBLISHED" } });
  if (!event) {
    return <p className="text-neutral-400">No published event.</p>;
  }

  const zones = await getEventAvailability(event.id);

  // Pull the active booking item + roster for every currently-booked table,
  // so the floor-plan manager can show "who's on this table" without a
  // client-side round trip per click.
  const bookingItems = await prisma.bookingItem.findMany({
    where: { ...activeBookingItemFilter(), tableId: { not: null } },
    include: {
      tickets: { include: { holder: true }, orderBy: { createdAt: "asc" } },
      booking: true,
    },
  });
  const bookingItemByTableId = new Map(bookingItems.map((item) => [item.tableId!, item]));

  const tables: AdminTable[] = zones.flatMap((zone) =>
    zone.tables.map((table) => {
      const item = bookingItemByTableId.get(table.id);
      return {
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
        tier: tierOf(zone.name),
        bookingItemId: item?.id ?? null,
        paidStatus: item?.booking.status ?? null,
        tickets: item
          ? item.tickets.map((t) => ({
              id: t.id,
              ticketNumber: t.ticketNumber,
              status: t.status,
              isBuyer: t.holderUserId === item.booking.userId,
              holder: t.holder ? { name: t.holder.name, email: t.holder.email } : null,
            }))
          : [],
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">// Tables</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-white">Table management</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Click a table on the floor plan to edit price, capacity, or lock/unlock it.
        </p>
      </div>
      <TableManager tables={tables} />
    </div>
  );
}
