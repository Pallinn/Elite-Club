import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendPurchaseEmail } from "@/lib/email/send";
import { generateUniqueJoinCode } from "@/lib/join-code";
import { getLogoPngBuffer } from "@/lib/email/assets";
import { recordAudit } from "@/lib/audit";
import { findAttendanceConflict } from "@/lib/table-membership";

function generateTicketNumber(): string {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `NOSIGNAL-${random}`;
}

/**
 * Marks a booking as paid and mints one Ticket row per admission (one per
 * quantity, or one per VIP table item). Idempotent — safe to call more than
 * once for the same booking (e.g. a retried webhook).
 */
export async function finalizeBookingPayment(bookingId: string) {
  const alreadyPaid = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { items: { include: { tickets: true } } },
    });
    if (!booking) return true;
    if (booking.status === "PAID") return true;

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "PAID", paidAt: new Date() },
    });

    for (const item of booking.items) {
      if (item.tickets.length === 0) {
        if (item.tableId) {
          // A buyer only gets auto-seated on the first table they're
          // attending this event - buying a second table makes them its
          // owner/manager (gets the join code below) without occupying a
          // seat there themselves, so capacity isn't wasted double-counting
          // one person in two places.
          const conflict = await findAttendanceConflict(tx, {
            userId: booking.userId,
            eventId: booking.eventId,
            excludeTableId: item.tableId,
          });
          if (!conflict) {
            await tx.ticket.create({
              data: {
                bookingItemId: item.id,
                ticketNumber: generateTicketNumber(),
                holderUserId: booking.userId,
              },
            });
          }
        } else {
          const ticketsToCreate = Array.from({ length: item.quantity }, () => ({
            bookingItemId: item.id,
            ticketNumber: generateTicketNumber(),
            holderUserId: booking.userId,
          }));
          await tx.ticket.createMany({ data: ticketsToCreate });
        }
      }

      // Each VIP table gets a shareable join code once paid, so friends can
      // redeem it for their own ticket to the same table - whether or not
      // the buyer themselves got auto-seated on it.
      if (item.tableId && !item.joinCode) {
        const joinCode = await generateUniqueJoinCode(tx);
        await tx.bookingItem.update({ where: { id: item.id }, data: { joinCode } });
      }
    }

    return false;
  });

  if (!alreadyPaid) {
    await recordAudit({
      action: "booking.paid",
      entityType: "Booking",
      entityId: bookingId,
    });

    // Don't let a flaky email provider turn a successful payment into a failed
    // webhook response — tickets are already minted; email can be resent.
    try {
      await sendBookingPurchaseEmail(bookingId);
    } catch (err) {
      console.error(`Failed to send purchase email for booking ${bookingId}:`, err);
    }
  }
}

export async function sendBookingPurchaseEmail(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      items: { include: { table: true, tickets: true } },
    },
  });
  if (!booking) return;

  // Build one "table entry" per table item, using the item's join code as the
  // shareable Table Code. The email doesn't render a personal QR - ticketNumber
  // is only used as a React key - so an owner-only table (buyer not auto-seated,
  // see finalizeBookingPayment) still gets its own confirmation entry.
  const entries = [] as {
    tableCode: string;
    ticketNumber: string;
  }[];
  for (const item of booking.items) {
    if (!item.table || !item.joinCode) continue;
    entries.push({
      tableCode: item.joinCode,
      ticketNumber: item.tickets[0]?.ticketNumber ?? item.id,
    });
  }
  if (entries.length === 0) return;

  await sendPurchaseEmail({
    to: booking.contactEmail,
    logoPng: getLogoPngBuffer(),
    tables: entries,
  });
}
