import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSatang } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import type { Prisma, BookingStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;

  const where: Prisma.BookingWhereInput = {
    ...(status ? { status: status as BookingStatus } : {}),
    ...(q
      ? {
          OR: [
            { contactName: { contains: q, mode: "insensitive" } },
            { contactEmail: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: { include: { zone: true, table: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Bookings</h1>
        <a
          href="/api/admin/export"
          className="text-sm text-neutral-300 underline underline-offset-4 hover:text-white"
        >
          Export CSV
        </a>
      </div>

      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search name or email"
          className="h-9 rounded-md border border-white/10 bg-neutral-900 px-3 text-sm text-white"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 rounded-md border border-white/10 bg-neutral-900 px-2 text-sm text-white"
        >
          <option value="">All statuses</option>
          <option value="HOLD">Hold</option>
          <option value="PAID">Paid</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="FAILED">Failed</option>
        </select>
        <button
          type="submit"
          className="h-9 rounded-md border border-white/10 px-3 text-sm text-white hover:bg-white/5"
        >
          Filter
        </button>
      </form>

      <div className="space-y-2">
        {bookings.map((booking) => (
          <Link
            key={booking.id}
            href={`/admin/bookings/${booking.id}`}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-neutral-950 p-3 text-sm hover:border-white/30"
          >
            <div>
              <p className="text-white">{booking.contactName}</p>
              <p className="text-neutral-500">{booking.contactEmail}</p>
              <p className="text-neutral-500">
                {booking.items.map((i) => i.table?.label ?? `${i.zone.name} x${i.quantity}`).join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white">{formatSatang(booking.totalSatang)}</span>
              <Badge variant={booking.status === "PAID" ? "default" : "secondary"}>
                {booking.status}
              </Badge>
            </div>
          </Link>
        ))}
        {bookings.length === 0 && <p className="text-neutral-500">No bookings found.</p>}
      </div>
    </div>
  );
}
