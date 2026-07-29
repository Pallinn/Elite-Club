"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIER_BADGE_CLASS, type Tier } from "@/lib/tiers";

type RosterEntry = {
  id: string;
  ticketNumber: string;
  status: "VALID" | "USED" | "VOID";
  isBuyer: boolean;
  holder: { name: string | null; email: string | null } | null;
  usedAt: string | null;
};

type TableLookup = {
  joinCode: string | null;
  tableLabel: string;
  tier: Tier;
  capacity: number;
  contactName: string;
  tickets: RosterEntry[];
};

export function TableCodeCheckin() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TableLookup[] | null>(null);
  const [table, setTable] = useState<TableLookup | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [checkedInCount, setCheckedInCount] = useState(0);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setTable(null);
    setResults(null);
    try {
      const res = await fetch(`/api/admin/checkin/search?q=${encodeURIComponent(query.trim())}`);
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Nothing found.");
        return;
      }
      const found: TableLookup[] = j.results;
      if (found.length === 1) {
        setTable(found[0]);
      } else {
        setResults(found);
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function checkIn(ticket: RosterEntry) {
    setCheckingInId(ticket.id);
    try {
      const res = await fetch(`/api/admin/checkin/${ticket.id}`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Failed to check in.");
        return;
      }
      toast.success(`${ticket.holder?.name || ticket.holder?.email || "Guest"} checked in.`);
      setCheckedInCount((c) => c + 1);
      setTable((prev) =>
        prev
          ? {
              ...prev,
              tickets: prev.tickets.map((t) =>
                t.id === ticket.id ? { ...t, status: "USED", usedAt: new Date().toISOString() } : t
              ),
            }
          : prev
      );
    } finally {
      setCheckingInId(null);
    }
  }

  return (
    <div className="space-y-6">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500">
        Checked in this session: {checkedInCount}
      </p>

      <form onSubmit={search} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, table number, or table code"
          className="border-white/10 bg-neutral-950"
          autoFocus
        />
        <Button type="submit" disabled={loading || !query.trim()} className="shrink-0 font-mono text-xs uppercase tracking-[0.15em]">
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      {results && results.length > 1 && (
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
            {results.length} tables match — pick one
          </p>
          {results.map((r) => (
            <button
              key={r.joinCode ?? r.tableLabel}
              onClick={() => {
                setTable(r);
                setResults(null);
              }}
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-neutral-950 p-3 text-left text-sm hover:border-white/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-white">{r.tableLabel}</span>
                <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] ${TIER_BADGE_CLASS[r.tier]}`}>
                  {r.tier}
                </span>
              </div>
              <span className="text-neutral-500">{r.contactName}</span>
            </button>
          ))}
        </div>
      )}

      {table && (
        <div className="rounded-lg border border-white/10 bg-neutral-950 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-2xl font-bold text-white">{table.tableLabel}</h2>
              <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] ${TIER_BADGE_CLASS[table.tier]}`}>
                {table.tier}
              </span>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              {table.tickets.filter((t) => t.status === "USED").length} / {table.tickets.filter((t) => t.status !== "VOID").length} arrived
            </p>
          </div>
          <p className="mt-1 text-xs text-neutral-500">Booked by {table.contactName}</p>

          <ul className="mt-4 space-y-2">
            {table.tickets.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-white/5 bg-black/40 px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white">{t.holder?.name || t.holder?.email || "Unknown"}</p>
                    {t.isBuyer && (
                      <span className="rounded border border-orange-500/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-orange-500">
                        Buyer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">{t.holder?.email} · {t.ticketNumber}</p>
                </div>

                {t.status === "USED" ? (
                  <span className="rounded border border-emerald-400/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-emerald-400">
                    Checked in
                  </span>
                ) : t.status === "VOID" ? (
                  <span className="rounded border border-neutral-600 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500 line-through">
                    Removed
                  </span>
                ) : (
                  <Button
                    onClick={() => checkIn(t)}
                    disabled={checkingInId === t.id}
                    className="font-mono text-xs uppercase tracking-[0.15em]"
                  >
                    {checkingInId === t.id ? "Checking in…" : "Check in"}
                  </Button>
                )}
              </li>
            ))}
            {table.tickets.length === 0 && (
              <li className="rounded border border-dashed border-white/10 px-4 py-6 text-center text-sm text-neutral-500">
                No tickets on this table yet.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
