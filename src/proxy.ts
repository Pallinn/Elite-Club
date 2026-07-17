import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdmin = req.auth?.user?.role === "ADMIN";
  const isLoggedIn = !!req.auth;

  if (pathname === "/api/auth/callback/credentials") {
    if (isRateLimited(`login:${getClientIp(req)}`, 15, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/account") && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/api/auth/callback/credentials"],
};
