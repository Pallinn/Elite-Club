import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { isEligibleForConnect } from "@/lib/connect";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isEligibleForConnect(session.user.id))) {
    return NextResponse.json({ error: "A valid ticket is required to use Connect" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Photo must be JPEG, PNG, or WebP" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo must be under 5MB" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

  try {
    // The store is private (Vercel account default), so uploads must use
    // access: "private" - photos are served back through /api/connect/photo,
    // which fetches them server-side with the read-write token.
    const blob = await put(`connect/${session.user.id}-${Date.now()}.${ext}`, file, {
      access: "private",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Connect photo upload failed:", err);
    return NextResponse.json({ error: "Upload failed. Photo storage may not be configured yet." }, { status: 500 });
  }
}
