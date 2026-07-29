import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { finalizeBookingPayment } from "@/lib/tickets";
import { recordAudit } from "@/lib/audit";

/**
 * Manually mark a HOLD booking as paid — used when a payment arrived offline
 * or Slip2Go verification failed for a legitimate transfer (e.g. its OCR
 * misread a slip). Mints tickets and generates join codes just like a normal
 * payment.
 */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const admin = guard.session.user;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status === "PAID") {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }
  if (booking.status !== "HOLD") {
    return NextResponse.json({ error: "Only HOLD bookings can be verified." }, { status: 409 });
  }

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: "MANUAL",
      method: "PROMPTPAY",
      status: "SUCCEEDED",
      amountSatang: booking.totalSatang,
      paidAt: new Date(),
      failureMessage: `Manually verified by admin ${admin.email}`,
    },
  });

  await finalizeBookingPayment(booking.id);

  await recordAudit({
    actorUserId: admin.id,
    actorLabel: admin.name ?? admin.email ?? null,
    action: "booking.verify_payment_manual",
    entityType: "Booking",
    entityId: booking.id,
    metadata: {
      amountSatang: booking.totalSatang,
      contactEmail: booking.contactEmail,
    },
  });

  return NextResponse.json({ ok: true });
}
