import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit";

/**
 * Clears an inappropriate Connect profile photo and deactivates the profile
 * at the same time - photoUrl is a required field everywhere else in the
 * app (swipe deck, matches), so a profile can't safely stay active without
 * one. The user has to re-upload a photo (which reactivates nothing by
 * itself - an admin still has to flip isActive back on) before they can
 * appear in the deck again.
 */
export async function POST(_request: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const admin = guard.session.user;

  const profile = await prisma.connectProfile.findUnique({ where: { userId } });
  if (!profile) {
    return NextResponse.json({ error: "This user doesn't have a Connect profile." }, { status: 404 });
  }

  // Best-effort delete of the actual blob - the DB update below is what
  // actually protects users, so a storage-side failure shouldn't block it.
  try {
    const { del } = await import("@vercel/blob");
    await del(profile.photoUrl);
  } catch (err) {
    console.error(`Failed to delete Connect photo blob for profile ${profile.id}:`, err);
  }

  const updated = await prisma.connectProfile.update({
    where: { userId },
    data: { photoUrl: "", isActive: false },
  });

  await recordAudit({
    actorUserId: admin.id,
    actorLabel: admin.name ?? admin.email ?? null,
    action: "connect.photo_removed",
    entityType: "ConnectProfile",
    entityId: profile.id,
    metadata: { nickname: profile.nickname },
  });

  return NextResponse.json({ ok: true, profile: updated });
}
