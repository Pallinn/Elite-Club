import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { tierOf } from "@/lib/tiers";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ error: "Enter a name, table number, or table code." }, { status: 400 });
  }
  const codeCandidate = q.toUpperCase().replace(/\s+/g, "");

  const items = await prisma.bookingItem.findMany({
    where: {
      tableId: { not: null },
      booking: { status: "PAID" },
      OR: [
        { booking: { contactName: { contains: q, mode: "insensitive" } } },
        { table: { label: { contains: q, mode: "insensitive" } } },
        { joinCode: codeCandidate },
        { tickets: { some: { holder: { name: { contains: q, mode: "insensitive" } } } } },
        { tickets: { some: { holder: { email: { contains: q, mode: "insensitive" } } } } },
      ],
    },
    include: {
      table: true,
      zone: true,
      booking: true,
      tickets: { include: { holder: true }, orderBy: { createdAt: "asc" } },
    },
    take: 20,
  });

  const results = items
    .filter((item) => item.table)
    .map((item) => ({
      joinCode: item.joinCode,
      tableLabel: item.table!.label,
      tier: tierOf(item.zone.name),
      capacity: item.table!.capacity,
      contactName: item.booking.contactName,
      tickets: item.tickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        status: t.status,
        isBuyer: t.holderUserId === item.booking.userId,
        holder: t.holder ? { name: t.holder.name, email: t.holder.email } : null,
        usedAt: t.usedAt ? t.usedAt.toISOString() : null,
      })),
    }));

  if (results.length === 0) {
    return NextResponse.json({ error: "No tables match that search." }, { status: 404 });
  }

  return NextResponse.json({ results });
}
