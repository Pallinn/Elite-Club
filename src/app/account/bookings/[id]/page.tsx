import { redirect } from "next/navigation";
import QRCode from "qrcode";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTicketQrPayload } from "@/lib/qr";
import { formatSatang } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResendTicketsButton } from "@/components/account/resend-tickets-button";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      event: true,
      items: { include: { zone: true, table: true, tickets: true } },
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    redirect("/account/bookings");
  }

  const tickets = await Promise.all(
    booking.items.flatMap((item) =>
      item.tickets.map(async (ticket) => ({
        ...ticket,
        label: item.table ? item.table.label : item.zone.name,
        qrDataUrl: await QRCode.toDataURL(buildTicketQrPayload(ticket.id)),
      }))
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{booking.event.name}</h1>
          <p className="text-sm text-neutral-400">
            {booking.event.venueName} &middot;{" "}
            {booking.event.startAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <Badge variant={booking.status === "PAID" ? "default" : "secondary"}>{booking.status}</Badge>
      </div>

      <Card className="border-white/10 bg-neutral-950">
        <CardContent className="flex justify-between text-sm text-neutral-300">
          <span>Total paid</span>
          <span className="text-white">{formatSatang(booking.totalSatang)}</span>
        </CardContent>
      </Card>

      {booking.status === "PAID" && (
        <>
          <div className="flex justify-end">
            <ResendTicketsButton bookingId={booking.id} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="border-white/10 bg-neutral-950">
                <CardHeader>
                  <CardTitle className="text-white text-base">{ticket.label}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3">
                  <Image
                    src={ticket.qrDataUrl}
                    alt={ticket.ticketNumber}
                    width={180}
                    height={180}
                    unoptimized
                    className="rounded bg-white p-2"
                  />
                  <p className="text-xs text-neutral-400">{ticket.ticketNumber}</p>
                  <a
                    href={`/api/tickets/${ticket.id}/pdf`}
                    className="text-xs text-white underline underline-offset-4"
                  >
                    Download PDF
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
