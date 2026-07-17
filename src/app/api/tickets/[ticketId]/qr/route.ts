import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { buildTicketQrPayload } from "@/lib/qr";

// Unauthenticated on purpose: this just renders the check-in QR image so it can be
// embedded in emails (which can't send session cookies). Knowing a ticket's UUID
// carries no more sensitivity than the emailed ticket link itself.
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await ctx.params;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await QRCode.toBuffer(buildTicketQrPayload(ticket.id), {
    type: "png",
    width: 300,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
