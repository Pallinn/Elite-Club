import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Standard admin gate for API routes. Returns either a NextResponse (to
 * short-circuit the handler) or the authenticated admin session on success.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  return { session, response: null } as const;
}
