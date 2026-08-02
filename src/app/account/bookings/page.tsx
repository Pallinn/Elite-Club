import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatSatang } from "@/lib/money";
import { expireStaleHolds } from "@/lib/expire-holds";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Availability reads already treat a lapsed hold as inactive (see
  // activeBookingItemFilter), but the row itself only flips to EXPIRED when
  // something actually touches it - without this, a user's own stale hold
  // would keep showing as "HOLD" here until they happened to click into it.
  const expiredIds = await expireStaleHolds(prisma, { userId: session.user.id });
  for (const id of expiredIds) {
    await recordAudit({ action: "booking.expired", entityType: "Booking", entityId: id, actorLabel: "system" });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id, status: "PAID" },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { zone: true, table: true } }, event: true },
  });

  // Tables joined via someone else's table code: a Ticket held by this user,
  // but on a Booking that belongs to whoever bought the table - so it never
  // shows up in the query above, even though the user does have a seat.
  const joinedTickets = await prisma.ticket.findMany({
    where: {
      holderUserId: session.user.id,
      bookingItem: { booking: { userId: { not: session.user.id } } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      bookingItem: {
        include: { zone: true, table: true, booking: { include: { event: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">My bookings</h1>

      {bookings.length === 0 && joinedTickets.length === 0 ? (
        <p className="text-sm text-neutral-400">
          You haven&apos;t booked any tickets yet.{" "}
          <Link href="/book" className="text-white underline underline-offset-4">
            Browse tickets
          </Link>
        </p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/account/bookings/${booking.id}`}
              className="block rounded-lg border border-white/10 bg-neutral-950 p-4 hover:border-white/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{booking.event.name}</p>
                  <p className="text-xs text-neutral-400">
                    {booking.items
                      .map((i) => i.table?.label ?? `${i.zone.name} x${i.quantity}`)
                      .join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white">
                    {formatSatang(booking.totalSatang)}
                  </span>
                  <Badge>{booking.status}</Badge>
                </div>
              </div>
            </Link>
          ))}

          {joinedTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-lg border border-white/10 bg-neutral-950 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-white">{ticket.bookingItem.booking.event.name}</p>
                <Badge variant="secondary">Joined</Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">Table No.</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {ticket.bookingItem.table?.label ?? ticket.bookingItem.zone.name}
                  </p>
                </div>
                {ticket.bookingItem.joinCode && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">Join Code</p>
                    <p className="mt-1 text-lg font-semibold tracking-[0.1em] text-white">
                      {ticket.bookingItem.joinCode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
