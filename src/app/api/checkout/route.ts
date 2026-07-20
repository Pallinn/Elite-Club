import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { omise } from "@/lib/omise";
import { finalizeBookingPayment } from "@/lib/tickets";

const checkoutSchema = z.discriminatedUnion("method", [
  z.object({ bookingId: z.string().min(1), method: z.literal("PROMPTPAY") }),
  z.object({ bookingId: z.string().min(1), method: z.literal("CARD"), cardToken: z.string().min(1) }),
]);

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

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      method: parsed.data.method,
      amountSatang: booking.totalSatang,
      status: "PENDING",
    },
  });

  try {
    if (parsed.data.method === "PROMPTPAY") {
      const source = await omise.sources.create({
        type: "promptpay",
        amount: booking.totalSatang,
        currency: "thb",
      });

      const charge = await omise.charges.create({
        amount: booking.totalSatang,
        currency: "thb",
        source: source.id,
        description: `No Signal booking ${booking.id}`,
      });

      const status = mapChargeStatus(charge.status);
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          omiseSourceId: source.id,
          omiseChargeId: charge.id,
          status,
          rawResponse: charge as unknown as object,
        },
      });
      // Rare for PromptPay (it's normally an async bank-app confirmation),
      // but handle it the same way as card for consistency. The webhook is
      // the authoritative path for the usual case; this just avoids relying
      // on it alone (which needs a public URL, e.g. via ngrok in local dev).
      if (status === "SUCCEEDED") {
        await finalizeBookingPayment(booking.id);
      }

      // The PromptPay QR URI is populated on the CHARGE's echoed source
      // (charge.source.scannable_code.image.download_uri), not on the source
      // returned by sources.create — that one is null until a charge exists.
      const chargeSource = (charge as unknown as { source?: { scannable_code?: { image?: { download_uri?: string } } } }).source;
      return NextResponse.json({
        paymentId: payment.id,
        qrImageUrl: chargeSource?.scannable_code?.image?.download_uri ?? null,
        chargeId: charge.id,
      });
    }

    const charge = await omise.charges.create({
      amount: booking.totalSatang,
      currency: "thb",
      card: parsed.data.cardToken,
      return_uri: `${process.env.APP_URL}/checkout/${booking.id}`,
      description: `No Signal booking ${booking.id}`,
    });

    const status = mapChargeStatus(charge.status);
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        omiseChargeId: charge.id,
        status,
        rawResponse: charge as unknown as object,
        failureCode: charge.failure_code ?? null,
        failureMessage: charge.failure_message ?? null,
      },
    });
    // Non-3DS test cards resolve to "successful" immediately, before any
    // webhook fires - finalize right away rather than depending solely on a
    // webhook endpoint being reachable (it needs a public URL to work locally).
    if (status === "SUCCEEDED") {
      await finalizeBookingPayment(booking.id);
    }

    return NextResponse.json({
      paymentId: payment.id,
      chargeId: charge.id,
      authorizeUri: charge.authorize_uri ?? null,
    });
  } catch (err) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureMessage: err instanceof Error ? err.message : "Unknown error" },
    });
    return NextResponse.json({ error: "Payment could not be started." }, { status: 502 });
  }
}

function mapChargeStatus(status: string): "PENDING" | "SUCCEEDED" | "FAILED" | "EXPIRED" {
  if (status === "successful") return "SUCCEEDED";
  if (status === "failed") return "FAILED";
  if (status === "expired") return "EXPIRED";
  return "PENDING";
}
