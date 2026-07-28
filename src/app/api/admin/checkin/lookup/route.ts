import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { tierOf } from "@/lib/tiers";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get("code") ?? "";
  const code = rawCode.toUpperCase().replace(/\s+/g, "");
  if (!code) {
    return NextResponse.json({ error: "Enter a table code." }, { status: 400 });
  }

  const item = await prisma.bookingItem.findUnique({
    where: { joinCode: code },
    include: {
      table: true,
      zone: true,
      booking: true,
      tickets: { include: { holder: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!item || !item.table) {
    return NextResponse.json({ error: "No table matches that code." }, { status: 404 });
  }
  if (item.booking.status !== "PAID") {
    return NextResponse.json({ error: "This table's booking isn't paid yet." }, { status: 409 });
  }

  return NextResponse.json({
    tableLabel: item.table.label,
    tier: tierOf(item.zone.name),
    capacity: item.table.capacity,
    contactName: item.booking.contactName,
    tickets: item.tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      status: t.status,
      isBuyer: t.holderUserId === item.booking.userId,
      holder: t.holder ? { name: t.holder.name, email: t.holder.email } : null,
      usedAt: t.usedAt ? t.usedAt.toISOString() : null,
    })),
  });
}
