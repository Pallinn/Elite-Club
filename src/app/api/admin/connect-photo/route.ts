import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { requireAdmin } from "@/lib/admin-auth";

// Only serve blobs from our own private store's host - prevents this
// authenticated proxy from being used to fetch arbitrary external URLs.
const PRIVATE_BLOB_HOST = /^[a-z0-9-]+\.private\.blob\.vercel-storage\.com$/i;

/**
 * Admin-only variant of /api/connect/photo - lets staff review Connect
 * profile photos for moderation without needing a ticket themselves.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

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
  if (!PRIVATE_BLOB_HOST.test(parsed.hostname)) {
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
