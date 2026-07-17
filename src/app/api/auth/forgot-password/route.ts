import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { sendResetPasswordEmail } from "@/lib/email/send";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 60 minutes

export async function POST(request: Request) {
  if (isRateLimited(`forgot-password:${getClientIp(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way regardless of whether the account exists,
  // to avoid leaking which emails are registered.
  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${process.env.APP_URL}/reset-password/${rawToken}`;
    await sendResetPasswordEmail({ to: user.email, name: user.name, resetUrl });
  }

  return NextResponse.json({ ok: true });
}
