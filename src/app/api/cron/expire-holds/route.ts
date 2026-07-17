import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const stale = await prisma.booking.findMany({
    where: { status: "HOLD", holdExpiresAt: { lt: now } },
    select: { id: true },
  });

  if (stale.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  const staleIds = stale.map((b) => b.id);

  await prisma.$transaction([
    prisma.booking.updateMany({
      where: { id: { in: staleIds } },
      data: { status: "EXPIRED" },
    }),
    prisma.bookingItem.updateMany({
      where: { bookingId: { in: staleIds } },
      data: { isActive: false },
    }),
  ]);

  return NextResponse.json({ expired: staleIds.length });
}
