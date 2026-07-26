import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireStaleHolds } from "@/lib/expire-holds";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expired = await expireStaleHolds(prisma);

  return NextResponse.json({ expired });
}
