import { prisma } from "@/lib/prisma";
import { ReservationsTable, type ReservationRow } from "@/components/admin/reservations-table";

export const dynamic = "force-dynamic";

function tierOf(zoneName: string): "VVIP" | "Normal" {
  return /vvip/i.test(zoneName) ? "VVIP" : "Normal";
}

/** Extract a sortable numeric key from labels like "1", "VIP 3", "VVIP1", "V1 Lounge". */
function tableSortKey(label: string): number {
  const match = label.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 9999;
}

export default async function AdminReservationsPage() {
  const items = await prisma.bookingItem.findMany({
    where: { isActive: true, tableId: { not: null } },
    include: {
      table: true,
      zone: true,
      tickets: true,
      booking: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: ReservationRow[] = items
    .filter((item) => item.table)
    .map((item) => ({
      id: item.id,
      bookingId: item.bookingId,
      tier: tierOf(item.zone.name),
      zoneName: item.zone.name,
      tableLabel: item.table!.label,
      tableSortKey: tableSortKey(item.table!.label),
      buyerName: item.booking.contactName || item.booking.user.name || "—",
      buyerEmail: item.booking.contactEmail,
      joinCode: item.joinCode,
      ticketCount: item.tickets.length,
      capacity: item.table!.capacity,
      paidStatus: item.booking.status,
      totalSatang: item.subtotalSatang,
      createdAt: item.createdAt.toISOString(),
    }));

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">
          // Reservations
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-white">Table reservations</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sorted VVIP → Normal, then by table number. Search by email, table code, buyer name.
        </p>
      </div>

      <ReservationsTable rows={rows} />
    </div>
  );
}
