import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTicketQrPayload } from "@/lib/qr";

const validateSchema = z.object({ raw: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = validateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { valid, ticketId } = verifyTicketQrPayload(parsed.data.raw);
  if (!valid || !ticketId) {
    return NextResponse.json({ error: "Invalid QR code." }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { bookingItem: { include: { zone: true, table: true, booking: true } } },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  // Atomic compare-and-set: if another scan already won the race, this affects 0 rows.
  const { count } = await prisma.ticket.updateMany({
    where: { id: ticketId, status: "VALID" },
    data: { status: "USED", usedAt: new Date(), usedByUserId: session.user.id },
  });

  const label = ticket.bookingItem.table ? ticket.bookingItem.table.label : ticket.bookingItem.zone.name;

  if (count === 0) {
    return NextResponse.json(
      {
        error:
          ticket.status === "VOID"
            ? "This ticket has been voided."
            : `Already checked in at ${ticket.usedAt?.toLocaleTimeString() ?? "an earlier time"}.`,
        ticketNumber: ticket.ticketNumber,
        label,
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    ticketNumber: ticket.ticketNumber,
    label,
    contactName: ticket.bookingItem.booking.contactName,
  });
}
