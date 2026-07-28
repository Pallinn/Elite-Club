"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "@/components/booking/order-summary";
import { tableProvisions } from "@/lib/table-provisions";
import { useReserve } from "@/components/booking/use-reserve";
import { FloorPlanMap, type FloorTable } from "@/components/booking/floor-plan-map";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function FloorPlanBooking({
  eventId,
  eventName,
  venueName,
  startAt,
  tables: initialTables,
}: {
  eventId: string;
  eventName: string;
  venueName: string | null;
  startAt: string;
  tables: FloorTable[];
}) {
  const { data } = useSWR(`/api/availability?eventId=${eventId}`, fetcher, {
    refreshInterval: 5000,
  });

  const tables = useMemo<FloorTable[]>(() => {
    if (!data?.zones) return initialTables;
    const bookedTableIds = new Set<string>();
    for (const zone of data.zones) {
      for (const table of zone.tables ?? []) {
        if (table.isBooked) bookedTableIds.add(table.id);
      }
    }
    return initialTables.map((t) => ({ ...t, isBooked: bookedTableIds.has(t.tableId) }));
  }, [data, initialTables]);

  const [floor, setFloor] = useState<1 | 2>(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const { reserve, loading } = useReserve();

  const floorTables = tables.filter((t) => t.floor === floor);
  const selectedTables = tables.filter((t) => selectedKeys.has(t.key));
  const totalSatang = selectedTables.reduce((sum, t) => sum + t.priceSatang, 0);

  // Only one table can be booked per order - picking a new table replaces
  // whatever was previously selected instead of adding to it.
  function handleSelect(table: FloorTable) {
    setSelectedKeys((prev) => (prev.has(table.key) ? new Set() : new Set([table.key])));
  }

  async function onContinue() {
    if (selectedTables.length === 0) return;
    await reserve(
      selectedTables.map((t) => ({ zoneId: t.zoneId, tableId: t.tableId, quantity: 1 }))
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
        Choose your tables
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-4 inline-flex rounded-lg border border-white/10 bg-neutral-950 p-1">
            {([1, 2] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFloor(f)}
                className={`rounded-md px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] transition-colors ${
                  floor === f
                    ? "bg-primary text-primary-foreground"
                    : "text-neutral-400 hover:text-white"
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
            onSelect={handleSelect}
            onSwitchFloor={setFloor}
          />

          <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-white/30 bg-white/10" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-primary/70 bg-primary/25" />
              Premium
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-neutral-600 bg-neutral-700" />
              Sold out
            </span>
          </div>

        </div>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <OrderSummary
            eventName={eventName}
            items={selectedTables.map((t) => ({ label: t.label, amountSatang: t.priceSatang }))}
            totalSatang={selectedTables.length > 0 ? totalSatang : undefined}
            provisions={
              selectedTables.length === 1 ? tableProvisions(selectedTables[0].label) : undefined
            }
            footer={
              <Button
                size="lg"
                disabled={selectedTables.length === 0 || loading}
                onClick={onContinue}
                className="w-full font-mono text-sm uppercase tracking-[0.2em]"
              >
                {loading
                  ? "Reserving..."
                  : `Continue to details${selectedTables.length > 1 ? ` (${selectedTables.length} tables)` : ""} →`}
              </Button>
            }
          />
        </aside>
      </div>
    </div>
  );
}
