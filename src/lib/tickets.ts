import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendPurchaseEmail } from "@/lib/email/send";
import { generateUniqueJoinCode } from "@/lib/join-code";
import { getLogoPngBuffer, getTicketQrPngBuffer } from "@/lib/email/assets";
import { recordAudit } from "@/lib/audit";

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
        const ticketsToCreate = Array.from({ length: item.quantity }, () => ({
          bookingItemId: item.id,
          ticketNumber: generateTicketNumber(),
          holderUserId: booking.userId,
        }));
        await tx.ticket.createMany({ data: ticketsToCreate });
      }

      // Each VIP table gets a shareable join code once paid, so friends can
      // redeem it for their own ticket to the same table.
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
  // shareable Table Code and the first ticket for the QR.
  const entries = [] as {
    tableCode: string;
    qrPng: Buffer;
    ticketNumber: string;
  }[];
  for (const item of booking.items) {
    if (!item.table || !item.joinCode || item.tickets.length === 0) continue;
    const ticket = item.tickets[0];
    entries.push({
      tableCode: item.joinCode,
      qrPng: await getTicketQrPngBuffer(ticket.id),
      ticketNumber: ticket.ticketNumber,
    });
  }
  if (entries.length === 0) return;

  await sendPurchaseEmail({
    to: booking.contactEmail,
    logoPng: getLogoPngBuffer(),
    tables: entries,
  });
}
