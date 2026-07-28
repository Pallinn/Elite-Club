import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      bookingItem: { include: { table: true, zone: true, booking: { include: { event: true } } } },
    },
  });

  const canView =
    ticket &&
    (ticket.holderUserId === session.user.id ||
      ticket.bookingItem.booking.userId === session.user.id);

  if (!ticket || !canView) {
    redirect("/account/bookings");
  }

  const { bookingItem } = ticket;
  const label = bookingItem.table ? bookingItem.table.label : bookingItem.zone.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{bookingItem.booking.event.name}</h1>
        <p className="text-sm text-neutral-400">
          {bookingItem.booking.event.venueName} &middot;{" "}
          {bookingItem.booking.event.startAt.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      <Card className="mx-auto max-w-sm border-white/10 bg-neutral-950">
        <CardHeader>
          <CardTitle className="text-base text-white">{label}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <p className="text-xs text-neutral-400">{ticket.ticketNumber}</p>
          <a
            href={`/api/tickets/${ticket.id}/pdf`}
            className="text-xs text-white underline underline-offset-4"
          >
            Download PDF
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
