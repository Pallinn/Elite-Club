"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FloorPlanMap, type FloorTable } from "@/components/booking/floor-plan-map";
import { formatSatang } from "@/lib/money";
import { TableRoster, type RosterTicket } from "@/components/admin/table-roster";
import { TIER_BADGE_CLASS, type Tier } from "@/lib/tiers";

export type AdminTable = FloorTable & {
  isLocked: boolean;
  tier: Tier;
  bookingItemId: string | null;
  paidStatus: "PAID" | "HOLD" | "EXPIRED" | "CANCELLED" | "FAILED" | null;
  tickets: RosterTicket[];
};

export function TableManager({ tables }: { tables: AdminTable[] }) {
  const router = useRouter();
  const [floor, setFloor] = useState<1 | 2>(1);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [capacityInput, setCapacityInput] = useState("");
  const [busy, setBusy] = useState(false);

  const selected = tables.find((t) => t.key === selectedKey) ?? null;
  const floorTables = tables.filter((t) => t.floor === floor);
  const selectedKeys = useMemo(
    () => new Set(selected ? [selected.key] : []),
    [selected]
  );

  function selectTable(t: FloorTable) {
    setSelectedKey(t.key);
    const full = tables.find((x) => x.key === t.key);
    if (full) {
      setPriceInput(String(Math.floor(full.priceSatang / 100)));
      setCapacityInput(String(full.capacity));
    }
  }

  async function patch(body: Record<string, unknown>) {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tables/${selected.tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Update failed.");
        return;
      }
      toast.success("Saved.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    const priceBaht = parseInt(priceInput, 10);
    const capacity = parseInt(capacityInput, 10);
    if (Number.isNaN(priceBaht) || Number.isNaN(capacity)) {
      toast.error("Price and capacity must be numbers.");
      return;
    }
    await patch({ priceSatang: priceBaht * 100, capacity });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-4 inline-flex rounded-lg border border-white/10 bg-neutral-950 p-1">
          {([1, 2] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFloor(f)}
              className={`rounded-md px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] transition-colors ${
                floor === f ? "bg-orange-500 text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              Floor {f}
            </button>
          ))}
        </div>

        <FloorPlanMap
          floor={floor}
          tables={floorTables}
          allTables={tables}
          selectedKeys={selectedKeys}
          onSelect={selectTable}
          onSwitchFloor={setFloor}
          selectableWhenBooked
        />

        <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-white/30 bg-white/10" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-neutral-600 bg-neutral-700" />
            Booked
          </span>
        </div>
      </div>

      <aside className="rounded-lg border border-white/10 bg-neutral-950 p-5">
        {!selected ? (
          <p className="text-sm text-neutral-500">Click a table on the floor plan to edit it.</p>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading text-2xl font-bold text-white">{selected.label}</p>
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] ${TIER_BADGE_CLASS[selected.tier]}`}
                >
                  {selected.tier}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Currently {selected.isBooked ? "booked" : "available"} · {selected.isLocked ? "LOCKED" : "unlocked"}
              </p>
            </div>

            {selected.isBooked && selected.bookingItemId ? (
              <TableRoster
                bookingItemId={selected.bookingItemId}
                capacity={selected.capacity}
                paidStatus={selected.paidStatus ?? "PAID"}
                tickets={selected.tickets}
              />
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Price (THB)
                  </Label>
                  <Input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="border-white/10 bg-black/60"
                  />
                  <p className="font-mono text-[10px] text-neutral-500">
                    Current: {formatSatang(selected.priceSatang)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Capacity
                  </Label>
                  <Input
                    type="number"
                    value={capacityInput}
                    onChange={(e) => setCapacityInput(e.target.value)}
                    className="border-white/10 bg-black/60"
                  />
                  <p className="font-mono text-[10px] text-neutral-500">
                    Current: {selected.capacity} seats
                  </p>
                </div>

                <Button
                  onClick={saveEdit}
                  disabled={busy}
                  className="w-full font-mono text-xs uppercase tracking-[0.15em]"
                >
                  {busy ? "Saving…" : "Save changes"}
                </Button>
              </>
            )}

            <div className="border-t border-white/10 pt-4">
              <Button
                variant="outline"
                onClick={() => patch({ isLocked: !selected.isLocked })}
                disabled={busy}
                className={`w-full font-mono text-xs uppercase tracking-[0.15em] ${
                  selected.isLocked
                    ? "border-emerald-400/40 text-emerald-400"
                    : "border-amber-400/40 text-amber-400"
                }`}
              >
                {selected.isLocked ? "Unlock table" : "Lock table"}
              </Button>
              <p className="mt-2 font-mono text-[10px] text-neutral-500">
                A locked table cannot be reserved by new bookings. Existing bookings are unaffected.
              </p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
