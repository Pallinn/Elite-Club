"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { formatSatang } from "@/lib/money";
import { OrderSummary } from "@/components/booking/order-summary";
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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { reserve, loading } = useReserve();

  const floorTables = tables.filter((t) => t.floor === floor);
  const selected = tables.find((t) => t.key === selectedKey) ?? null;

  function handleSelect(table: FloorTable) {
    setSelectedKey(table.key);
  }

  async function onContinue() {
    if (!selected) return;
    await reserve([{ zoneId: selected.zoneId, tableId: selected.tableId, quantity: 1 }]);
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
        Choose your table
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
            selectedKey={selectedKey}
            onSelect={handleSelect}
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

          {selected && (
            <div className="mt-6 rounded-lg border border-primary bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading text-base font-bold uppercase text-white">
                    {selected.label}
                  </p>
                  <p className="text-sm text-neutral-400">Seats up to {selected.capacity}</p>
                </div>
                <p className="font-heading text-xl font-bold text-primary">
                  {formatSatang(selected.priceSatang)}
                </p>
              </div>
            </div>
          )}

          <Button
            size="lg"
            disabled={!selected || loading}
            onClick={onContinue}
            className="mt-6 font-mono text-sm uppercase tracking-[0.2em]"
          >
            {loading ? "Reserving..." : "Continue to details →"}
          </Button>
        </div>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <OrderSummary
            eventName={eventName}
            venueName={venueName}
            startAt={new Date(startAt)}
            items={selected ? [{ label: selected.label, amountSatang: selected.priceSatang }] : []}
            totalSatang={selected?.priceSatang}
          />
        </aside>
      </div>
    </div>
  );
}
