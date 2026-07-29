import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit";

/**
 * Force-releases a stuck HOLD (e.g. a customer backed out but the passive
 * expiry triggers haven't caught it yet). Frees the table/zone slot
 * immediately, same as a customer-initiated cancel or a natural expiry.
 */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const admin = guard.session.user;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "HOLD") {
    return NextResponse.json({ error: "Only HOLD bookings can be cancelled this way." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.booking.update({ where: { id }, data: { status: "CANCELLED" } }),
    prisma.bookingItem.updateMany({ where: { bookingId: id }, data: { isActive: false } }),
  ]);

  await recordAudit({
    actorUserId: admin.id,
    actorLabel: admin.name ?? admin.email ?? null,
    action: "booking.cancelled",
    entityType: "Booking",
    entityId: id,
    metadata: { contactEmail: booking.contactEmail, forcedByAdmin: true },
  });

  return NextResponse.json({ ok: true });
}
