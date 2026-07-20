import { prisma } from "@/lib/prisma";
import { getEventAvailability } from "@/lib/availability";
import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/marketing/hero-section";
import { EventsSection } from "@/components/marketing/events-section";
import { LineupSection } from "@/components/marketing/lineup-section";
import { PosterSection } from "@/components/marketing/poster-section";
import { FooterSection } from "@/components/marketing/footer-section";
import { StickyBuyBar } from "@/components/marketing/sticky-buy-bar";
import { ScrollSnap } from "@/components/marketing/scroll-snap";

export const dynamic = "force-dynamic";

const TIER_ORDER = ["VVIP", "VIP"];
const TIER_TABLES_LABEL: Record<string, string> = {
  VVIP: "V1 Lounge, V2 Booth (Floor 1), Floor 2 Lounge",
  VIP: "Tables 1–16 (Floor 1) + 17–21 (Floor 2)",
};

function tierNameFromZone(zoneName: string) {
  const dashIndex = zoneName.indexOf("—");
  return dashIndex === -1 ? zoneName.trim() : zoneName.slice(dashIndex + 1).trim();
}

export default async function Home() {
  const event = await prisma.event.findFirst({ where: { status: "PUBLISHED" } });
  const zones = event ? await getEventAvailability(event.id) : [];

  const tierMap = new Map<
    string,
    { capacities: number[]; prices: number[]; booked: number; total: number; drinks: string }
  >();
  for (const zone of zones) {
    const tierName = tierNameFromZone(zone.name);
    const entry = tierMap.get(tierName) ?? {
      capacities: [] as number[],
      prices: [] as number[],
      booked: 0,
      total: 0,
      drinks: zone.description ?? "",
    };
    for (const table of zone.tables) {
      entry.capacities.push(table.capacity);
      entry.prices.push(table.priceSatang ?? zone.priceSatang);
      entry.total += 1;
      if (table.isBooked) entry.booked += 1;
    }
    tierMap.set(tierName, entry);
  }

  const tiers = TIER_ORDER.filter((name) => tierMap.has(name)).map((name) => {
    const entry = tierMap.get(name)!;
    return {
      id: name,
      name,
      tablesLabel: TIER_TABLES_LABEL[name] ?? "",
      capacity: entry.capacities.length ? Math.max(...entry.capacities) : 0,
      fromSatang: entry.prices.length ? Math.min(...entry.prices) : 0,
      drinks: entry.drinks,
      soldOut: entry.total > 0 && entry.booked === entry.total,
    };
  });

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-black">
      <ScrollSnap />
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 -z-20 h-full w-full object-cover"
        src="/video/background.mp4"
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />

      <SiteHeader />

      <main className="flex-1">
        <HeroSection eventName={event?.name ?? "Coming Soon"} />

        <PosterSection />

        <LineupSection />

        {event && tiers.length > 0 && <EventsSection tiers={tiers} />}
      </main>

      <div className="pb-24">
        <FooterSection />
      </div>

      <StickyBuyBar />
    </div>
  );
}
