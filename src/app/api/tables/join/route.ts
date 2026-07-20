import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendJoinEmail } from "@/lib/email/send";
import { getLogoPngBuffer, getTicketQrPngBuffer } from "@/lib/email/assets";
import { recordAudit } from "@/lib/audit";

const joinSchema = z.object({
  code: z.string().trim().min(1),
});

function generateTicketNumber(): string {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `NOSIGNAL-${random}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in to join a table." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-character table code." }, { status: 400 });
  }

  const code = parsed.data.code.toUpperCase().replace(/\s+/g, "");

  const item = await prisma.bookingItem.findUnique({
    where: { joinCode: code },
    include: { table: true, tickets: true, booking: { include: { event: true } } },
  });

  if (!item || !item.table || item.booking.status !== "PAID") {
    return NextResponse.json({ error: "That code doesn't match any table." }, { status: 404 });
  }

  const existingTicket = item.tickets.find((t) => t.holderUserId === session.user.id);
  if (existingTicket) {
    return NextResponse.json({ ticketId: existingTicket.id, alreadyJoined: true });
  }

  if (item.tickets.length >= item.table.capacity) {
    return NextResponse.json({ error: `${item.table.label} is already full.` }, { status: 409 });
  }

  const ticket = await prisma.ticket.create({
    data: {
      bookingItemId: item.id,
      ticketNumber: generateTicketNumber(),
      holderUserId: session.user.id,
    },
  });

  await recordAudit({
    actorUserId: session.user.id,
    actorLabel: session.user.name ?? session.user.email ?? null,
    action: "ticket.join_redeemed",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: {
      tableLabel: item.table.label,
      joinCode: code,
      bookingItemId: item.id,
    },
  });

  try {
    await sendJoinEmail({
      to: session.user.email!,
      logoPng: getLogoPngBuffer(),
      qrPng: await getTicketQrPngBuffer(ticket.id),
      ticketNumber: ticket.ticketNumber,
    });
  } catch (err) {
    console.error(`Failed to send join-ticket email for ticket ${ticket.id}:`, err);
  }

  return NextResponse.json({ ticketId: ticket.id, alreadyJoined: false });
}
