import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const admin = guard.session.user;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.status === "VOID") {
    return NextResponse.json({ error: "Already void." }, { status: 409 });
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: { status: "VOID" },
  });

  await recordAudit({
    actorUserId: admin.id,
    actorLabel: admin.name ?? admin.email ?? null,
    action: "ticket.void",
    entityType: "Ticket",
    entityId: id,
    metadata: {
      ticketNumber: ticket.ticketNumber,
      previousStatus: ticket.status,
      holderUserId: ticket.holderUserId,
    },
  });

  return NextResponse.json({ ok: true, ticket: updated });
}
