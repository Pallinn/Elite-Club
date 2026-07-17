"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ResendTicketsButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    const res = await fetch(`/api/bookings/${bookingId}/resend`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Couldn't resend tickets.");
      return;
    }
    toast.success("Tickets sent to your email.");
  }

  return (
    <Button variant="outline" size="sm" onClick={resend} disabled={loading}>
      {loading ? "Sending..." : "Resend tickets by email"}
    </Button>
  );
}
