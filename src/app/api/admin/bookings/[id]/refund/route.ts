import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit";

/**
 * Refunds a PAID booking: frees its table/zone slot immediately (like a
 * cancel/expiry) and voids every ticket on it, so nobody can still check in
 * or count against attendance. Does not touch the Payment rows themselves -
 * the actual money movement happens outside this app; this just reflects
 * that it happened.
 */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const admin = guard.session.user;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { items: { include: { table: true, zone: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "PAID") {
    return NextResponse.json({ error: "Only PAID bookings can be refunded." }, { status: 409 });
  }

  const itemIds = booking.items.map((i) => i.id);

  await prisma.$transaction([
    prisma.booking.update({ where: { id }, data: { status: "REFUNDED" } }),
    prisma.bookingItem.updateMany({ where: { id: { in: itemIds } }, data: { isActive: false } }),
    prisma.ticket.updateMany({
      where: { bookingItemId: { in: itemIds }, status: { not: "VOID" } },
      data: { status: "VOID" },
    }),
  ]);

  await recordAudit({
    actorUserId: admin.id,
    actorLabel: admin.name ?? admin.email ?? null,
    action: "booking.refunded",
    entityType: "Booking",
    entityId: id,
    metadata: {
      amountSatang: booking.totalSatang,
      contactEmail: booking.contactEmail,
      tableLabels: booking.items.map((i) => i.table?.label ?? i.zone.name),
    },
  });

  return NextResponse.json({ ok: true });
}
