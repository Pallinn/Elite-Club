"use client";

import { useEffect, useState } from "react";

export function HoldTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire?: () => void;
}) {
  // null until the first client-side tick - Date.now() at SSR time and at
  // hydration time are never equal, so computing it in the initial state
  // would make the server- and client-rendered text mismatch.
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => new Date(expiresAt).getTime() - Date.now();
    setRemainingMs(tick());

    const interval = setInterval(() => {
      const ms = tick();
      setRemainingMs(ms);
      if (ms <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (remainingMs === null) {
    return <span className="text-white">--:--</span>;
  }

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <span className={remainingMs < 120000 ? "text-red-400" : "text-white"}>
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}
