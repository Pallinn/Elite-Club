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

  // Retired: standing-room General Admission, and the old 5-zone/25-table
  // layout, are no longer sold — replaced by the exact table-per-table Figma
  // floor plan (16+2 tables on Floor 1, 5+1 on Floor 2).
  const retiredZoneIds = [
    "seed-ga-early-bird",
    "seed-ga-regular",
    "seed-vip-tables",
    "seed-floor1-regular",
    "seed-floor1-premium",
    "seed-floor1-vip",
    "seed-floor2-regular",
    "seed-floor2-premium",
  ];
  await prisma.booking.deleteMany({
    where: { items: { some: { zoneId: { in: retiredZoneIds } } } },
  });
  await prisma.zone.deleteMany({ where: { id: { in: retiredZoneIds } } });

  // Tiers (see src/lib/table-provisions.ts for the exact per-table bottle/
  // mixer counts and capacity ranges):
  // Regular (numbered tables 1-16 on Floor 1), capacity 4-6, ฿3,300/table,
  // 1x Black Label + 3x mixers.
  // VIP 1 & VIP 5 (Floor 2), capacity 6-8, ฿7,800/table, 1x Black Label + 4x mixers.
  // VIP 2-4 (Floor 2), capacity 4-6, ฿5,800/table, 1x Black Label + 3x mixers.
  // VVIP1 (Floor 1 lounge), capacity 12-16, ฿12,000/table, 2x Black Label + 8x mixers.
  // VVIP2 (Floor 1 booth), capacity 8-12, ฿12,000/table, 2x Black Label + 6x mixers.
  // VVIP3 (Floor 2 lounge), capacity 6-8, ฿10,000/table, 2x Black Label + 5x mixers.

  const floor1RegularFields = {
    eventId: event.id,
    name: "Floor 1 — Regular",
    type: "VIP_TABLE" as const,
    description: "1x Black Label, 3x Mixers, Main floor access, All stages",
    priceSatang: 330000, // 3,300 THB
    totalCapacity: 16,
    sortOrder: 0,
  };
  const floor1Regular = await prisma.zone.upsert({
    where: { id: "seed-floor1-vip-tables" },
    update: floor1RegularFields,
    create: { id: "seed-floor1-vip-tables", ...floor1RegularFields },
  });

  const floor1VvipFields = {
    eventId: event.id,
    name: "Floor 1 — VVIP",
    type: "VIP_TABLE" as const,
    description: "2x Black Label, Mixers, Priority entry, Dedicated server",
    priceSatang: 1200000, // 12,000 THB
    totalCapacity: 2,
    sortOrder: 1,
  };
  const floor1Vvip = await prisma.zone.upsert({
    where: { id: "seed-floor1-vvip" },
    update: floor1VvipFields,
    create: { id: "seed-floor1-vvip", ...floor1VvipFields },
  });

  const floor2VipFields = {
    eventId: event.id,
    name: "Floor 2 — VIP",
    type: "VIP_TABLE" as const,
    description: "1x Black Label, Mixers, Main floor access, All stages",
    priceSatang: 580000, // 5,800 THB (VIP 2-4 base; VIP 1 & 5 override per-table)
    totalCapacity: 5,
    sortOrder: 2,
  };
  const floor2Vip = await prisma.zone.upsert({
    where: { id: "seed-floor2-vip-tables" },
    update: floor2VipFields,
    create: { id: "seed-floor2-vip-tables", ...floor2VipFields },
  });

  const floor2VvipFields = {
    eventId: event.id,
    name: "Floor 2 — VVIP",
    type: "VIP_TABLE" as const,
    description: "2x Black Label, 5x Mixers, Priority entry, Dedicated server",
    priceSatang: 1000000, // 10,000 THB
    totalCapacity: 1,
    sortOrder: 3,
  };
  const floor2Vvip = await prisma.zone.upsert({
    where: { id: "seed-floor2-vvip" },
    update: floor2VvipFields,
    create: { id: "seed-floor2-vvip", ...floor2VvipFields },
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

  // Positions are percentages of each floor's plan (positionXPct/Pct are
  // resolution-independent, so they're unaffected by the shared 1161x828
  // canvas venue-map.ts renders both floors on), traced pixel-for-pixel from
  // the Figma floor-plan SVGs ("Floor 1 (4).svg" = 1140x830 native,
  // "Floor 2 (3).svg" = 1161x828 native), matching the exact table
  // numbers/labels drawn on the plan (1–16, VVIP1, VVIP2 on Floor 1;
  // VIP 1–5, VVIP3 on Floor 2).
  const tables: SeedTable[] = [
    // Floor 1 — 16 regular tables (plain numbered circles), capacity 4-6
    { id: "seed-t-f1-01", zoneId: floor1Regular.id, label: "1", capacity: 6, priceSatang: null, floor: 1, positionXPct: 88.29, positionYPct: 30.18 },
    { id: "seed-t-f1-02", zoneId: floor1Regular.id, label: "2", capacity: 6, priceSatang: null, floor: 1, positionXPct: 88.29, positionYPct: 41.75 },
    { id: "seed-t-f1-03", zoneId: floor1Regular.id, label: "3", capacity: 6, priceSatang: null, floor: 1, positionXPct: 77.94, positionYPct: 18.61 },
    { id: "seed-t-f1-04", zoneId: floor1Regular.id, label: "4", capacity: 6, priceSatang: null, floor: 1, positionXPct: 77.94, positionYPct: 30.18 },
    { id: "seed-t-f1-05", zoneId: floor1Regular.id, label: "5", capacity: 6, priceSatang: null, floor: 1, positionXPct: 77.94, positionYPct: 41.75 },
    { id: "seed-t-f1-06", zoneId: floor1Regular.id, label: "6", capacity: 6, priceSatang: null, floor: 1, positionXPct: 67.59, positionYPct: 18.61 },
    { id: "seed-t-f1-07", zoneId: floor1Regular.id, label: "7", capacity: 6, priceSatang: null, floor: 1, positionXPct: 67.59, positionYPct: 30.18 },
    { id: "seed-t-f1-08", zoneId: floor1Regular.id, label: "8", capacity: 6, priceSatang: null, floor: 1, positionXPct: 57.24, positionYPct: 18.61 },
    { id: "seed-t-f1-09", zoneId: floor1Regular.id, label: "9", capacity: 6, priceSatang: null, floor: 1, positionXPct: 57.24, positionYPct: 30.18 },
    { id: "seed-t-f1-10", zoneId: floor1Regular.id, label: "10", capacity: 6, priceSatang: null, floor: 1, positionXPct: 46.89, positionYPct: 18.61 },
    { id: "seed-t-f1-11", zoneId: floor1Regular.id, label: "11", capacity: 6, priceSatang: null, floor: 1, positionXPct: 46.89, positionYPct: 30.18 },
    { id: "seed-t-f1-12", zoneId: floor1Regular.id, label: "12", capacity: 6, priceSatang: null, floor: 1, positionXPct: 36.54, positionYPct: 18.61 },
    { id: "seed-t-f1-13", zoneId: floor1Regular.id, label: "13", capacity: 6, priceSatang: null, floor: 1, positionXPct: 26.18, positionYPct: 18.61 },
    { id: "seed-t-f1-14", zoneId: floor1Regular.id, label: "14", capacity: 6, priceSatang: null, floor: 1, positionXPct: 15.83, positionYPct: 18.61 },
    { id: "seed-t-f1-15", zoneId: floor1Regular.id, label: "15", capacity: 6, priceSatang: null, floor: 1, positionXPct: 15.79, positionYPct: 30.18 },
    { id: "seed-t-f1-16", zoneId: floor1Regular.id, label: "16", capacity: 6, priceSatang: null, floor: 1, positionXPct: 15.83, positionYPct: 41.93 },
    // Floor 1 — VVIP1 (big lounge, capacity 12-16) + VVIP2 (booth, capacity 8-12)
    { id: "seed-t-f1-vvip2", zoneId: floor1Vvip.id, label: "VVIP2", capacity: 12, priceSatang: null, floor: 1, positionXPct: 32.5, positionYPct: 58.01 },
    { id: "seed-t-f1-vvip1", zoneId: floor1Vvip.id, label: "VVIP1", capacity: 16, priceSatang: null, floor: 1, positionXPct: 85.96, positionYPct: 76.76 },
    // Floor 2 — 5 VIP tables (plain circles, "VIP N" labeled on the plan).
    // VIP 1 & VIP 5 are the premium pair (capacity 6-8, ฿7,800); VIP 2-4 are
    // the zone base rate (capacity 4-6, ฿5,800).
    { id: "seed-t-f2-01", zoneId: floor2Vip.id, label: "VIP 1", capacity: 8, priceSatang: 780000, floor: 2, positionXPct: 14.34, positionYPct: 84.78 },
    { id: "seed-t-f2-02", zoneId: floor2Vip.id, label: "VIP 2", capacity: 6, priceSatang: null, floor: 2, positionXPct: 33.38, positionYPct: 84.78 },
    { id: "seed-t-f2-03", zoneId: floor2Vip.id, label: "VIP 3", capacity: 6, priceSatang: null, floor: 2, positionXPct: 51.81, positionYPct: 76.45 },
    { id: "seed-t-f2-04", zoneId: floor2Vip.id, label: "VIP 4", capacity: 6, priceSatang: null, floor: 2, positionXPct: 69.29, positionYPct: 61.71 },
    { id: "seed-t-f2-05", zoneId: floor2Vip.id, label: "VIP 5", capacity: 8, priceSatang: 780000, floor: 2, positionXPct: 85.23, positionYPct: 47.46 },
    // Floor 2 — VVIP3 lounge, capacity 6-8
    { id: "seed-t-f2-vvip3", zoneId: floor2Vvip.id, label: "VVIP3", capacity: 8, priceSatang: null, floor: 2, positionXPct: 92.03, positionYPct: 21.86 },
  ];

  for (const t of tables) {
    const { id, ...fields } = t;
    await prisma.table.upsert({ where: { id }, update: fields, create: { id, ...fields } });
  }

  // Team-shared admin logins. All five accounts share the same password by
  // design (per team ops); the username differentiates the audit trail.
  const teamAdminPasswordHash = await bcrypt.hash("elite_q", 12);
  const teamAdmins = [
    { email: "elite_pan@gmail.com", name: "Pan" },
    { email: "elite_gong@gmail.com", name: "Gong" },
    { email: "elite_japam@gmail.com", name: "Japam" },
    { email: "elite_lin@gmail.com", name: "Lin" },
    { email: "elite_c@gmail.com", name: "C" },
  ];
  for (const a of teamAdmins) {
    const fields = {
      name: a.name,
      passwordHash: teamAdminPasswordHash,
      role: "ADMIN" as const,
    };
    await prisma.user.upsert({
      where: { email: a.email },
      update: fields,
      create: { email: a.email, ...fields },
    });
  }

  // Original seeded fallback admin (kept for backwards compatibility).
  const legacyAdminHash = await bcrypt.hash("admin12345", 12);
  await prisma.user.upsert({
    where: { email: "admin@no-signal.example" },
    update: {
      name: "No Signal Admin",
      passwordHash: legacyAdminHash,
      role: "ADMIN" as const,
    },
    create: {
      email: "admin@no-signal.example",
      name: "No Signal Admin",
      passwordHash: legacyAdminHash,
      role: "ADMIN" as const,
    },
  });

  console.log(`Seeded event "${event.name}" (${event.slug})`);
  console.log(
    `Zones: ${floor1Regular.name}, ${floor1Vvip.name}, ${floor2Vip.name}, ${floor2Vvip.name}`
  );
  console.log(`Tables: ${tables.length}`);
  console.log(`Team admins: ${teamAdmins.map((a) => a.email).join(", ")}`);
  console.log("Password (all): elite_q");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
