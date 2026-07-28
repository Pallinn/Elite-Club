import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit";

export async function POST(request: Request, ctx: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await ctx.params;
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const admin = guard.session.user;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { bookingItem: { include: { table: true, booking: true } } },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  // Atomic compare-and-set: if another admin already checked this ticket in,
  // this affects 0 rows instead of double-recording the check-in.
  const { count } = await prisma.ticket.updateMany({
    where: { id: ticketId, status: "VALID" },
    data: { status: "USED", usedAt: new Date(), usedByUserId: admin.id },
  });

  if (count === 0) {
    return NextResponse.json(
      {
        error:
          ticket.status === "VOID"
            ? "This ticket has been removed and can't check in."
            : `Already checked in at ${ticket.usedAt?.toLocaleTimeString() ?? "an earlier time"}.`,
      },
      { status: 409 }
    );
  }

  await recordAudit({
    actorUserId: admin.id,
    actorLabel: admin.name ?? admin.email ?? null,
    action: "ticket.checked_in",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: {
      ticketNumber: ticket.ticketNumber,
      tableLabel: ticket.bookingItem.table?.label ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
