import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingPurchaseEmail } from "@/lib/tickets";

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
  if (booking.status !== "PAID") {
    return NextResponse.json({ error: "This booking has no tickets to resend." }, { status: 400 });
  }

  try {
    await sendBookingPurchaseEmail(id);
  } catch (err) {
    console.error(`Failed to resend tickets email for booking ${id}:`, err);
    return NextResponse.json(
      { error: "Couldn't send the email right now. Check the email provider is configured." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
