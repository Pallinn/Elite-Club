import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEventAvailability } from "@/lib/availability";
import { formatSatang } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const event = await prisma.event.findFirst();
  if (!event) {
    return <p className="text-neutral-400">No event configured yet.</p>;
  }

  const [revenue, ticketCount, recentBookings, zones] = await Promise.all([
    prisma.booking.aggregate({
      where: { eventId: event.id, status: "PAID" },
      _sum: { totalSatang: true },
    }),
    prisma.ticket.count({ where: { bookingItem: { booking: { eventId: event.id, status: "PAID" } } } }),
    prisma.booking.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: { include: { zone: true, table: true } }, user: true },
    }),
    getEventAvailability(event.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-neutral-950">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl text-white">
            {formatSatang(revenue._sum.totalSatang ?? 0)}
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-neutral-950">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Tickets sold</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl text-white">{ticketCount}</CardContent>
        </Card>
        <Card className="border-white/10 bg-neutral-950">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Event</CardTitle>
          </CardHeader>
          <CardContent className="text-lg text-white">{event.name}</CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">Remaining capacity</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {zones.map((zone) => (
            <Card key={zone.id} className="border-white/10 bg-neutral-950">
              <CardContent className="flex justify-between text-sm">
                <span className="text-neutral-300">{zone.name}</span>
                <span className="text-white">
                  {zone.type === "GENERAL_ADMISSION"
                    ? `${zone.available} / ${zone.totalCapacity} left`
                    : `${zone.tables.filter((t) => !t.isBooked).length} / ${zone.tables.length} tables left`}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent bookings</h2>
          <Link href="/admin/bookings" className="text-sm text-neutral-400 hover:text-white">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {recentBookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/admin/bookings/${booking.id}`}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-neutral-950 p-3 text-sm hover:border-white/30"
            >
              <div>
                <p className="text-white">{booking.contactName || booking.user.name}</p>
                <p className="text-neutral-500">
                  {booking.items.map((i) => i.table?.label ?? `${i.zone.name} x${i.quantity}`).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white">{formatSatang(booking.totalSatang)}</span>
                <Badge variant={booking.status === "PAID" ? "default" : "secondary"}>
                  {booking.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
