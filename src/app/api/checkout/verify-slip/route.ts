import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { finalizeBookingPayment } from "@/lib/tickets";
import { verifySlipByImage, verifySlipByQrPayload, type Slip2GoResult } from "@/lib/slip2go";
import { expireStaleHolds } from "@/lib/expire-holds";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

const qrPayloadSchema = z.object({ bookingId: z.string().min(1), qrPayload: z.string().min(1) });

class SlipReusedError extends Error {}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  let bookingId: string;
  let slipImageUrl: string | null = null;
  let slipResult: Slip2GoResult;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const bookingIdRaw = formData.get("bookingId");
    const file = formData.get("file");
    if (typeof bookingIdRaw !== "string" || !bookingIdRaw) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No slip image provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Slip must be a JPEG, PNG, or WebP image" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Slip image must be under 5MB" }, { status: 400 });
    }

    bookingId = bookingIdRaw;
    const guard = await guardBookingForVerification(bookingId, session.user.id);
    if (guard.error) return guard.error;

    try {
      slipResult = await verifySlipByImage(file, file.name || "slip.jpg");
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Could not reach the slip verification service." },
        { status: 500 }
      );
    }

    // Best-effort audit copy - verification result doesn't depend on this.
    try {
      const { put } = await import("@vercel/blob");
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const blob = await put(`slips/${bookingId}-${Date.now()}.${ext}`, file, {
        access: "private",
        addRandomSuffix: true,
      });
      slipImageUrl = blob.url;
    } catch (err) {
      console.error("Slip image upload to blob storage failed:", err);
    }
  } else {
    const body = await request.json();
    const parsed = qrPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    bookingId = parsed.data.bookingId;
    const guard = await guardBookingForVerification(bookingId, session.user.id);
    if (guard.error) return guard.error;

    try {
      slipResult = await verifySlipByQrPayload(parsed.data.qrPayload);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Could not reach the slip verification service." },
        { status: 500 }
      );
    }
  }

  const payment = await prisma.payment.findFirst({
    where: { bookingId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (!payment) {
    return NextResponse.json(
      { error: "No pending payment to verify. Generate a QR first." },
      { status: 409 }
    );
  }

  if (!slipResult.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        slipImageUrl,
        failureCode: slipResult.code,
        failureMessage: slipResult.message,
      },
    });
    return NextResponse.json({ error: slipResult.message }, { status: 422 });
  }

  const { data } = slipResult;
  const paidAmountSatang = Math.round(data.amount * 100);

  if (paidAmountSatang !== payment.amountSatang) {
    const message = `Transferred amount (${data.amount.toFixed(2)} THB) doesn't match the expected ${(
      payment.amountSatang / 100
    ).toFixed(2)} THB for this booking.`;
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        slipImageUrl,
        rawResponse: data as unknown as object,
        failureCode: "AMOUNT_MISMATCH",
        failureMessage: message,
      },
    });
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "FAILED" } });
    return NextResponse.json({ error: message }, { status: 422 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const reused = await tx.payment.findFirst({
        where: { slipTransRef: data.transRef, status: "SUCCEEDED" },
      });
      if (reused) throw new SlipReusedError();

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          slipImageUrl,
          slipTransRef: data.transRef,
          rawResponse: data as unknown as object,
          paidAt: new Date(),
        },
      });
    });
  } catch (err) {
    if (err instanceof SlipReusedError || isUniqueConstraintError(err)) {
      const message = "This slip has already been used for another booking.";
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          slipImageUrl,
          failureCode: "SLIP_ALREADY_USED",
          failureMessage: message,
        },
      });
      await prisma.booking.update({ where: { id: bookingId }, data: { status: "FAILED" } });
      return NextResponse.json({ error: message }, { status: 409 });
    }
    throw err;
  }

  await finalizeBookingPayment(bookingId);

  return NextResponse.json({ ok: true });
}

async function guardBookingForVerification(
  bookingId: string,
  userId: string
): Promise<{ error: NextResponse | null }> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.userId !== userId) {
    return { error: NextResponse.json({ error: "Booking not found" }, { status: 404 }) };
  }
  if (booking.status === "HOLD" && booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
    await expireStaleHolds(prisma, { id: booking.id });
    return { error: NextResponse.json({ error: "This reservation has expired." }, { status: 410 }) };
  }
  if (booking.status !== "HOLD") {
    return { error: NextResponse.json({ error: "This booking is not awaiting payment." }, { status: 409 }) };
  }
  return { error: null };
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}
