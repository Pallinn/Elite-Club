import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEligibleForConnect } from "@/lib/connect";

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
    return NextResponse.json({ matches: [] });
  }

  const matches = await prisma.connectMatch.findMany({
    where: { OR: [{ profileAId: myProfile.id }, { profileBId: myProfile.id }] },
    orderBy: { createdAt: "desc" },
    include: { profileA: true, profileB: true },
  });

  const result = matches.map((m) => {
    const other = m.profileAId === myProfile.id ? m.profileB : m.profileA;
    return {
      id: m.id,
      matchedAt: m.createdAt,
      nickname: other.nickname,
      age: other.age,
      photoUrl: other.photoUrl,
      instagram: other.instagram,
      description: other.description,
    };
  });

  return NextResponse.json({ matches: result });
}
