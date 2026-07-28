import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEligibleForConnect, sortProfilePair } from "@/lib/connect";
import { connectSwipeSchema } from "@/lib/validators/connect";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isEligibleForConnect(session.user.id))) {
    return NextResponse.json({ error: "A valid ticket is required to use Connect" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = connectSwipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { toProfileId, direction } = parsed.data;

  const myProfile = await prisma.connectProfile.findUnique({ where: { userId: session.user.id } });
  if (!myProfile) {
    return NextResponse.json({ error: "Create a profile first" }, { status: 400 });
  }
  if (myProfile.id === toProfileId) {
    return NextResponse.json({ error: "Cannot swipe on your own profile" }, { status: 400 });
  }

  const targetProfile = await prisma.connectProfile.findUnique({ where: { id: toProfileId } });
  if (!targetProfile || !targetProfile.isActive) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.connectSwipe.upsert({
      where: { fromProfileId_toProfileId: { fromProfileId: myProfile.id, toProfileId } },
      create: { fromProfileId: myProfile.id, toProfileId, direction },
      update: { direction },
    });

    if (direction !== "LIKE") {
      return { matched: false as const };
    }

    const reciprocal = await tx.connectSwipe.findUnique({
      where: {
        fromProfileId_toProfileId: { fromProfileId: toProfileId, toProfileId: myProfile.id },
      },
    });
    if (!reciprocal || reciprocal.direction !== "LIKE") {
      return { matched: false as const };
    }

    const [profileAId, profileBId] = sortProfilePair(myProfile.id, toProfileId);
    const match = await tx.connectMatch.upsert({
      where: { profileAId_profileBId: { profileAId, profileBId } },
      create: { profileAId, profileBId },
      update: {},
      include: { profileA: true, profileB: true },
    });

    const other = match.profileAId === myProfile.id ? match.profileB : match.profileA;
    return {
      matched: true as const,
      match: {
        id: match.id,
        nickname: other.nickname,
        photoUrl: other.photoUrl,
        instagram: other.instagram,
      },
    };
  });

  return NextResponse.json(result);
}
