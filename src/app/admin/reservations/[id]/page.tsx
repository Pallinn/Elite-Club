import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ReservationDetail,
  type ReservationDetailData,
} from "@/components/admin/reservation-detail";
import { tierOf } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export default async function AdminReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.bookingItem.findUnique({
    where: { id },
    include: {
      table: true,
      zone: true,
      tickets: { include: { holder: true }, orderBy: { createdAt: "asc" } },
      booking: {
        include: {
          user: true,
          payments: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!item || !item.table) notFound();

  const data: ReservationDetailData = {
    bookingItemId: item.id,
    bookingId: item.bookingId,
    tier: tierOf(item.zone.name),
    tableLabel: item.table.label,
    capacity: item.table.capacity,
    totalSatang: item.subtotalSatang,
    joinCode: item.joinCode,
    paidStatus: item.booking.status,
    buyer: {
      name: item.booking.contactName || item.booking.user.name || "—",
      email: item.booking.contactEmail,
    },
    tickets: item.tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      status: t.status,
      isBuyer: t.holderUserId === item.booking.userId,
      holder: t.holder
        ? { name: t.holder.name, email: t.holder.email }
        : null,
    })),
    payments: item.booking.payments.map((p) => ({
      id: p.id,
      status: p.status,
      method: p.method,
      amountSatang: p.amountSatang,
      createdAt: p.createdAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/reservations"
          className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500 hover:text-white"
        >
          ← All reservations
        </Link>
        <h1 className="mt-2 font-heading text-3xl font-bold text-white">Reservation</h1>
      </div>
      <ReservationDetail data={data} />
    </div>
  );
}
