"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PaymentPanel({
  bookingId,
}: {
  bookingId: string;
  totalSatang: number;
}) {
  const router = useRouter();
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  async function payWithPromptPay() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, method: "PROMPTPAY" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't start payment.");
        return;
      }
      setQrImageUrl(data.qrImageUrl);
    } finally {
      setLoading(false);
    }
  }

  async function markPaidForTesting() {
    setTestLoading(true);
    try {
      const res = await fetch("/api/checkout/test-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't mark this as paid.");
        return;
      }
      toast.success("Marked as paid (test only).");
      router.refresh();
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <div>
      {qrImageUrl ? (
        <div className="space-y-3 rounded-lg border border-white/10 bg-neutral-950 p-6 text-center">
          <p className="text-sm text-neutral-300">Scan with your banking app to pay</p>
          <Image
            src={qrImageUrl}
            alt="PromptPay QR code"
            width={240}
            height={240}
            className="mx-auto rounded bg-white p-2"
            unoptimized
          />
          <p className="font-mono text-xs text-neutral-500">
            This page updates automatically once payment is received.
          </p>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-white/10 bg-neutral-950 p-6">
          <p className="text-sm text-neutral-400">
            Generate a QR code and pay from any Thai banking app.
          </p>
          <Button
            onClick={payWithPromptPay}
            disabled={loading}
            className="w-full font-mono text-xs uppercase tracking-[0.15em]"
          >
            {loading ? "Generating QR..." : "Show PromptPay QR"}
          </Button>
        </div>
      )}

      {process.env.NODE_ENV !== "production" && (
        <div className="mt-4 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-amber-400">
            Dev only
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Skip Omise entirely and pretend this booking was just paid.
          </p>
          <Button
            variant="outline"
            onClick={markPaidForTesting}
            disabled={testLoading}
            className="mt-3 w-full border-amber-500/40 font-mono text-xs uppercase tracking-[0.15em] text-amber-400"
          >
            {testLoading ? "Marking paid..." : "Mark as paid (test)"}
          </Button>
        </div>
      )}
    </div>
  );
}
