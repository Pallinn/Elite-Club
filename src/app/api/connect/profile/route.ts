import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEligibleForConnect } from "@/lib/connect";
import { connectProfileSchema } from "@/lib/validators/connect";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const eligible = await isEligibleForConnect(session.user.id);
  const profile = await prisma.connectProfile.findUnique({ where: { userId: session.user.id } });

  return NextResponse.json({ eligible, profile });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isEligibleForConnect(session.user.id))) {
    return NextResponse.json({ error: "A valid ticket is required to use Connect" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = connectProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const profile = await prisma.connectProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: { ...parsed.data },
  });

  return NextResponse.json({ ok: true, profile });
}
