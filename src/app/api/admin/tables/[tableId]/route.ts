import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const updateTableSchema = z.object({
  label: z.string().trim().min(1).max(100),
  capacity: z.number().int().min(1),
  priceSatang: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ tableId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tableId } = await ctx.params;

  const body = await request.json();
  const parsed = updateTableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const table = await prisma.table.update({
    where: { id: tableId },
    data: {
      label: parsed.data.label,
      capacity: parsed.data.capacity,
      priceSatang: parsed.data.priceSatang ?? null,
    },
  });

  return NextResponse.json({ ok: true, table });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ tableId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tableId } = await ctx.params;

  // Soft delete only - tables are referenced by existing BookingItems.
  await prisma.table.update({ where: { id: tableId }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
