import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/admin/event-form";
import { ZoneEditor } from "@/components/admin/zone-editor";

export const dynamic = "force-dynamic";

export default async function AdminEventPage() {
  const event = await prisma.event.findFirst({
    include: { zones: { orderBy: { sortOrder: "asc" }, include: { tables: true } } },
  });

  if (!event) {
    return <p className="text-neutral-400">No event configured yet.</p>;
  }

  return (
    <div className="space-y-8">
      <EventForm event={event} />
      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">Zones &amp; tables</h2>
        <ZoneEditor
          zones={event.zones.map((zone) => ({
            id: zone.id,
            name: zone.name,
            type: zone.type,
            description: zone.description,
            priceSatang: zone.priceSatang,
            totalCapacity: zone.totalCapacity,
            tables: zone.tables.map((t) => ({
              id: t.id,
              label: t.label,
              capacity: t.capacity,
              priceSatang: t.priceSatang,
            })),
          }))}
        />
      </div>
    </div>
  );
}
