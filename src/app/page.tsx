import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getEventAvailability } from "@/lib/availability";
import { tableProvisions } from "@/lib/table-provisions";
import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/marketing/hero-section";
import { EventsSection } from "@/components/marketing/events-section";
import { LineupSection } from "@/components/marketing/lineup-section";
import { PosterSection } from "@/components/marketing/poster-section";
import { StickyBuyBar } from "@/components/marketing/sticky-buy-bar";
import { InstagramBadge } from "@/components/marketing/instagram-badge";
import { ScrollSnap } from "@/components/marketing/scroll-snap";

export const dynamic = "force-dynamic";

const TIER_ORDER = ["VVIP", "VIP", "Regular"];

// TODO: drop in the real tier photo for each card once it's ready.
const TIER_IMAGE: Record<string, string | null> = {
  VVIP: null,
  VIP: null,
  Regular: null,
};

const TIER_PERKS: Record<string, string[]> = {
  VVIP: ["Priority entry", "Connect function"],
  VIP: ["VIP zone access"],
  Regular: [],
};

function tierNameFromZone(zoneName: string) {
  const dashIndex = zoneName.indexOf("—");
  return dashIndex === -1 ? zoneName.trim() : zoneName.slice(dashIndex + 1).trim();
}

function parseCapacityRange(range: string): [number, number] {
  const [min, max] = range.split(/[–-]/).map((n) => parseInt(n.trim(), 10));
  return [min, max ?? min];
}

function formatRange(min: number, max: number, unit: string) {
  return min === max ? `${min}x ${unit}` : `${min}–${max}x ${unit}`;
}

export default async function Home() {
  const session = await auth();
  const event = await prisma.event.findFirst({ where: { status: "PUBLISHED" } });
  const zones = event ? await getEventAvailability(event.id) : [];

  const tierMap = new Map<
    string,
    {
      prices: number[];
      blackLabel: number[];
      mixers: number[];
      capacity: number[];
      booked: number;
      total: number;
    }
  >();
  for (const zone of zones) {
    const tierName = tierNameFromZone(zone.name);
    const entry = tierMap.get(tierName) ?? {
      prices: [] as number[],
      blackLabel: [] as number[],
      mixers: [] as number[],
      capacity: [] as number[],
      booked: 0,
      total: 0,
    };
    for (const table of zone.tables) {
      const provisions = tableProvisions(table.label);
      const [capMin, capMax] = parseCapacityRange(provisions.capacityRange);
      entry.prices.push(table.priceSatang ?? zone.priceSatang);
      entry.blackLabel.push(provisions.blackLabel);
      entry.mixers.push(provisions.mixers);
      entry.capacity.push(capMin, capMax);
      entry.total += 1;
      if (table.isBooked) entry.booked += 1;
    }
    tierMap.set(tierName, entry);
  }

  const tiers = TIER_ORDER.filter((name) => tierMap.has(name)).map((name) => {
    const entry = tierMap.get(name)!;
    const priceMin = entry.prices.length ? Math.min(...entry.prices) : 0;
    const priceMax = entry.prices.length ? Math.max(...entry.prices) : 0;
    const blackLabelMin = Math.min(...entry.blackLabel);
    const blackLabelMax = Math.max(...entry.blackLabel);
    const mixersMin = Math.min(...entry.mixers);
    const mixersMax = Math.max(...entry.mixers);
    const capMin = Math.min(...entry.capacity);
    const capMax = Math.max(...entry.capacity);

    const benefits = [
      formatRange(blackLabelMin, blackLabelMax, "Black Label"),
      formatRange(mixersMin, mixersMax, "Mixers"),
      capMin === capMax ? `Seats ${capMin}` : `Seats ${capMin}–${capMax}`,
      ...(TIER_PERKS[name] ?? []),
    ];

    return {
      id: name,
      name,
      imageUrl: TIER_IMAGE[name] ?? null,
      benefits,
      priceMinSatang: priceMin,
      priceMaxSatang: priceMax,
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

      <InstagramBadge />
      <StickyBuyBar isLoggedIn={Boolean(session?.user)} />
    </div>
  );
}
