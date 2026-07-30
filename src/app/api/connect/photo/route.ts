import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { isEligibleForConnect } from "@/lib/connect";

// Only serve blobs from our own private store's host, and only under the
// connect/ prefix - prevents this proxy (reachable by any ticket holder, not
// just admins) from being used to fetch arbitrary external URLs or other
// private blobs in the same store, e.g. payment slip images under slips/.
const PRIVATE_BLOB_HOST = /^[a-z0-9-]+\.private\.blob\.vercel-storage\.com$/i;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isEligibleForConnect(session.user.id))) {
    return NextResponse.json({ error: "A valid ticket is required to use Connect" }, { status: 403 });
  }

  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (!PRIVATE_BLOB_HOST.test(parsed.hostname) || !parsed.pathname.startsWith("/connect/")) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const result = await get(url, { access: "private" });
  if (!result?.stream) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
