import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit";

const schema = z.object({ isActive: z.boolean() });

/**
 * Deactivating hides a Connect profile from the swipe deck and blocks it
 * from being swiped on (see isActive checks in /api/connect/deck and
 * /api/connect/swipe) - the moderation "ban" action, reversible.
 */
export async function POST(request: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const admin = guard.session.user;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const profile = await prisma.connectProfile.findUnique({ where: { userId } });
  if (!profile) {
    return NextResponse.json({ error: "This user doesn't have a Connect profile." }, { status: 404 });
  }

  const updated = await prisma.connectProfile.update({
    where: { userId },
    data: { isActive: parsed.data.isActive },
  });

  await recordAudit({
    actorUserId: admin.id,
    actorLabel: admin.name ?? admin.email ?? null,
    action: parsed.data.isActive ? "connect.profile_activated" : "connect.profile_deactivated",
    entityType: "ConnectProfile",
    entityId: profile.id,
    metadata: { nickname: profile.nickname },
  });

  return NextResponse.json({ ok: true, profile: updated });
}
