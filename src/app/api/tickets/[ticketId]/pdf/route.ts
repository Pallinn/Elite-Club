import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketDocument } from "@/lib/pdf/ticket-document";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await ctx.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      bookingItem: {
        include: { zone: true, table: true, booking: { include: { event: true } } },
      },
    },
  });

  if (!ticket || ticket.bookingItem.booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfBuffer = await renderToBuffer(
    TicketDocument({
      eventName: ticket.bookingItem.booking.event.name,
      venueName: ticket.bookingItem.booking.event.venueName ?? "",
      startAt: ticket.bookingItem.booking.event.startAt.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      ticketNumber: ticket.ticketNumber,
      zoneLabel: ticket.bookingItem.table
        ? ticket.bookingItem.table.label
        : ticket.bookingItem.zone.name,
    })
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${ticket.ticketNumber}.pdf"`,
    },
  });
}
