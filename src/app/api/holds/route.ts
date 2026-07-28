import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHoldSchema } from "@/lib/validators/booking";
import { activeBookingItemFilter } from "@/lib/availability";
import { expireStaleHolds } from "@/lib/expire-holds";
import { recordAudit } from "@/lib/audit";

const HOLD_TTL_MINUTES = 12;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in to reserve tickets." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createHoldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findFirst({ where: { status: "PUBLISHED" } });
  if (!event) {
    return NextResponse.json({ error: "No event is currently on sale." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const activeFilter = activeBookingItemFilter(now);
      let totalSatang = 0;
      const itemsToCreate: {
        zoneId: string;
        tableId: string | null;
        quantity: number;
        unitPriceSatang: number;
        subtotalSatang: number;
      }[] = [];

      for (const item of parsed.data.items) {
        const zone = await tx.zone.findUnique({ where: { id: item.zoneId } });
        if (!zone || zone.eventId !== event.id || !zone.isActive) {
          throw new HoldConflictError(`One of the selected zones is no longer available.`);
        }

        if (zone.type === "VIP_TABLE") {
          if (!item.tableId) {
            throw new HoldConflictError("Select a specific table for a VIP zone.");
          }

          await tx.$queryRaw`SELECT id FROM "Table" WHERE id = ${item.tableId} FOR UPDATE`;

          const table = await tx.table.findUnique({ where: { id: item.tableId } });
          if (!table || table.zoneId !== zone.id || !table.isActive) {
            throw new HoldConflictError("That table is no longer available.");
          }
          if (table.isLocked) {
            throw new HoldConflictError(`${table.label} is currently locked by staff.`);
          }

          // Flip any stale hold on this table to EXPIRED now, rather than waiting
          // on the cron sweep - the partial unique index below enforces isActive
          // at the row level, so a lapsed hold still blocks a new INSERT until its
          // row is actually flipped, even though it's already excluded from
          // availability reads.
          await expireStaleHolds(tx, { items: { some: { tableId: table.id } } }, now);

          const alreadyBooked = await tx.bookingItem.findFirst({
            where: { ...activeFilter, tableId: table.id },
          });
          if (alreadyBooked) {
            throw new HoldConflictError(`${table.label} was just reserved by someone else.`);
          }

          const unitPriceSatang = table.priceSatang ?? zone.priceSatang;
          itemsToCreate.push({
            zoneId: zone.id,
            tableId: table.id,
            quantity: 1,
            unitPriceSatang,
            subtotalSatang: unitPriceSatang,
          });
          totalSatang += unitPriceSatang;
        } else {
          await tx.$queryRaw`SELECT id FROM "Zone" WHERE id = ${zone.id} FOR UPDATE`;

          const usage = await tx.bookingItem.aggregate({
            where: { ...activeFilter, zoneId: zone.id, tableId: null },
            _sum: { quantity: true },
          });
          const used = usage._sum.quantity ?? 0;
          const remaining = zone.totalCapacity - used;
          if (remaining < item.quantity) {
            throw new HoldConflictError(
              `Only ${Math.max(0, remaining)} left in ${zone.name}.`
            );
          }

          const subtotalSatang = zone.priceSatang * item.quantity;
          itemsToCreate.push({
            zoneId: zone.id,
            tableId: null,
            quantity: item.quantity,
            unitPriceSatang: zone.priceSatang,
            subtotalSatang,
          });
          totalSatang += subtotalSatang;
        }
      }

      const holdExpiresAt = new Date(now.getTime() + HOLD_TTL_MINUTES * 60 * 1000);

      const booking = await tx.booking.create({
        data: {
          userId: session.user.id,
          eventId: event.id,
          status: "HOLD",
          holdExpiresAt,
          totalSatang,
          contactName: session.user.name ?? "",
          contactEmail: session.user.email ?? "",
          contactPhone: user?.phone ?? null,
          items: { create: itemsToCreate },
        },
      });

      return { bookingId: booking.id, holdExpiresAt, totalSatang, itemCount: itemsToCreate.length };
    });

    await recordAudit({
      actorUserId: session.user.id,
      actorLabel: session.user.name ?? session.user.email ?? null,
      action: "booking.created",
      entityType: "Booking",
      entityId: result.bookingId,
      metadata: {
        totalSatang: result.totalSatang,
        itemCount: result.itemCount,
        holdExpiresAt: result.holdExpiresAt.toISOString(),
      },
    });

    return NextResponse.json({ bookingId: result.bookingId, holdExpiresAt: result.holdExpiresAt });
  } catch (err) {
    if (err instanceof HoldConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    // A concurrent transaction winning the partial-unique-index race also surfaces here.
    if (isUniqueConstraintError(err)) {
      return NextResponse.json(
        { error: "That table was just reserved by someone else." },
        { status: 409 }
      );
    }
    throw err;
  }
}

class HoldConflictError extends Error {}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}
