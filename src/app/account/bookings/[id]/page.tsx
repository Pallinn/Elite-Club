import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSatang } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResendTicketsButton } from "@/components/account/resend-tickets-button";
import { CopyCodeButton } from "@/components/account/copy-code-button";
import { RemoveGuestButton } from "@/components/account/remove-guest-button";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      event: true,
      items: { include: { zone: true, table: true, tickets: { include: { holder: true } } } },
    },
  });

  const contactPhoneDisplay = booking?.contactPhone?.trim() || "Not provided";

  if (!booking || booking.userId !== session.user.id) {
    redirect("/account/bookings");
  }

  const tableJoinCodes = booking.items.filter((item) => item.table && item.joinCode);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{booking.event.name}</h1>
        </div>
        <Badge variant={booking.status === "PAID" ? "default" : "secondary"}>{booking.status}</Badge>
      </div>

      <Card className="border-white/10 bg-neutral-950">
        <CardContent className="flex justify-between text-sm text-neutral-300">
          <span>Total paid</span>
          <span className="text-white">{formatSatang(booking.totalSatang)}</span>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-neutral-950">
        <CardHeader>
          <CardTitle className="text-base text-white">Contact details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-neutral-300">
          <div className="flex justify-between">
            <span>Name</span>
            <span className="text-white">{booking.contactName || "Not provided"}</span>
          </div>
          <div className="flex justify-between">
            <span>Email</span>
            <span className="text-white">{booking.contactEmail || "Not provided"}</span>
          </div>
          <div className="flex justify-between">
            <span>Phone</span>
            <span className="text-white">{contactPhoneDisplay}</span>
          </div>
        </CardContent>
      </Card>

      {booking.status === "PAID" && (
        <>
          {tableJoinCodes.length > 0 && (
            <div className="space-y-3">
              {tableJoinCodes.map((item) => {
                const claimed = item.tickets?.length ?? 0;
                const guests = item.tickets.filter((t) => t.holderUserId !== booking.userId);
                return (
                  <Card key={item.id} className="border-primary/30 bg-primary/5">
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-white">
                            {item.table?.label} — share this code so friends can join
                          </p>
                          <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-primary">
                            {item.joinCode}
                          </p>
                          <p className="mt-1 text-xs text-neutral-400">
                            {claimed} of {item.table?.capacity} seats claimed
                          </p>
                        </div>
                        <CopyCodeButton code={item.joinCode ?? ""} />
                      </div>

                      {guests.length > 0 && (
                        <div className="space-y-2 border-t border-white/10 pt-3">
                          <p className="text-xs uppercase tracking-[0.15em] text-neutral-400">
                            Guests at this table
                          </p>
                          {guests.map((ticket) => (
                            <div
                              key={ticket.id}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <div>
                                <p className="text-white">
                                  {ticket.holder?.name ?? ticket.holder?.email ?? "Unknown guest"}
                                </p>
                                {ticket.status === "USED" && (
                                  <p className="text-xs text-neutral-400">Checked in</p>
                                )}
                              </div>
                              <RemoveGuestButton ticketId={ticket.id} />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex justify-end">
            <ResendTicketsButton bookingId={booking.id} />
          </div>
        </>
      )}
    </div>
  );
}
