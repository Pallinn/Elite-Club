import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { omise } from "@/lib/omise";
import { finalizeBookingPayment } from "@/lib/tickets";

/**
 * Omise webhooks aren't signed, so we never trust the payload's own status
 * fields. We only use it to learn *which* charge changed, then re-fetch that
 * charge from Omise's API (using our secret key) as the sole source of truth
 * before mutating anything - this defeats forged or replayed payloads.
 */
export async function POST(request: Request) {
  let event: { key?: string; data?: { id?: string; object?: string } };
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const chargeId = event.data?.object === "charge" ? event.data.id : undefined;
  if (!chargeId) {
    // Not a charge event we care about - acknowledge and move on.
    return NextResponse.json({ ok: true });
  }

  const charge = await omise.charges.retrieve(chargeId);

  const payment = await prisma.payment.findFirst({ where: { omiseChargeId: charge.id } });
  if (!payment) {
    return NextResponse.json({ ok: true });
  }

  const status = charge.status === "successful"
    ? "SUCCEEDED"
    : charge.status === "failed"
      ? "FAILED"
      : charge.status === "expired"
        ? "EXPIRED"
        : "PENDING";

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
      rawResponse: charge as unknown as object,
      failureCode: charge.failure_code ?? null,
      failureMessage: charge.failure_message ?? null,
      paidAt: charge.paid ? new Date(charge.paid_at) : null,
    },
  });

  if (status === "SUCCEEDED") {
    await finalizeBookingPayment(payment.bookingId);
  }

  return NextResponse.json({ ok: true });
}
