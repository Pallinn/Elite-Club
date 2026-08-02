import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

export async function POST(
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
    include: { bookingItem: { include: { booking: true, table: true } } },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const booking = ticket.bookingItem.booking;
  if (booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (ticket.holderUserId === booking.userId) {
    return NextResponse.json({ error: "You can't remove yourself from your own table." }, { status: 409 });
  }
  if (ticket.status === "USED") {
    return NextResponse.json({ error: "This guest has already checked in." }, { status: 409 });
  }

  await prisma.ticket.delete({ where: { id: ticketId } });

  await recordAudit({
    actorUserId: session.user.id,
    actorLabel: session.user.name ?? session.user.email ?? null,
    action: "ticket.removed_by_owner",
    entityType: "Ticket",
    entityId: ticketId,
    metadata: {
      ticketNumber: ticket.ticketNumber,
      holderUserId: ticket.holderUserId,
      bookingItemId: ticket.bookingItemId,
      tableLabel: ticket.bookingItem.table?.label ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
