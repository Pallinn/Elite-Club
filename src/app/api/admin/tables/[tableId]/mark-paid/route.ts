import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit";
import { activeBookingItemFilter } from "@/lib/availability";
import { expireStaleHolds } from "@/lib/expire-holds";
import { finalizeBookingPayment } from "@/lib/tickets";

const schema = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

/**
 * Creates a fully-paid booking for a table directly, skipping hold/QR/slip -
 * for when a customer already paid offline (or Slip2Go/the checkout flow
 * broke) and staff need to manually seat them. Reuses finalizeBookingPayment
 * so ticket-minting, join-code generation, and the purchase email all behave
 * exactly like a normal purchase (including the one-seat-per-person rule).
 */
export async function POST(request: Request, ctx: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await ctx.params;
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const admin = guard.session.user;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const table = await prisma.table.findUnique({ where: { id: tableId }, include: { zone: true } });
  if (!table || !table.isActive) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  // Flip a lapsed hold on this table before checking availability - otherwise
  // its row (isActive still true even though holdExpiresAt has passed) would
  // block the INSERT below via the partial unique index, even though it
  // already reads as "available" everywhere else. Same defensive step the
  // real hold-creation route takes (see /api/holds).
  await expireStaleHolds(prisma, { items: { some: { tableId } } });

  const existingItem = await prisma.bookingItem.findFirst({
    where: { ...activeBookingItemFilter(), tableId },
  });
  if (existingItem) {
    return NextResponse.json({ error: "This table already has an active reservation." }, { status: 409 });
  }

  const buyer = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!buyer) {
    return NextResponse.json(
      { error: "No account with that email. They need to sign up first." },
      { status: 404 }
    );
  }

  const unitPriceSatang = table.priceSatang ?? table.zone.priceSatang;

  const booking = await prisma.booking.create({
    data: {
      userId: buyer.id,
      eventId: table.zone.eventId,
      status: "HOLD",
      // Safety net only - finalizeBookingPayment below flips this to PAID
      // immediately. If that ever throws partway, this expiry means the row
      // self-heals via the normal stale-hold sweep instead of sitting
      // invisible-to-availability but still blocking the table forever.
      holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      totalSatang: unitPriceSatang,
      contactName: parsed.data.name,
      contactEmail: parsed.data.email,
      contactPhone: parsed.data.phone || null,
      items: {
        create: [
          {
            zoneId: table.zoneId,
            tableId: table.id,
            quantity: 1,
            unitPriceSatang,
            subtotalSatang: unitPriceSatang,
          },
        ],
      },
      payments: {
        create: [
          {
            provider: "MANUAL",
            method: "PROMPTPAY",
            status: "SUCCEEDED",
            amountSatang: unitPriceSatang,
            paidAt: new Date(),
            failureMessage: `Manually created by admin ${admin.email}`,
          },
        ],
      },
    },
  });

  await finalizeBookingPayment(booking.id);

  await recordAudit({
    actorUserId: admin.id,
    actorLabel: admin.name ?? admin.email ?? null,
    action: "booking.marked_paid_manual",
    entityType: "Booking",
    entityId: booking.id,
    metadata: { tableLabel: table.label, amountSatang: unitPriceSatang, buyerEmail: parsed.data.email },
  });

  return NextResponse.json({ ok: true, bookingId: booking.id });
}
