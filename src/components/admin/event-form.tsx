"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function toLocalInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function EventForm({
  event,
}: {
  event: {
    id: string;
    name: string;
    description: string | null;
    venueName: string | null;
    address: string | null;
    status: "DRAFT" | "PUBLISHED" | "CLOSED";
    startAt: Date;
    endAt: Date;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: event.name,
    description: event.description ?? "",
    venueName: event.venueName ?? "",
    address: event.address ?? "",
    status: event.status,
    startAt: toLocalInputValue(event.startAt),
    endAt: toLocalInputValue(event.endAt),
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/event", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Couldn't save event.");
      return;
    }
    toast.success("Event updated.");
    router.refresh();
  }

  return (
    <Card className="border-white/10 bg-neutral-950">
      <CardHeader>
        <CardTitle className="text-white">Event details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venueName">Venue</Label>
            <Input
              id="venueName"
              value={form.venueName}
              onChange={(e) => setForm({ ...form, venueName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startAt">Start</Label>
            <Input
              id="startAt"
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt">End</Label>
            <Input
              id="endAt"
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
              className="h-9 w-full rounded-md border border-white/10 bg-neutral-900 px-2 text-sm text-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save event"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
