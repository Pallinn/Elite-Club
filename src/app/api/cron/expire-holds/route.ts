import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireStaleHolds } from "@/lib/expire-holds";
import { recordAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expiredIds = await expireStaleHolds(prisma);

  for (const id of expiredIds) {
    await recordAudit({
      action: "booking.expired",
      entityType: "Booking",
      entityId: id,
      actorLabel: "system",
      metadata: { source: "cron" },
    });
  }

  return NextResponse.json({ expired: expiredIds.length });
}
