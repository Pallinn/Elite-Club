import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const eventFields = {
    name: "No Signal",
    description:
      "An underground night out — DJs, unlimited drinks, and a villa you won't forget.",
    venueName: "TBA Villa",
    address: "Bangkok, Thailand",
    status: "PUBLISHED" as const,
    startAt: new Date("2026-09-12T20:00:00+07:00"),
    endAt: new Date("2026-09-13T03:00:00+07:00"),
    doorsOpenAt: new Date("2026-09-12T20:00:00+07:00"),
    salesStartAt: new Date(),
    salesEndAt: new Date("2026-09-12T18:00:00+07:00"),
  };
  const event = await prisma.event.upsert({
    where: { slug: "no-signal" },
    update: eventFields,
    create: { slug: "no-signal", ...eventFields },
  });

  // Retired: standing-room General Admission is no longer sold for this event —
  // every seat is now an individually bookable table on the floor-plan map.
  const retiredZoneIds = ["seed-ga-early-bird", "seed-ga-regular", "seed-vip-tables"];
  await prisma.booking.deleteMany({
    where: { items: { some: { zoneId: { in: retiredZoneIds } } } },
  });
  await prisma.zone.deleteMany({ where: { id: { in: retiredZoneIds } } });

  // Tiers: VVIP (8-14 people, ฿15,000-20,000/table, 2x Black Label + mixers),
  // VIP (4-8 people, ฿7,000-11,000/table, 1x Black Label + mixers),
  // Stand Table (฿5,000/table, 1x Black Label). Each specific table is priced
  // within its tier's range based on its own capacity.

  const floor1StandFields = {
    eventId: event.id,
    name: "Floor 1 — Stand Table",
    type: "VIP_TABLE" as const,
    description: "1x Black Label, Main floor access, All stages",
    priceSatang: 500000, // 5000 THB
    totalCapacity: 12,
    sortOrder: 0,
  };
  const floor1Stand = await prisma.zone.upsert({
    where: { id: "seed-floor1-regular" },
    update: floor1StandFields,
    create: { id: "seed-floor1-regular", ...floor1StandFields },
  });

  const floor1VvipFields = {
    eventId: event.id,
    name: "Floor 1 — VVIP",
    type: "VIP_TABLE" as const,
    description: "2x Black Label, Mixers, Priority entry, Dedicated server",
    priceSatang: 1500000, // 15,000 THB base
    totalCapacity: 1,
    sortOrder: 1,
  };
  const floor1Vvip = await prisma.zone.upsert({
    where: { id: "seed-floor1-premium" },
    update: floor1VvipFields,
    create: { id: "seed-floor1-premium", ...floor1VvipFields },
  });

  const floor1VipFields = {
    eventId: event.id,
    name: "Floor 1 — VIP",
    type: "VIP_TABLE" as const,
    description: "1x Black Label, Mixers, Priority entry, Dedicated server",
    priceSatang: 900000, // 9,000 THB base
    totalCapacity: 1,
    sortOrder: 2,
  };
  const floor1Vip = await prisma.zone.upsert({
    where: { id: "seed-floor1-vip" },
    update: floor1VipFields,
    create: { id: "seed-floor1-vip", ...floor1VipFields },
  });

  const floor2StandFields = {
    eventId: event.id,
    name: "Floor 2 — Stand Table",
    type: "VIP_TABLE" as const,
    description: "1x Black Label, Upper floor access, Bar view",
    priceSatang: 500000, // 5000 THB
    totalCapacity: 10,
    sortOrder: 3,
  };
  const floor2Stand = await prisma.zone.upsert({
    where: { id: "seed-floor2-regular" },
    update: floor2StandFields,
    create: { id: "seed-floor2-regular", ...floor2StandFields },
  });

  const floor2VvipFields = {
    eventId: event.id,
    name: "Floor 2 — VVIP",
    type: "VIP_TABLE" as const,
    description: "2x Black Label, Mixers, Priority entry, Dedicated server",
    priceSatang: 1500000, // 15,000 THB base
    totalCapacity: 1,
    sortOrder: 4,
  };
  const floor2Vvip = await prisma.zone.upsert({
    where: { id: "seed-floor2-premium" },
    update: floor2VvipFields,
    create: { id: "seed-floor2-premium", ...floor2VvipFields },
  });

  type SeedTable = {
    id: string;
    zoneId: string;
    label: string;
    capacity: number;
    priceSatang: number | null;
    floor: number;
    positionXPct: number;
    positionYPct: number;
  };

  const tables: SeedTable[] = [
    // Floor 1 — 12 stand tables
    { id: "seed-t-f1-01", zoneId: floor1Stand.id, label: "Table 1", capacity: 4, priceSatang: null, floor: 1, positionXPct: 18, positionYPct: 22 },
    { id: "seed-t-f1-02", zoneId: floor1Stand.id, label: "Table 2", capacity: 4, priceSatang: null, floor: 1, positionXPct: 32, positionYPct: 22 },
    { id: "seed-t-f1-03", zoneId: floor1Stand.id, label: "Table 3", capacity: 4, priceSatang: null, floor: 1, positionXPct: 46, positionYPct: 22 },
    { id: "seed-t-f1-04", zoneId: floor1Stand.id, label: "Table 4", capacity: 4, priceSatang: null, floor: 1, positionXPct: 60, positionYPct: 22 },
    { id: "seed-t-f1-05", zoneId: floor1Stand.id, label: "Table 5", capacity: 4, priceSatang: null, floor: 1, positionXPct: 74, positionYPct: 22 },
    { id: "seed-t-f1-06", zoneId: floor1Stand.id, label: "Table 6", capacity: 4, priceSatang: null, floor: 1, positionXPct: 18, positionYPct: 42 },
    { id: "seed-t-f1-07", zoneId: floor1Stand.id, label: "Table 7", capacity: 4, priceSatang: null, floor: 1, positionXPct: 60, positionYPct: 42 },
    { id: "seed-t-f1-08", zoneId: floor1Stand.id, label: "Table 8", capacity: 4, priceSatang: null, floor: 1, positionXPct: 74, positionYPct: 42 },
    { id: "seed-t-f1-09", zoneId: floor1Stand.id, label: "Table 9", capacity: 4, priceSatang: null, floor: 1, positionXPct: 84, positionYPct: 58 },
    { id: "seed-t-f1-10", zoneId: floor1Stand.id, label: "Table 10", capacity: 4, priceSatang: null, floor: 1, positionXPct: 70, positionYPct: 58 },
    { id: "seed-t-f1-11", zoneId: floor1Stand.id, label: "Table 11", capacity: 4, priceSatang: null, floor: 1, positionXPct: 84, positionYPct: 75 },
    { id: "seed-t-f1-12", zoneId: floor1Stand.id, label: "Table 12", capacity: 4, priceSatang: null, floor: 1, positionXPct: 70, positionYPct: 75 },
    // Floor 1 — VVIP (V1, capacity 8 -> priced at the bottom of the 15k-20k range)
    { id: "seed-t-f1-v1", zoneId: floor1Vvip.id, label: "V1 Lounge", capacity: 8, priceSatang: 1500000, floor: 1, positionXPct: 38, positionYPct: 52 },
    // Floor 1 — VIP (V2, capacity 6 -> mid-way through the 7k-11k range)
    { id: "seed-t-f1-v2", zoneId: floor1Vip.id, label: "V2 Booth", capacity: 6, priceSatang: 900000, floor: 1, positionXPct: 90, positionYPct: 68 },
    // Floor 2 — 10 stand tables
    { id: "seed-t-f2-01", zoneId: floor2Stand.id, label: "Table 13", capacity: 4, priceSatang: null, floor: 2, positionXPct: 78, positionYPct: 15 },
    { id: "seed-t-f2-02", zoneId: floor2Stand.id, label: "Table 14", capacity: 4, priceSatang: null, floor: 2, positionXPct: 88, positionYPct: 15 },
    { id: "seed-t-f2-03", zoneId: floor2Stand.id, label: "Table 15", capacity: 4, priceSatang: null, floor: 2, positionXPct: 78, positionYPct: 28 },
    { id: "seed-t-f2-04", zoneId: floor2Stand.id, label: "Table 16", capacity: 4, priceSatang: null, floor: 2, positionXPct: 88, positionYPct: 28 },
    { id: "seed-t-f2-05", zoneId: floor2Stand.id, label: "Table 17", capacity: 4, priceSatang: null, floor: 2, positionXPct: 68, positionYPct: 22 },
    { id: "seed-t-f2-06", zoneId: floor2Stand.id, label: "Table 18", capacity: 4, priceSatang: null, floor: 2, positionXPct: 60, positionYPct: 30 },
    { id: "seed-t-f2-07", zoneId: floor2Stand.id, label: "Table 19", capacity: 4, priceSatang: null, floor: 2, positionXPct: 53, positionYPct: 37 },
    { id: "seed-t-f2-08", zoneId: floor2Stand.id, label: "Table 20", capacity: 4, priceSatang: null, floor: 2, positionXPct: 45, positionYPct: 45 },
    { id: "seed-t-f2-09", zoneId: floor2Stand.id, label: "Table 21", capacity: 4, priceSatang: null, floor: 2, positionXPct: 36, positionYPct: 52 },
    { id: "seed-t-f2-10", zoneId: floor2Stand.id, label: "Table 22", capacity: 4, priceSatang: null, floor: 2, positionXPct: 28, positionYPct: 60 },
    // Floor 2 — VVIP (Lounge, capacity 8 -> priced at the bottom of the 15k-20k range)
    { id: "seed-t-f2-lounge", zoneId: floor2Vvip.id, label: "Floor 2 Lounge", capacity: 8, priceSatang: 1500000, floor: 2, positionXPct: 15, positionYPct: 78 },
  ];

  for (const t of tables) {
    const { id, ...fields } = t;
    await prisma.table.upsert({ where: { id }, update: fields, create: { id, ...fields } });
  }

  const adminPasswordHash = await bcrypt.hash("admin12345", 12);
  const adminFields = {
    name: "No Signal Admin",
    passwordHash: adminPasswordHash,
    role: "ADMIN" as const,
  };
  await prisma.user.upsert({
    where: { email: "admin@no-signal.example" },
    update: adminFields,
    create: { email: "admin@no-signal.example", ...adminFields },
  });

  console.log(`Seeded event "${event.name}" (${event.slug})`);
  console.log(
    `Zones: ${floor1Stand.name}, ${floor1Vvip.name}, ${floor1Vip.name}, ${floor2Stand.name}, ${floor2Vvip.name}`
  );
  console.log(`Tables: ${tables.length}`);
  console.log("Admin login: admin@no-signal.example / admin12345");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
