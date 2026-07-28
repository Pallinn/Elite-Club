import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEligibleForConnect } from "@/lib/connect";
import type { ConnectGender, ConnectShowMe } from "@/generated/prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isEligibleForConnect(session.user.id))) {
    return NextResponse.json({ error: "A valid ticket is required to use Connect" }, { status: 403 });
  }

  const myProfile = await prisma.connectProfile.findUnique({ where: { userId: session.user.id } });
  if (!myProfile) {
    return NextResponse.json({ error: "Create a profile first" }, { status: 400 });
  }

  const alreadySwiped = await prisma.connectSwipe.findMany({
    where: { fromProfileId: myProfile.id },
    select: { toProfileId: true },
  });

  const showMeFilter =
    myProfile.showMe === "EVERYONE" ? {} : { gender: myProfile.showMe as ConnectGender };

  // "OTHER" isn't a selectable showMe preference, so someone with that gender
  // is only discoverable by people who chose "Everyone".
  const reciprocalShowMe: ConnectShowMe[] =
    myProfile.gender === "OTHER" ? ["EVERYONE"] : ["EVERYONE", myProfile.gender as ConnectShowMe];

  const candidates = await prisma.connectProfile.findMany({
    where: {
      id: { notIn: [myProfile.id, ...alreadySwiped.map((s) => s.toProfileId)] },
      isActive: true,
      ...showMeFilter,
      showMe: { in: reciprocalShowMe },
    },
    orderBy: { createdAt: "asc" },
    take: 30,
    select: {
      id: true,
      nickname: true,
      age: true,
      description: true,
      photoUrl: true,
      tags: true,
      gender: true,
    },
  });

  // Shuffle so the deck order isn't purely "who signed up first".
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return NextResponse.json({ candidates });
}
