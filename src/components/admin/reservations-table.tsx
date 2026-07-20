"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { formatSatang } from "@/lib/money";

export type ReservationRow = {
  id: string; // BookingItem id
  bookingId: string;
  tier: "VVIP" | "Normal";
  zoneName: string;
  tableLabel: string;
  tableSortKey: number;
  buyerName: string;
  buyerEmail: string;
  joinCode: string | null;
  ticketCount: number;
  capacity: number;
  paidStatus: "PAID" | "HOLD" | "EXPIRED" | "CANCELLED" | "FAILED";
  totalSatang: number;
  createdAt: string;
};

const TIER_ORDER: Record<ReservationRow["tier"], number> = { VVIP: 0, Normal: 1 };
const STATUS_TINT: Record<ReservationRow["paidStatus"], string> = {
  PAID: "text-emerald-400 border-emerald-400/40",
  HOLD: "text-amber-400 border-amber-400/40",
  EXPIRED: "text-neutral-500 border-neutral-600",
  CANCELLED: "text-neutral-500 border-neutral-600",
  FAILED: "text-red-400 border-red-400/40",
};

export function ReservationsTable({ rows }: { rows: ReservationRow[] }) {
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<"ALL" | "VVIP" | "Normal">("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (tierFilter === "ALL" ? true : r.tier === tierFilter))
      .filter((r) => {
        if (!q) return true;
        return (
          r.buyerEmail.toLowerCase().includes(q) ||
          r.buyerName.toLowerCase().includes(q) ||
          (r.joinCode && r.joinCode.toLowerCase().includes(q)) ||
          r.tableLabel.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.tier !== b.tier) return TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
        return a.tableSortKey - b.tableSortKey;
      });
  }, [rows, query, tierFilter]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search email, table code, name, or table label…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md border-white/10 bg-neutral-950"
        />
        <div className="inline-flex rounded-md border border-white/10 bg-neutral-950 p-1">
          {(["ALL", "VVIP", "Normal"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`rounded px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors ${
                tierFilter === t ? "bg-orange-500 text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="ml-auto font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
          {filtered.length} of {rows.length} rows
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-neutral-950 text-left">
            <tr className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Table</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Seats</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3">
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] ${
                      r.tier === "VVIP" ? "border-orange-500/50 text-orange-500" : "border-amber-300/40 text-amber-300"
                    }`}
                  >
                    {r.tier}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-white">
                  <Link href={`/admin/reservations/${r.id}`} className="hover:underline">
                    {r.tableLabel}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p className="text-white">{r.buyerName}</p>
                  <p className="text-xs text-neutral-500">{r.buyerEmail}</p>
                </td>
                <td className="px-4 py-3 font-mono text-orange-500">
                  {r.joinCode ?? "—"}
                </td>
                <td className="px-4 py-3 text-neutral-300">
                  {r.ticketCount} / {r.capacity}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] ${STATUS_TINT[r.paidStatus]}`}
                  >
                    {r.paidStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-white">
                  {formatSatang(r.totalSatang)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-neutral-500">
                  No reservations match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
