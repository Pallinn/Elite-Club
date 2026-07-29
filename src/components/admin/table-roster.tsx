"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DoubleConfirmDialog } from "@/components/admin/double-confirm-dialog";

export type RosterTicket = {
  id: string;
  ticketNumber: string;
  status: "VALID" | "USED" | "VOID";
  isBuyer: boolean;
  holder: { name: string | null; email: string | null } | null;
};

/**
 * Shared "who's on this table" view: list guests, remove one, or grant a
 * comp ticket by email (server verifies the account exists). Used on both
 * the reservation detail page and the Tables floor-plan manager so the two
 * surfaces stay in sync instead of drifting apart. Add/remove both require
 * two-step confirmation since they immediately affect a real guest's entry.
 */
export function TableRoster({
  bookingItemId,
  capacity,
  paidStatus,
  tickets,
}: {
  bookingItemId: string;
  capacity: number;
  paidStatus: "PAID" | "HOLD" | "EXPIRED" | "CANCELLED" | "FAILED" | "REFUNDED";
  tickets: RosterTicket[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState("");
  const [confirmVoidId, setConfirmVoidId] = useState<string | null>(null);
  const [confirmAdd, setConfirmAdd] = useState(false);

  const activeTickets = tickets.filter((t) => t.status !== "VOID");
  const voidTarget = tickets.find((t) => t.id === confirmVoidId) ?? null;

  async function voidTicket(ticketId: string) {
    setBusy(ticketId);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/void`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Failed to remove.");
        return;
      }
      toast.success("Removed from table.");
      setConfirmVoidId(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function addPerson() {
    if (!addEmail) return;
    setBusy("add");
    try {
      const res = await fetch(`/api/admin/booking-items/${bookingItemId}/comp-add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Failed to add.");
        return;
      }
      toast.success("Ticket granted.");
      setAddEmail("");
      setConfirmAdd(false);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500">
          People on this table
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
          {activeTickets.length} / {capacity}
        </p>
      </div>
      <ul className="space-y-2">
        {tickets.map((t) => (
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
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] ${
                    t.status === "VALID"
                      ? "border-emerald-400/40 text-emerald-400"
                      : t.status === "USED"
                        ? "border-neutral-400/40 text-neutral-300"
                        : "border-neutral-600 text-neutral-500 line-through"
                  }`}
                >
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {t.holder?.email} · {t.ticketNumber}
              </p>
            </div>
            {t.status !== "VOID" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmVoidId(t.id)}
                disabled={busy === t.id}
                className="border-red-400/40 font-mono text-[10px] uppercase tracking-[0.15em] text-red-400 hover:bg-red-400/10"
              >
                {busy === t.id ? "…" : "Remove"}
              </Button>
            )}
          </li>
        ))}
        {tickets.length === 0 && (
          <li className="rounded border border-dashed border-white/10 px-4 py-6 text-center text-sm text-neutral-500">
            No tickets minted yet.
          </li>
        )}
      </ul>

      {paidStatus === "PAID" && activeTickets.length < capacity && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
            Add a person (comp)
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Grant a ticket to any existing user&apos;s email. They must already have a No Signal
            account.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="user@example.com"
              className="border-white/10 bg-black/60"
            />
            <Button
              onClick={() => setConfirmAdd(true)}
              disabled={busy === "add" || !addEmail}
              className="shrink-0 font-mono text-xs uppercase tracking-[0.15em]"
            >
              {busy === "add" ? "Adding…" : "Add"}
            </Button>
          </div>
        </div>
      )}

      <DoubleConfirmDialog
        open={confirmVoidId !== null}
        onOpenChange={(o) => !o && setConfirmVoidId(null)}
        title="Remove this person from the table?"
        description={`${voidTarget?.holder?.name || voidTarget?.holder?.email || "This guest"} will lose access — their ticket will no longer scan at the door.`}
        confirmLabel="Remove"
        danger
        busy={busy === confirmVoidId}
        onConfirm={() => confirmVoidId && voidTicket(confirmVoidId)}
      />

      <DoubleConfirmDialog
        open={confirmAdd}
        onOpenChange={setConfirmAdd}
        title="Grant a ticket to this email?"
        description={`${addEmail} will get a ticket on this table if they already have a No Signal account. If they don't, this will fail.`}
        confirmLabel="Add person"
        busy={busy === "add"}
        onConfirm={addPerson}
      />
    </div>
  );
}
