import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendJoinEmail } from "@/lib/email/send";
import { getLogoPngBuffer } from "@/lib/email/assets";
import { recordAudit } from "@/lib/audit";
import { findAttendanceConflict } from "@/lib/table-membership";

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

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.bookingItem.findUnique({
        where: { joinCode: code },
        include: { table: true, tickets: true, booking: true },
      });

      if (!item || !item.table || item.booking.status !== "PAID") {
        throw new JoinError("That code doesn't match any table.", 404);
      }

      const existingTicket = item.tickets.find((t) => t.holderUserId === session.user.id);
      if (existingTicket) {
        return {
          ticketId: existingTicket.id,
          alreadyJoined: true,
          tableLabel: item.table.label,
          bookingItemId: item.id,
        };
      }

      // Lock the table row so two simultaneous joins can't both slip past the
      // capacity check below.
      await tx.$queryRaw`SELECT id FROM "Table" WHERE id = ${item.table.id} FOR UPDATE`;

      const currentTicketCount = await tx.ticket.count({ where: { bookingItemId: item.id } });
      if (currentTicketCount >= item.table.capacity) {
        throw new JoinError(`${item.table.label} is already full.`, 409);
      }

      const conflict = await findAttendanceConflict(tx, {
        userId: session.user.id,
        eventId: item.booking.eventId,
        excludeTableId: item.table.id,
      });
      if (conflict) {
        throw new JoinError(
          `You already have a ticket for ${conflict.tableLabel}. Only one table per person.`
        );
      }

      const ticket = await tx.ticket.create({
        data: {
          bookingItemId: item.id,
          ticketNumber: generateTicketNumber(),
          holderUserId: session.user.id,
        },
      });

      return {
        ticketId: ticket.id,
        alreadyJoined: false,
        tableLabel: item.table.label,
        bookingItemId: item.id,
      };
    });

    if (!result.alreadyJoined) {
      await recordAudit({
        actorUserId: session.user.id,
        actorLabel: session.user.name ?? session.user.email ?? null,
        action: "ticket.join_redeemed",
        entityType: "Ticket",
        entityId: result.ticketId,
        metadata: {
          tableLabel: result.tableLabel,
          joinCode: code,
          bookingItemId: result.bookingItemId,
        },
      });

      try {
        await sendJoinEmail({
          to: session.user.email!,
          logoPng: getLogoPngBuffer(),
          tableNumber: result.tableLabel,
          tableCode: code,
        });
      } catch (err) {
        console.error(`Failed to send join-ticket email for ticket ${result.ticketId}:`, err);
      }
    }

    return NextResponse.json({ ticketId: result.ticketId, alreadyJoined: result.alreadyJoined });
  } catch (err) {
    if (err instanceof JoinError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

class JoinError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.status = status;
  }
}
