import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { finalizeBookingPayment } from "@/lib/tickets";

// Demo escape hatch: skip PromptPay/Slip2Go entirely and mark a booking
// paid, so the rest of the flow (tickets, join codes, emails) can be shown
// without a real bank transfer.
const schema = z.object({ bookingId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "HOLD") {
    return NextResponse.json({ error: "This booking isn't awaiting payment." }, { status: 409 });
  }

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: "MANUAL",
      method: "PROMPTPAY",
      status: "SUCCEEDED",
      amountSatang: booking.totalSatang,
      paidAt: new Date(),
    },
  });

  await finalizeBookingPayment(booking.id);

  return NextResponse.json({ ok: true });
}
