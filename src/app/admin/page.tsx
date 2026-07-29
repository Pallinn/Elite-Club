import { prisma } from "@/lib/prisma";
import { getEventAvailability } from "@/lib/availability";
import { formatSatang } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tierOf, TIER_ACCENT_CLASS, TIER_BAR_CLASS, type Tier } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const event = await prisma.event.findFirst();
  if (!event) {
    return <p className="text-neutral-400">No event configured yet.</p>;
  }

  const [revenueAgg, attendanceTickets, zones] = await Promise.all([
    prisma.booking.aggregate({
      where: { eventId: event.id, status: "PAID" },
      _sum: { totalSatang: true },
    }),
    // Every ticket on a PAID booking (buyer, joined-via-code, or comp-added)
    // that hasn't been voided — used for the checked-in/total attendance
    // breakdown below. Covers GA tickets too, not just table seats.
    prisma.ticket.findMany({
      where: {
        status: { not: "VOID" },
        bookingItem: { booking: { eventId: event.id, status: "PAID" } },
      },
      select: { status: true, bookingItem: { select: { zone: { select: { name: true } } } } },
    }),
    getEventAvailability(event.id),
  ]);

  const revenue = revenueAgg._sum.totalSatang ?? 0;

  const attendanceByTier: Record<Tier, { checkedIn: number; total: number }> = {
    VVIP: { checkedIn: 0, total: 0 },
    VIP: { checkedIn: 0, total: 0 },
    Normal: { checkedIn: 0, total: 0 },
  };
  for (const t of attendanceTickets) {
    const tier = tierOf(t.bookingItem.zone.name);
    attendanceByTier[tier].total += 1;
    if (t.status === "USED") attendanceByTier[tier].checkedIn += 1;
  }
  const attendanceOverall = {
    checkedIn: attendanceByTier.VVIP.checkedIn + attendanceByTier.VIP.checkedIn + attendanceByTier.Normal.checkedIn,
    total: attendanceByTier.VVIP.total + attendanceByTier.VIP.total + attendanceByTier.Normal.total,
  };

  // Aggregate by tier from zone name.
  const byTier: Record<Tier, { total: number; sold: number }> = {
    VVIP: { total: 0, sold: 0 },
    VIP: { total: 0, sold: 0 },
    Normal: { total: 0, sold: 0 },
  };
  for (const zone of zones) {
    const tier = tierOf(zone.name);
    for (const table of zone.tables) {
      byTier[tier].total += 1;
      if (table.isBooked) byTier[tier].sold += 1;
    }
  }
  const overall = {
    total: byTier.VVIP.total + byTier.VIP.total + byTier.Normal.total,
    sold: byTier.VVIP.sold + byTier.VIP.sold + byTier.Normal.sold,
  };

  const cards: { title: string; sold: number; total: number; accent: string; bar: string }[] = [
    { title: "VVIP", sold: byTier.VVIP.sold, total: byTier.VVIP.total, accent: TIER_ACCENT_CLASS.VVIP, bar: TIER_BAR_CLASS.VVIP },
    { title: "VIP", sold: byTier.VIP.sold, total: byTier.VIP.total, accent: TIER_ACCENT_CLASS.VIP, bar: TIER_BAR_CLASS.VIP },
    { title: "Normal", sold: byTier.Normal.sold, total: byTier.Normal.total, accent: TIER_ACCENT_CLASS.Normal, bar: TIER_BAR_CLASS.Normal },
    { title: "Overall", sold: overall.sold, total: overall.total, accent: "text-white", bar: "bg-white" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">// Overview</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-white">
          {event.name}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">{event.venueName} — Admin Dashboard</p>
      </div>

      {/* Revenue + counts row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-neutral-950">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl font-bold text-orange-500">
            {formatSatang(revenue)}
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-neutral-950">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500">
              Tables bought
            </CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl font-bold text-white">
            {overall.sold}
            <span className="ml-1 text-base font-normal text-neutral-500">/ {overall.total}</span>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-neutral-950">
          <CardHeader>
            <CardTitle className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500">
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl font-bold text-white">
            {attendanceOverall.checkedIn}
            <span className="ml-1 text-base font-normal text-neutral-500">/ {attendanceOverall.total}</span>
            <span className="ml-2 text-sm font-normal text-neutral-500">checked in</span>
          </CardContent>
        </Card>
      </div>

      {/* Tier breakdown */}
      <div>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-neutral-500">
          Tables by tier
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.title} className="border-white/10 bg-neutral-950">
              <CardHeader>
                <CardTitle className={`font-heading text-xl font-bold ${c.accent}`}>
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Sold
                  </span>
                  <span className="text-lg text-white">
                    {c.sold}
                    <span className="ml-0.5 text-sm font-normal text-neutral-500">/ {c.total}</span>
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-t border-white/10 pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Available
                  </span>
                  <span className="text-lg text-neutral-400">{c.total - c.sold}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded bg-white/10">
                  <div
                    className={`h-1 ${c.bar}`}
                    style={{ width: c.total > 0 ? `${(c.sold / c.total) * 100}%` : "0%" }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Attendance breakdown */}
      <div>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-neutral-500">
          Attendance by tier (checked in / total)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { title: "VVIP" as const, ...attendanceByTier.VVIP, accent: TIER_ACCENT_CLASS.VVIP, bar: TIER_BAR_CLASS.VVIP },
              { title: "VIP" as const, ...attendanceByTier.VIP, accent: TIER_ACCENT_CLASS.VIP, bar: TIER_BAR_CLASS.VIP },
              { title: "Normal" as const, ...attendanceByTier.Normal, accent: TIER_ACCENT_CLASS.Normal, bar: TIER_BAR_CLASS.Normal },
              { title: "Overall" as const, ...attendanceOverall, accent: "text-white", bar: "bg-white" },
            ]
          ).map((c) => (
            <Card key={c.title} className="border-white/10 bg-neutral-950">
              <CardHeader>
                <CardTitle className={`font-heading text-xl font-bold ${c.accent}`}>
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Checked in
                  </span>
                  <span className="text-lg text-white">
                    {c.checkedIn}
                    <span className="ml-0.5 text-sm font-normal text-neutral-500">/ {c.total}</span>
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-t border-white/10 pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Total tickets
                  </span>
                  <span className="text-lg text-neutral-400">{c.total}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded bg-white/10">
                  <div
                    className={`h-1 ${c.bar}`}
                    style={{ width: c.total > 0 ? `${(c.checkedIn / c.total) * 100}%` : "0%" }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
