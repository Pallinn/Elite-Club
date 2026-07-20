"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatSatang } from "@/lib/money";
import { toast } from "sonner";

export type ReservationDetailData = {
  bookingItemId: string;
  bookingId: string;
  tier: "VVIP" | "Normal";
  tableLabel: string;
  capacity: number;
  totalSatang: number;
  joinCode: string | null;
  paidStatus: "PAID" | "HOLD" | "EXPIRED" | "CANCELLED" | "FAILED";
  buyer: { name: string; email: string };
  tickets: Array<{
    id: string;
    ticketNumber: string;
    status: "VALID" | "USED" | "VOID";
    isBuyer: boolean;
    holder: { name: string | null; email: string | null } | null;
  }>;
  payments: Array<{
    id: string;
    status: string;
    method: string;
    amountSatang: number;
    createdAt: string;
  }>;
};

export function ReservationDetail({ data }: { data: ReservationDetailData }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState("");

  async function voidTicket(ticketId: string) {
    if (!confirm("Void this ticket? The holder will no longer be able to check in.")) return;
    setBusy(ticketId);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/void`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) return toast.error(j.error ?? "Failed to void.");
      toast.success("Ticket voided.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function addPerson() {
    if (!addEmail) return;
    setBusy("add");
    try {
      const res = await fetch(`/api/admin/booking-items/${data.bookingItemId}/comp-add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail }),
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.error ?? "Failed to add.");
      toast.success("Ticket granted.");
      setAddEmail("");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function verifyPayment() {
    if (!confirm("Mark this booking as paid and mint tickets? Use only if payment arrived offline.")) return;
    setBusy("verify");
    try {
      const res = await fetch(`/api/admin/bookings/${data.bookingId}/verify-payment`, {
        method: "POST",
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.error ?? "Failed to verify.");
      toast.success("Booking marked as paid.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const activeTickets = data.tickets.filter((t) => t.status !== "VOID");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-neutral-950 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              {data.tier}
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-white">{data.tableLabel}</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {activeTickets.length} of {data.capacity} seats claimed
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading text-2xl font-bold text-orange-500">
              {formatSatang(data.totalSatang)}
            </p>
            <span
              className={`mt-1 inline-block rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] ${
                data.paidStatus === "PAID"
                  ? "border-emerald-400/40 text-emerald-400"
                  : data.paidStatus === "HOLD"
                    ? "border-amber-400/40 text-amber-400"
                    : "border-neutral-600 text-neutral-500"
              }`}
            >
              {data.paidStatus}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              Buyer
            </p>
            <p className="mt-1 text-white">{data.buyer.name}</p>
            <p className="text-sm text-neutral-400">{data.buyer.email}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              Invite code
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-orange-500">
              {data.joinCode ?? "—"}
            </p>
          </div>
        </div>

        {data.paidStatus === "HOLD" && (
          <Button
            onClick={verifyPayment}
            disabled={busy === "verify"}
            className="mt-6 font-mono text-xs uppercase tracking-[0.15em]"
          >
            {busy === "verify" ? "Verifying…" : "Verify payment (mark paid)"}
          </Button>
        )}
      </div>

      {/* Payments */}
      {data.payments.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-neutral-950 p-6">
          <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-neutral-500">
            Payments
          </h3>
          <ul className="space-y-2 text-sm">
            {data.payments.map((p) => (
              <li key={p.id} className="flex justify-between border-t border-white/5 pt-2 first:border-0 first:pt-0">
                <span className="text-neutral-400">
                  {p.method} — {new Date(p.createdAt).toLocaleString()}
                </span>
                <span
                  className={
                    p.status === "SUCCEEDED"
                      ? "text-emerald-400"
                      : p.status === "FAILED"
                        ? "text-red-400"
                        : "text-amber-400"
                  }
                >
                  {p.status}
                </span>
                <span className="text-white">{formatSatang(p.amountSatang)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* People on this table */}
      <div className="rounded-lg border border-white/10 bg-neutral-950 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500">
            People on this table
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
            {activeTickets.length} / {data.capacity}
          </p>
        </div>
        <ul className="space-y-2">
          {data.tickets.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-white/5 bg-black/40 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white">
                    {t.holder?.name || t.holder?.email || "Unknown"}
                  </p>
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
                  onClick={() => voidTicket(t.id)}
                  disabled={busy === t.id}
                  className="border-red-400/40 font-mono text-[10px] uppercase tracking-[0.15em] text-red-400 hover:bg-red-400/10"
                >
                  {busy === t.id ? "…" : "Void"}
                </Button>
              )}
            </li>
          ))}
          {data.tickets.length === 0 && (
            <li className="rounded border border-dashed border-white/10 px-4 py-6 text-center text-sm text-neutral-500">
              No tickets minted yet.
            </li>
          )}
        </ul>

        {data.paidStatus === "PAID" && activeTickets.length < data.capacity && (
          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              Add a person (comp)
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Grant a ticket to any existing user's email. They must already have a No Signal account.
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
                onClick={addPerson}
                disabled={busy === "add" || !addEmail}
                className="shrink-0 font-mono text-xs uppercase tracking-[0.15em]"
              >
                {busy === "add" ? "Adding…" : "Add"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
