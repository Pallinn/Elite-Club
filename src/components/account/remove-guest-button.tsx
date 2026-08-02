"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function RemoveGuestButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function remove() {
    setLoading(true);
    const res = await fetch(`/api/tickets/${ticketId}/remove`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Couldn't remove this guest.");
      setConfirming(false);
      return;
    }
    toast.success("Guest removed.");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400">Remove guest?</span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-red-500/40 text-red-400 hover:bg-red-500/10"
          onClick={remove}
          disabled={loading}
        >
          {loading ? "Removing..." : "Confirm"}
        </Button>
        <Button variant="ghost" size="sm" className="h-8" onClick={() => setConfirming(false)} disabled={loading}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 border-red-500/40 text-red-400 hover:bg-red-500/10"
      onClick={() => setConfirming(true)}
    >
      Remove
    </Button>
  );
}
