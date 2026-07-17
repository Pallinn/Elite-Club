"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Table = {
  id: string;
  label: string;
  capacity: number;
  priceSatang: number | null;
};

type Zone = {
  id: string;
  name: string;
  type: "GENERAL_ADMISSION" | "VIP_TABLE";
  description: string | null;
  priceSatang: number;
  totalCapacity: number;
  tables: Table[];
};

export function ZoneEditor({ zones }: { zones: Zone[] }) {
  return (
    <div className="space-y-4">
      {zones.map((zone) => (
        <ZoneCard key={zone.id} zone={zone} />
      ))}
      <NewZoneForm />
    </div>
  );
}

function ZoneCard({ zone }: { zone: Zone }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: zone.name,
    description: zone.description ?? "",
    priceSatang: zone.priceSatang / 100,
    totalCapacity: zone.totalCapacity,
  });
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/admin/zones/${zone.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        priceSatang: Math.round(form.priceSatang * 100),
        totalCapacity: form.totalCapacity,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Couldn't save zone.");
      return;
    }
    toast.success("Zone saved.");
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Remove "${zone.name}"? Existing bookings are kept.`)) return;
    const res = await fetch(`/api/admin/zones/${zone.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't remove zone.");
      return;
    }
    toast.success("Zone removed.");
    router.refresh();
  }

  return (
    <Card className="border-white/10 bg-neutral-950">
      <CardHeader>
        <CardTitle className="text-white text-base">
          {zone.name} <span className="text-xs text-neutral-500">({zone.type})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Price (THB{zone.type === "VIP_TABLE" ? ", base" : ""})</Label>
            <Input
              type="number"
              value={form.priceSatang}
              onChange={(e) => setForm({ ...form, priceSatang: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label>
              {zone.type === "GENERAL_ADMISSION" ? "Total capacity" : "Capacity (informational)"}
            </Label>
            <Input
              type="number"
              value={form.totalCapacity}
              onChange={(e) => setForm({ ...form, totalCapacity: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" variant="outline" onClick={remove}>
            Remove
          </Button>
        </div>

        {zone.type === "VIP_TABLE" && <TableManager zoneId={zone.id} tables={zone.tables} />}
      </CardContent>
    </Card>
  );
}

function TableManager({ zoneId, tables }: { zoneId: string; tables: Table[] }) {
  const router = useRouter();
  const [newTable, setNewTable] = useState({ label: "", capacity: 6, priceSatang: "" });
  const [loading, setLoading] = useState(false);

  async function addTable() {
    setLoading(true);
    const res = await fetch(`/api/admin/zones/${zoneId}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newTable.label,
        capacity: newTable.capacity,
        priceSatang: newTable.priceSatang ? Math.round(Number(newTable.priceSatang) * 100) : undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Couldn't add table.");
      return;
    }
    setNewTable({ label: "", capacity: 6, priceSatang: "" });
    router.refresh();
  }

  async function removeTable(id: string) {
    if (!confirm("Remove this table?")) return;
    const res = await fetch(`/api/admin/tables/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't remove table.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2 border-t border-white/10 pt-3">
      <p className="text-sm text-neutral-400">Tables</p>
      {tables.map((table) => (
        <div key={table.id} className="flex items-center justify-between text-sm text-neutral-300">
          <span>
            {table.label} &middot; seats {table.capacity}
            {table.priceSatang ? ` · ${(table.priceSatang / 100).toLocaleString()} THB` : ""}
          </span>
          <Button size="xs" variant="outline" onClick={() => removeTable(table.id)}>
            Remove
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-end gap-2 pt-2">
        <div className="space-y-1">
          <Label className="text-xs">Label</Label>
          <Input
            className="h-8 w-32"
            value={newTable.label}
            onChange={(e) => setNewTable({ ...newTable, label: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Capacity</Label>
          <Input
            className="h-8 w-20"
            type="number"
            value={newTable.capacity}
            onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Price (THB)</Label>
          <Input
            className="h-8 w-24"
            type="number"
            placeholder="zone default"
            value={newTable.priceSatang}
            onChange={(e) => setNewTable({ ...newTable, priceSatang: e.target.value })}
          />
        </div>
        <Button size="sm" onClick={addTable} disabled={loading || !newTable.label}>
          Add table
        </Button>
      </div>
    </div>
  );
}

function NewZoneForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    type: "GENERAL_ADMISSION" as "GENERAL_ADMISSION" | "VIP_TABLE",
    priceSatang: "",
    totalCapacity: "",
  });
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    const res = await fetch("/api/admin/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        priceSatang: Math.round(Number(form.priceSatang || 0) * 100),
        totalCapacity: Number(form.totalCapacity || 0),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Couldn't create zone.");
      return;
    }
    setForm({ name: "", type: "GENERAL_ADMISSION", priceSatang: "", totalCapacity: "" });
    router.refresh();
  }

  return (
    <Card className="border-dashed border-white/20 bg-transparent">
      <CardHeader>
        <CardTitle className="text-white text-base">Add zone</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            className="h-8 w-40"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
            className="h-8 rounded-md border border-white/10 bg-neutral-900 px-2 text-sm text-white"
          >
            <option value="GENERAL_ADMISSION">General Admission</option>
            <option value="VIP_TABLE">VIP Table</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Price (THB)</Label>
          <Input
            className="h-8 w-24"
            type="number"
            value={form.priceSatang}
            onChange={(e) => setForm({ ...form, priceSatang: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Capacity</Label>
          <Input
            className="h-8 w-20"
            type="number"
            value={form.totalCapacity}
            onChange={(e) => setForm({ ...form, totalCapacity: e.target.value })}
          />
        </div>
        <Button size="sm" onClick={create} disabled={loading || !form.name}>
          Add zone
        </Button>
      </CardContent>
    </Card>
  );
}
