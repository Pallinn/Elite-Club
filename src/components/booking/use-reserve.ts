"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useReserve() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reserve(items: { zoneId: string; tableId?: string; quantity: number }[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/holds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();

      if (res.status === 401) {
        router.push(`/login?callbackUrl=/book`);
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong.");
        router.refresh();
        return;
      }

      router.push(`/checkout/${data.bookingId}`);
    } finally {
      setLoading(false);
    }
  }

  return { reserve, loading };
}
