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

  const [revenueAgg, attendance, zones] = await Promise.all([
    prisma.booking.aggregate({
      where: { eventId: event.id, status: "PAID" },
      _sum: { totalSatang: true },
    }),
    // "Attendance" = every person who has claimed a seat on a table — the
    // buyer plus everyone who joined via table code or was comp-added.
    // Not the same as physically checked in at the door (see Check-in page).
    prisma.ticket.count({
      where: {
        status: { not: "VOID" },
        bookingItem: {
          tableId: { not: null },
          booking: { eventId: event.id, status: "PAID" },
        },
      },
    }),
    getEventAvailability(event.id),
  ]);

  const revenue = revenueAgg._sum.totalSatang ?? 0;

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
            {attendance}
            <span className="ml-2 text-sm font-normal text-neutral-500">people joined tables</span>
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
                  <span className="text-lg text-white">{c.sold}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Available
                  </span>
                  <span className="text-lg text-white">{c.total - c.sold}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-white/10 pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Capacity
                  </span>
                  <span className="text-lg text-neutral-400">{c.total}</span>
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
    </div>
  );
}
