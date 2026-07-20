import { prisma } from "@/lib/prisma";
import { getEventAvailability } from "@/lib/availability";
import { TableManager, type AdminTable } from "@/components/admin/table-manager";

export const dynamic = "force-dynamic";

export default async function AdminTablesPage() {
  const event = await prisma.event.findFirst({ where: { status: "PUBLISHED" } });
  if (!event) {
    return <p className="text-neutral-400">No published event.</p>;
  }

  const zones = await getEventAvailability(event.id);

  const tables: AdminTable[] = zones.flatMap((zone) =>
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
