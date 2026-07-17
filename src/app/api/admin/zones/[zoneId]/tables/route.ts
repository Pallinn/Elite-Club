import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const createTableSchema = z.object({
  label: z.string().trim().min(1).max(100),
  capacity: z.number().int().min(1),
  priceSatang: z.number().int().min(0).optional(),
});

export async function POST(
  request: Request,
  ctx: { params: Promise<{ zoneId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { zoneId } = await ctx.params;

  const body = await request.json();
  const parsed = createTableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const table = await prisma.table.create({
    data: {
      zoneId,
      label: parsed.data.label,
      capacity: parsed.data.capacity,
      priceSatang: parsed.data.priceSatang ?? null,
    },
  });

  return NextResponse.json({ ok: true, table });
}
