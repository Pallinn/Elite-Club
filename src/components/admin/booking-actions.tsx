"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DoubleConfirmDialog } from "@/components/admin/double-confirm-dialog";
import { formatSatang } from "@/lib/money";

export function AdminBookingActions({
  bookingId,
  status,
  contactName,
  totalSatang,
  itemLabels,
}: {
  bookingId: string;
  status: "HOLD" | "PAID" | "EXPIRED" | "CANCELLED" | "FAILED" | "REFUNDED";
  contactName: string;
  totalSatang: number;
  itemLabels: string[];
}) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  async function cancelHold() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't cancel this hold.");
        return;
      }
      toast.success("Hold cancelled — the table/zone slot is free again.");
      router.refresh();
    } finally {
      setCancelling(false);
    }
  }

  async function refund() {
    setRefunding(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/refund`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't refund this booking.");
        return;
      }
      toast.success("Booking refunded — table freed and tickets voided.");
      setRefundOpen(false);
      router.refresh();
    } finally {
      setRefunding(false);
    }
  }

  if (status === "HOLD") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-red-500/40 text-red-400 hover:bg-red-500/10"
        onClick={cancelHold}
        disabled={cancelling}
      >
        {cancelling ? "Cancelling..." : "Cancel hold"}
      </Button>
    );
  }

  if (status === "PAID") {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className="border-red-500/40 text-red-400 hover:bg-red-500/10"
          onClick={() => setRefundOpen(true)}
        >
          Refund
        </Button>
        <DoubleConfirmDialog
          open={refundOpen}
          onOpenChange={setRefundOpen}
          title="Refund this booking?"
          description={`${contactName} — ${formatSatang(totalSatang)} — ${itemLabels.join(", ")}. This immediately frees the table/zone for resale and voids every ticket on this booking.`}
          confirmLabel="Yes, refund"
          danger
          busy={refunding}
          onConfirm={refund}
        />
      </>
    );
  }

  return null;
}
