"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DoubleConfirmDialog } from "@/components/admin/double-confirm-dialog";
import { formatSatang } from "@/lib/money";
import { toast } from "sonner";
import { TableRoster, type RosterTicket } from "@/components/admin/table-roster";
import type { Tier } from "@/lib/tiers";

export type ReservationDetailData = {
  bookingItemId: string;
  bookingId: string;
  tier: Tier;
  tableLabel: string;
  capacity: number;
  totalSatang: number;
  joinCode: string | null;
  paidStatus: "PAID" | "HOLD" | "EXPIRED" | "CANCELLED" | "FAILED" | "REFUNDED";
  buyer: { name: string; email: string };
  tickets: RosterTicket[];
  payments: Array<{
    id: string;
    status: string;
    method: string;
    amountSatang: number;
    createdAt: string;
    slipTransRef: string | null;
  }>;
};

export function ReservationDetail({ data }: { data: ReservationDetailData }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);

  async function refund() {
    setBusy("refund");
    try {
      const res = await fetch(`/api/admin/bookings/${data.bookingId}/refund`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) return toast.error(j.error ?? "Failed to refund.");
      toast.success("Booking refunded — table freed and tickets voided.");
      setRefundOpen(false);
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
                    : data.paidStatus === "REFUNDED"
                      ? "border-red-400/40 text-red-400"
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

        {data.paidStatus === "PAID" && (
          <>
            <Button
              variant="outline"
              onClick={() => setRefundOpen(true)}
              className="mt-6 border-red-500/40 font-mono text-xs uppercase tracking-[0.15em] text-red-400 hover:bg-red-500/10"
            >
              Refund
            </Button>
            <DoubleConfirmDialog
              open={refundOpen}
              onOpenChange={setRefundOpen}
              title="Refund this table?"
              description={`${data.buyer.name} — ${data.tableLabel} — ${formatSatang(data.totalSatang)}. This immediately frees the table for resale and voids every ticket on it.`}
              confirmLabel="Yes, refund"
              danger
              busy={busy === "refund"}
              onConfirm={refund}
            />
          </>
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
              <li key={p.id} className="border-t border-white/5 pt-2 first:border-0 first:pt-0">
                <div className="flex justify-between">
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
                </div>
                {p.slipTransRef && (
                  <p className="mt-0.5 font-mono text-xs text-neutral-500">
                    Tracking no. {p.slipTransRef}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* People on this table */}
      <div className="rounded-lg border border-white/10 bg-neutral-950 p-6">
        <TableRoster
          bookingItemId={data.bookingItemId}
          capacity={data.capacity}
          paidStatus={data.paidStatus}
          tickets={data.tickets}
        />
      </div>
    </div>
  );
}
