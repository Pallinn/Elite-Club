"use client";

import { useEffect, useState } from "react";

export function HoldTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire?: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemainingMs(ms);
      if (ms <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <span className={remainingMs < 120000 ? "text-red-400" : "text-white"}>
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}
