"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SignalListForm() {
  const [email, setEmail] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    toast.success("You're on the list.");
    setEmail("");
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        type="email"
        required
        placeholder="your@signal.fm"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border-white/10 bg-black/60 font-mono text-sm"
      />
      <Button
        type="submit"
        size="sm"
        className="shrink-0 bg-gradient-to-b from-amber-400 to-orange-600 font-mono text-xs uppercase tracking-[0.15em] text-black hover:from-amber-300 hover:to-orange-500"
      >
        Join
      </Button>
    </form>
  );
}
