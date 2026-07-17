"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

declare global {
  interface Window {
    Omise?: {
      setPublicKey: (key: string) => void;
      createToken: (
        type: "card",
        card: Record<string, string>,
        callback: (statusCode: number, response: { id?: string; message?: string }) => void
      ) => void;
    };
  }
}

let omiseScriptPromise: Promise<void> | null = null;
function loadOmiseScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Omise) return Promise.resolve();
  if (!omiseScriptPromise) {
    omiseScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.omise.co/omise.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load payment script."));
      document.head.appendChild(script);
    });
  }
  return omiseScriptPromise;
}

export function PaymentPanel({
  bookingId,
  totalSatang,
}: {
  bookingId: string;
  totalSatang: number;
}) {
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState({ name: "", number: "", expMonth: "", expYear: "", cvc: "" });

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

  async function payWithCard(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await loadOmiseScript();
      const publicKey = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY;
      if (!publicKey || !window.Omise) {
        toast.error("Card payments aren't configured yet.");
        return;
      }
      window.Omise.setPublicKey(publicKey);

      window.Omise.createToken(
        "card",
        {
          name: card.name,
          number: card.number.replace(/\s+/g, ""),
          expiration_month: card.expMonth,
          expiration_year: card.expYear,
          security_code: card.cvc,
        },
        async (_status, response) => {
          if (!response.id) {
            toast.error(response.message ?? "Card was declined.");
            setLoading(false);
            return;
          }

          const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, method: "CARD", cardToken: response.id }),
          });
          const data = await res.json();
          setLoading(false);

          if (!res.ok) {
            toast.error(data.error ?? "Payment failed.");
            return;
          }
          if (data.authorizeUri) {
            window.location.href = data.authorizeUri;
          } else {
            toast.success("Processing payment...");
          }
        }
      );
    } catch {
      toast.error("Couldn't reach the payment provider.");
      setLoading(false);
    }
  }

  const labelClass = "font-mono text-xs uppercase tracking-[0.15em] text-neutral-400";
  const inputClass = "border-white/10 bg-neutral-950";

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
        <Tabs defaultValue="promptpay">
          <TabsList variant="line" className="w-full border-b border-white/10 p-0">
            <TabsTrigger
              value="promptpay"
              className="flex-1 font-mono text-xs uppercase tracking-[0.15em] data-active:text-primary"
            >
              PromptPay
            </TabsTrigger>
            <TabsTrigger
              value="card"
              className="flex-1 font-mono text-xs uppercase tracking-[0.15em] data-active:text-primary"
            >
              Card
            </TabsTrigger>
          </TabsList>
          <TabsContent value="promptpay" className="space-y-3 pt-4">
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
          </TabsContent>
          <TabsContent value="card" className="pt-4">
            <form onSubmit={payWithCard} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber" className={labelClass}>
                  Card number
                </Label>
                <Input
                  id="cardNumber"
                  required
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  className={inputClass}
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expMonth" className={labelClass}>
                    Expiry
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="expMonth"
                      required
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="MM"
                      className={inputClass}
                      value={card.expMonth}
                      onChange={(e) => setCard({ ...card, expMonth: e.target.value })}
                    />
                    <Input
                      required
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="YYYY"
                      className={inputClass}
                      value={card.expYear}
                      onChange={(e) => setCard({ ...card, expYear: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc" className={labelClass}>
                    CVV
                  </Label>
                  <Input
                    id="cvc"
                    required
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="•••"
                    className={inputClass}
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardName" className={labelClass}>
                  Cardholder name
                </Label>
                <Input
                  id="cardName"
                  required
                  placeholder="Name on card"
                  className={inputClass}
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-mono text-xs uppercase tracking-[0.15em]"
              >
                {loading
                  ? "Processing..."
                  : `Confirm & pay ${(totalSatang / 100).toLocaleString()} THB`}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
