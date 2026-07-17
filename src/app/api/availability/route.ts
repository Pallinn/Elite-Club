import { NextRequest, NextResponse } from "next/server";
import { getEventAvailability } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const availability = await getEventAvailability(eventId);
  return NextResponse.json({ zones: availability });
}
