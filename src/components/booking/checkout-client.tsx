"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingShell } from "@/components/booking/booking-shell";
import { OrderSummary } from "@/components/booking/order-summary";
import { HoldTimer } from "@/components/booking/hold-timer";
import { PaymentPanel } from "@/components/checkout/payment-panel";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type BookingItem = {
  id: string;
  quantity: number;
  subtotalSatang: number;
  zone: { name: string };
  table: { label: string } | null;
};

type Booking = {
  id: string;
  status: "HOLD" | "PAID" | "EXPIRED" | "CANCELLED" | "FAILED";
  holdExpiresAt: string | null;
  totalSatang: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  items: BookingItem[];
  event: { name: string };
};

export function CheckoutClient({ booking: initial }: { booking: Booking }) {
  const router = useRouter();
  const { data: booking, mutate } = useSWR<Booking>(
    `/api/bookings/${initial.id}`,
    fetcher,
    { fallbackData: initial, refreshInterval: 3000 }
  );

  const [subStep, setSubStep] = useState<"details" | "payment">("details");
  const [contact, setContact] = useState({
    contactName: initial.contactName,
    contactEmail: initial.contactEmail,
    contactPhone: initial.contactPhone ?? "",
  });
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    if (booking?.status === "PAID") {
      router.push(`/account/bookings/${booking.id}`);
    }
  }, [booking?.status, booking?.id, router]);

  if (!booking) return null;

  const summaryItems = booking.items.map((item) => ({
    label: item.table ? item.table.label : `${item.zone.name} x${item.quantity}`,
    amountSatang: item.subtotalSatang,
  }));

  if (booking.status === "EXPIRED" || booking.status === "CANCELLED") {
    return (
      <BookingShell step="details" backHref="/book">
        <div className="mx-auto max-w-lg rounded-lg border border-white/10 bg-neutral-950 p-8 text-center">
          <p className="font-heading text-lg font-bold text-white">
            This reservation has expired.
          </p>
          <Button className="mt-4" onClick={() => router.push("/book")}>
            Back to tickets
          </Button>
        </div>
      </BookingShell>
    );
  }

  async function saveContactAndContinue() {
    setSavingContact(true);
    const res = await fetch(`/api/bookings/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
    setSavingContact(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Couldn't save contact details.");
      return;
    }
    mutate();
    setSubStep("payment");
  }

  return (
    <BookingShell step={subStep} backHref="/book">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {booking.holdExpiresAt && (
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-neutral-400">
              Reserved for{" "}
              <HoldTimer expiresAt={booking.holdExpiresAt} onExpire={() => mutate()} />
            </p>
          )}

          {subStep === "details" ? (
            <div>
              <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
                Attendee details
              </h1>
              <div className="mt-6 max-w-md space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-400">
                    Full name
                  </Label>
                  <Input
                    id="contactName"
                    className="border-white/10 bg-neutral-950"
                    value={contact.contactName}
                    onChange={(e) => setContact({ ...contact, contactName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-400">
                    Email address
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    className="border-white/10 bg-neutral-950"
                    value={contact.contactEmail}
                    onChange={(e) => setContact({ ...contact, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-400">
                    Phone (optional)
                  </Label>
                  <Input
                    id="contactPhone"
                    className="border-white/10 bg-neutral-950"
                    value={contact.contactPhone}
                    onChange={(e) => setContact({ ...contact, contactPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <Button
                  variant="outline"
                  className="font-mono text-xs uppercase tracking-[0.15em]"
                  onClick={() => router.push("/book")}
                >
                  ← Back
                </Button>
                <Button
                  disabled={savingContact}
                  onClick={saveContactAndContinue}
                  className="font-mono text-xs uppercase tracking-[0.15em]"
                >
                  {savingContact ? "Saving..." : "Continue to payment →"}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">Payment</h1>
              <p className="mt-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-cyan-400">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                256-bit encrypted · secure channel
              </p>
              <div className="mt-6 max-w-md">
                <PaymentPanel bookingId={booking.id} totalSatang={booking.totalSatang} />
              </div>
              <div className="mt-6">
                <Button
                  variant="outline"
                  className="font-mono text-xs uppercase tracking-[0.15em]"
                  onClick={() => setSubStep("details")}
                >
                  ← Back
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <OrderSummary
            eventName={booking.event.name}
            venueName={null}
            startAt={null}
            items={summaryItems}
            totalSatang={booking.totalSatang}
          />
        </aside>
      </div>
    </BookingShell>
  );
}
