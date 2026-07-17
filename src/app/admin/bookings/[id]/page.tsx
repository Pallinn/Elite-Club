import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatSatang } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: true,
      event: true,
      items: { include: { zone: true, table: true, tickets: true } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!booking) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{booking.contactName}</h1>
          <p className="text-sm text-neutral-400">{booking.contactEmail}</p>
        </div>
        <Badge variant={booking.status === "PAID" ? "default" : "secondary"}>{booking.status}</Badge>
      </div>

      <Card className="border-white/10 bg-neutral-950">
        <CardHeader>
          <CardTitle className="text-white text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {booking.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm text-neutral-300">
              <span>
                {item.table ? item.table.label : `${item.zone.name} x${item.quantity}`}
                {item.tickets.length > 0 && (
                  <span className="ml-2 text-xs text-neutral-500">
                    {item.tickets.map((t) => t.ticketNumber).join(", ")}
                  </span>
                )}
              </span>
              <span className="text-white">{formatSatang(item.subtotalSatang)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-medium text-white">
            <span>Total</span>
            <span>{formatSatang(booking.totalSatang)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-neutral-950">
        <CardHeader>
          <CardTitle className="text-white text-base">Payment attempts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {booking.payments.length === 0 && (
            <p className="text-sm text-neutral-500">No payment attempts yet.</p>
          )}
          {booking.payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between text-sm text-neutral-300">
              <span>
                {payment.method} &middot; {payment.createdAt.toLocaleString()}
              </span>
              <Badge variant={payment.status === "SUCCEEDED" ? "default" : "secondary"}>
                {payment.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
