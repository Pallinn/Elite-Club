"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function JoinTableForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tables/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't join that table.");
        return;
      }
      toast.success(data.alreadyJoined ? "You're already on this table." : "You're in! Here's your ticket.");
      router.push(`/account/tickets/${data.ticketId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        required
        maxLength={6}
        placeholder="ABC123"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="border-white/10 bg-neutral-950 text-center font-mono text-lg uppercase tracking-[0.3em] sm:text-left"
      />
      <Button
        type="submit"
        disabled={loading}
        className="shrink-0 font-mono text-xs uppercase tracking-[0.2em]"
      >
        {loading ? "Joining..." : "Join table"}
      </Button>
    </form>
  );
}
