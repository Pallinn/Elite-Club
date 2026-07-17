import { NextResponse } from "next/server";
import { unparse } from "papaparse";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { satangToBaht } from "@/lib/money";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { status: "PAID" },
    orderBy: { createdAt: "asc" },
    include: { items: { include: { zone: true, table: true, tickets: true } } },
  });

  const rows = bookings.flatMap((booking) =>
    booking.items.flatMap((item) =>
      (item.tickets.length > 0 ? item.tickets : [null]).map((ticket) => ({
        "Contact Name": booking.contactName,
        "Contact Email": booking.contactEmail,
        "Contact Phone": booking.contactPhone ?? "",
        Zone: item.zone.name,
        Table: item.table?.label ?? "",
        "Ticket Number": ticket?.ticketNumber ?? "",
        "Ticket Status": ticket?.status ?? "",
        "Amount (THB)": satangToBaht(item.subtotalSatang),
        "Purchase Date": booking.paidAt?.toISOString() ?? "",
      }))
    )
  );

  const csv = unparse(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="no-signal-attendees.csv"`,
    },
  });
}
