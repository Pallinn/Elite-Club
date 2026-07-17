import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatSatang } from "@/lib/money";

export default async function MyBookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { zone: true, table: true } }, event: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">My bookings</h1>

      {bookings.length === 0 ? (
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
              href={
                booking.status === "HOLD"
                  ? `/checkout/${booking.id}`
                  : `/account/bookings/${booking.id}`
              }
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
                  <Badge
                    variant={booking.status === "PAID" ? "default" : "secondary"}
                  >
                    {booking.status}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
