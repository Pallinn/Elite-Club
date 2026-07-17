import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const createZoneSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(["GENERAL_ADMISSION", "VIP_TABLE"]),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  priceSatang: z.number().int().min(0),
  totalCapacity: z.number().int().min(0),
});

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createZoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findFirst();
  if (!event) return NextResponse.json({ error: "No event found" }, { status: 404 });

  const zone = await prisma.zone.create({
    data: {
      eventId: event.id,
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description || null,
      priceSatang: parsed.data.priceSatang,
      totalCapacity: parsed.data.totalCapacity,
    },
  });

  return NextResponse.json({ ok: true, zone });
}
