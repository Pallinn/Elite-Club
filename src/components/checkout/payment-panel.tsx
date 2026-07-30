"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatSatang(satang: number) {
  return `฿${(satang / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PaymentPanel({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [expectedAmountSatang, setExpectedAmountSatang] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function generateQr() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't generate a PromptPay QR.");
        return;
      }
      setQrDataUrl(data.qrDataUrl);
      setExpectedAmountSatang(data.expectedAmountSatang);
    } finally {
      setLoading(false);
    }
  }

  async function verifySlip() {
    if (!file) {
      toast.error("Choose your slip image first.");
      return;
    }
    setVerifying(true);
    try {
      const form = new FormData();
      form.append("bookingId", bookingId);
      form.append("file", file);
      const res = await fetch("/api/checkout/verify-slip", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't verify this slip.");
        return;
      }
      toast.success("Payment verified!");
      router.refresh();
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div>
      {qrDataUrl ? (
        <div className="space-y-4 rounded-lg border border-white/10 bg-neutral-950 p-6 text-center">
          <p className="text-sm text-neutral-300">Scan with your banking app to pay</p>
          <Image
            src={qrDataUrl}
            alt="PromptPay QR code"
            width={240}
            height={240}
            className="mx-auto rounded bg-white p-2"
            unoptimized
          />
          {expectedAmountSatang !== null && (
            <p className="font-mono text-sm text-white">
              Pay exactly {formatSatang(expectedAmountSatang)}
            </p>
          )}
          <p className="font-mono text-[11px] text-neutral-500">
            The amount includes a few extra satang so we can match your payment automatically —
            pay the exact figure shown above.
          </p>

          <div className="space-y-2 border-t border-white/10 pt-4 text-left">
            <p className="text-sm text-neutral-300">Then upload your payment slip to confirm</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-neutral-400 file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white"
            />
            <Button
              onClick={verifySlip}
              disabled={verifying || !file}
              className="w-full font-mono text-xs uppercase tracking-[0.15em]"
            >
              {verifying ? "Verifying..." : "Verify payment"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-white/10 bg-neutral-950 p-6">
          <p className="text-sm text-neutral-400">
            Generate a QR code and pay from any Thai banking app.
          </p>
          <Button
            onClick={generateQr}
            disabled={loading}
            className="w-full font-mono text-xs uppercase tracking-[0.15em]"
          >
            {loading ? "Generating QR..." : "Show PromptPay QR"}
          </Button>
        </div>
      )}
    </div>
  );
}
