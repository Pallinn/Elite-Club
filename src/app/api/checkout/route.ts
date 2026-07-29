import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePromptPayQr } from "@/lib/promptpay";
import { computeExpectedAmountSatang } from "@/lib/payment-amount";

const checkoutSchema = z.object({ bookingId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "HOLD" || !booking.holdExpiresAt || booking.holdExpiresAt < new Date()) {
    return NextResponse.json({ error: "This reservation is no longer active." }, { status: 409 });
  }

  // Set once per booking and reused on every re-render of the QR panel, so
  // the amount the customer is asked to pay never shifts mid-checkout.
  const expectedAmountSatang =
    booking.expectedAmountSatang ?? computeExpectedAmountSatang(booking.id, booking.totalSatang);
  if (booking.expectedAmountSatang === null) {
    await prisma.booking.update({ where: { id: booking.id }, data: { expectedAmountSatang } });
  }

  let qr: { payload: string; qrDataUrl: string };
  try {
    qr = await generatePromptPayQr(expectedAmountSatang);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not generate a PromptPay QR." },
      { status: 500 }
    );
  }

  // Reuse the existing pending attempt (if any) rather than minting a new
  // Payment row every time the customer re-opens the payment panel.
  const existingPending = await prisma.payment.findFirst({
    where: { bookingId: booking.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  const payment = existingPending
    ? await prisma.payment.update({
        where: { id: existingPending.id },
        data: { amountSatang: expectedAmountSatang, promptpayPayload: qr.payload },
      })
    : await prisma.payment.create({
        data: {
          bookingId: booking.id,
          method: "PROMPTPAY",
          amountSatang: expectedAmountSatang,
          promptpayPayload: qr.payload,
          status: "PENDING",
        },
      });

  return NextResponse.json({
    paymentId: payment.id,
    qrDataUrl: qr.qrDataUrl,
    expectedAmountSatang,
  });
}
