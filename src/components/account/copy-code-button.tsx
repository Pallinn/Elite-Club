"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onCopy}
      className="border-primary/40 font-mono text-xs uppercase tracking-[0.15em] text-primary"
    >
      {copied ? "Copied!" : "Copy code"}
    </Button>
  );
}
