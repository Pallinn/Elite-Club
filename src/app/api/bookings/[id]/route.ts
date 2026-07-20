import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { omise } from "@/lib/omise";
import { finalizeBookingPayment } from "@/lib/tickets";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      items: { include: { zone: true, table: true, tickets: true } },
      payments: { orderBy: { createdAt: "desc" } },
      event: true,
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // The client polls this endpoint while waiting for payment (e.g. scanning a
  // PromptPay QR). Omise's webhook is the authoritative confirmation path,
  // but it requires a public URL - unreachable from localhost without a
  // tunnel - so also re-check the charge directly on each poll as a fallback.
  const pendingPayment = booking.payments.find(
    (p) => p.status === "PENDING" && p.omiseChargeId
  );
  if (booking.status === "HOLD" && pendingPayment?.omiseChargeId) {
    const charge = await omise.charges.retrieve(pendingPayment.omiseChargeId);
    if (charge.status === "successful") {
      await finalizeBookingPayment(booking.id);
      booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          items: { include: { zone: true, table: true, tickets: true } },
          payments: { orderBy: { createdAt: "desc" } },
          event: true,
        },
      });
      if (!booking) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
  }

  // Reflect lazy hold expiry even before the cron sweep has run.
  const isExpired =
    booking.status === "HOLD" &&
    booking.holdExpiresAt !== null &&
    booking.holdExpiresAt.getTime() < Date.now();

  return NextResponse.json({
    ...booking,
    status: isExpired ? "EXPIRED" : booking.status,
  });
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
