import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const updateEventSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  venueName: z.string().trim().max(150).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]),
  startAt: z.iso.datetime({ offset: true }).or(z.string().min(1)),
  endAt: z.iso.datetime({ offset: true }).or(z.string().min(1)),
});

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findFirst();
  if (!event) return NextResponse.json({ error: "No event found" }, { status: 404 });

  const updated = await prisma.event.update({
    where: { id: event.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      venueName: parsed.data.venueName || null,
      address: parsed.data.address || null,
      status: parsed.data.status,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
    },
  });

  return NextResponse.json({ ok: true, event: updated });
}
