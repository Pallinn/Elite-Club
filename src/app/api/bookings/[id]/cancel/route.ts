import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.status !== "HOLD") {
    return NextResponse.json({ error: "This reservation can no longer be cancelled." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.booking.update({ where: { id }, data: { status: "CANCELLED" } }),
    prisma.bookingItem.updateMany({ where: { bookingId: id }, data: { isActive: false } }),
  ]);

  await recordAudit({
    actorUserId: session.user.id,
    actorLabel: session.user.name ?? session.user.email ?? null,
    action: "booking.cancelled",
    entityType: "Booking",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
