import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendTicketsEmail } from "@/lib/email/send";

function generateTicketNumber(): string {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `NOSIGNAL-${random}`;
}

/**
 * Marks a booking as paid and mints one Ticket row per admission (GA: one per
 * quantity, VIP table: one per booking item / whole table). Idempotent - safe
 * to call more than once for the same booking (e.g. a retried webhook).
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
      if (item.tickets.length > 0) continue; // already minted (retry safety)
      const ticketsToCreate = Array.from({ length: item.quantity }, () => ({
        bookingItemId: item.id,
        ticketNumber: generateTicketNumber(),
      }));
      await tx.ticket.createMany({ data: ticketsToCreate });
    }

    return false;
  });

  if (!alreadyPaid) {
    // Don't let a flaky email provider turn a successful payment into a failed
    // webhook response - the tickets are already minted; email can be resent later.
    try {
      await sendBookingTicketsEmail(bookingId);
    } catch (err) {
      console.error(`Failed to send tickets email for booking ${bookingId}:`, err);
    }
  }
}

export async function sendBookingTicketsEmail(bookingId: string, isResend = false) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      event: true,
      items: { include: { zone: true, table: true, tickets: true } },
    },
  });
  if (!booking) return;

  const appUrl = process.env.APP_URL ?? "";
  const tickets = booking.items.flatMap((item) =>
    item.tickets.map((ticket) => ({
      ticketNumber: ticket.ticketNumber,
      label: item.table ? item.table.label : item.zone.name,
      qrUrl: `${appUrl}/api/tickets/${ticket.id}/qr`,
    }))
  );
  if (tickets.length === 0) return;

  await sendTicketsEmail({
    to: booking.contactEmail,
    contactName: booking.contactName,
    eventName: booking.event.name,
    venueName: booking.event.venueName ?? "",
    startAt: booking.event.startAt.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    tickets,
    isResend,
  });
}
