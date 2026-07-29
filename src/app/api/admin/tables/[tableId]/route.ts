import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit";
import { activeBookingItemFilter } from "@/lib/availability";

const schema = z.object({
  label: z.string().trim().min(1).max(100).optional(),
  priceSatang: z.number().int().nonnegative().optional(),
  capacity: z.number().int().positive().max(50).optional(),
  isLocked: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await ctx.params;
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const admin = guard.session.user;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const before = await prisma.table.findUnique({ where: { id: tableId  } });
  if (!before) return NextResponse.json({ error: "Table not found" }, { status: 404 });

  if (parsed.data.priceSatang !== undefined || parsed.data.capacity !== undefined) {
    const activeItem = await prisma.bookingItem.findFirst({
      where: { ...activeBookingItemFilter(), tableId },
    });
    if (activeItem) {
      return NextResponse.json(
        { error: "Price and capacity can only be changed while the table is not reserved." },
        { status: 409 }
      );
    }
  }

  if (parsed.data.isLocked === false) {
    const paidItem = await prisma.bookingItem.findFirst({
      where: { isActive: true, tableId, booking: { status: "PAID" } },
    });
    if (paidItem) {
      return NextResponse.json(
        { error: "This table has a paid reservation — refund it before unlocking." },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.table.update({
    where: { id: tableId  },
    data: parsed.data,
  });

  const changes: Record<string, { from: unknown; to: unknown }> = {};

  if (
    parsed.data.label !== undefined &&
    parsed.data.label !== before.label
  ) {
    changes.label = {
      from: before.label,
      to: parsed.data.label,
    };
  }

  if (parsed.data.priceSatang !== undefined && parsed.data.priceSatang !== before.priceSatang) {
    changes.priceSatang = { from: before.priceSatang, to: parsed.data.priceSatang };
  }
  if (parsed.data.capacity !== undefined && parsed.data.capacity !== before.capacity) {
    changes.capacity = { from: before.capacity, to: parsed.data.capacity };
  }
  if (parsed.data.isLocked !== undefined && parsed.data.isLocked !== before.isLocked) {
    changes.isLocked = { from: before.isLocked, to: parsed.data.isLocked };
  }
  if (Object.keys(changes).length > 0) {
    await recordAudit({
      actorUserId: admin.id,
      actorLabel: admin.name ?? admin.email ?? null,
      action: parsed.data.isLocked !== undefined && Object.keys(changes).length === 1
        ? (parsed.data.isLocked ? "table.lock" : "table.unlock")
        : "table.edit",
      entityType: "Table",
      entityId: tableId,
      metadata: { label: before.label, changes: JSON.parse(JSON.stringify(changes)) },
    });
  }

  return NextResponse.json({ ok: true, table: updated });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await ctx.params;

  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  await prisma.table.update({
    where: {
      id: tableId,
    },
    data: {
      isActive: false,
    },
  });

  await recordAudit({
    actorUserId: guard.session.user.id,
    actorLabel: guard.session.user.name ?? guard.session.user.email ?? null,
    action: "table.delete",
    entityType: "Table",
    entityId: tableId,
  });

  return NextResponse.json({ ok: true });
}


