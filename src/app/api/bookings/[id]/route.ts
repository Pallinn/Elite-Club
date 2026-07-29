import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireStaleHolds } from "@/lib/expire-holds";
import { recordAudit } from "@/lib/audit";

const bookingInclude = {
  items: { include: { zone: true, table: true, tickets: true } },
  payments: { orderBy: { createdAt: "desc" as const } },
  event: true,
};

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });

  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // The client polls this endpoint while a PromptPay QR is showing or a slip
  // is being verified - verification itself is synchronous (see
  // /api/checkout/verify-slip), so there's no provider to re-check here.
  // Just write through a lapsed hold's expiry so the table/zone slot is
  // actually freed on the first poll after expiry, not only on the next cron
  // sweep or the next hold-creation attempt on that same table.
  const isStale =
    booking.status === "HOLD" &&
    booking.holdExpiresAt !== null &&
    booking.holdExpiresAt.getTime() < Date.now();

  if (isStale) {
    const expiredIds = await expireStaleHolds(prisma, { id: booking.id });
    for (const expiredId of expiredIds) {
      await recordAudit({
        action: "booking.expired",
        entityType: "Booking",
        entityId: expiredId,
        actorLabel: "system",
      });
    }
    booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json(booking);
}

const updateContactSchema = z.object({
  contactName: z.string().trim().min(1).max(100),
  contactEmail: z.email(),
  contactPhone: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.status !== "HOLD") {
    return NextResponse.json({ error: "This booking can no longer be edited." }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      contactName: parsed.data.contactName,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone || null,
    },
  });

  return NextResponse.json({ ok: true, booking: updated });
}
