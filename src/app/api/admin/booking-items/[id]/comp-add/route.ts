import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit";

const schema = z.object({ email: z.email() });

function generateTicketNumber(): string {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `NOSIGNAL-${random}`;
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const admin = guard.session.user;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const item = await prisma.bookingItem.findUnique({
    where: { id },
    include: { table: true, tickets: true, booking: true },
  });
  if (!item || !item.table) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }
  if (item.booking.status !== "PAID") {
    return NextResponse.json({ error: "Booking must be PAID first." }, { status: 409 });
  }
  if (item.tickets.length >= item.table.capacity) {
    return NextResponse.json({ error: "Table is at capacity." }, { status: 409 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json(
      { error: "No account with that email. They need to sign up first." },
      { status: 404 }
    );
  }
  if (item.tickets.some((t) => t.holderUserId === user.id)) {
    return NextResponse.json({ error: "That user already has a ticket on this table." }, { status: 409 });
  }

  const ticket = await prisma.ticket.create({
    data: {
      bookingItemId: item.id,
      ticketNumber: generateTicketNumber(),
      holderUserId: user.id,
    },
  });

  await recordAudit({
    actorUserId: admin.id,
    actorLabel: admin.name ?? admin.email ?? null,
    action: "ticket.comp_add",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: {
      ticketNumber: ticket.ticketNumber,
      bookingItemId: item.id,
      tableLabel: item.table.label,
      grantedTo: { id: user.id, email: user.email },
    },
  });

  return NextResponse.json({ ok: true, ticket });
}
