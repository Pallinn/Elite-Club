import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const updateZoneSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  priceSatang: z.number().int().min(0),
  totalCapacity: z.number().int().min(0),
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ zoneId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { zoneId } = await ctx.params;

  const body = await request.json();
  const parsed = updateZoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const zone = await prisma.zone.update({
    where: { id: zoneId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      priceSatang: parsed.data.priceSatang,
      totalCapacity: parsed.data.totalCapacity,
    },
  });

  return NextResponse.json({ ok: true, zone });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ zoneId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { zoneId } = await ctx.params;

  // Soft delete only - zones are referenced by existing BookingItems.
  await prisma.zone.update({ where: { id: zoneId }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
