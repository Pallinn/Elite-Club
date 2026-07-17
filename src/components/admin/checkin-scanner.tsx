"use client";

import { useEffect, useRef, useState } from "react";

type ScanResult =
  | { kind: "success"; ticketNumber: string; label: string; contactName: string }
  | { kind: "error"; message: string; ticketNumber?: string; label?: string };

export function CheckinScanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;

    async function start() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (stopped || !containerRef.current) return;

      const scanner = new Html5Qrcode(containerRef.current.id);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            if (busyRef.current) return;
            busyRef.current = true;
            await scanner.pause(true);

            try {
              const res = await fetch("/api/checkin/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ raw: decodedText }),
              });
              const data = await res.json();
              if (res.ok) {
                setResult({ kind: "success", ...data });
                setCheckedInCount((c) => c + 1);
              } else {
                setResult({ kind: "error", ...data });
              }
            } catch {
              setResult({ kind: "error", message: "Network error." });
            }

            setTimeout(() => {
              setResult(null);
              busyRef.current = false;
              scanner.resume();
            }, 2000);
          },
          () => {
            // ignore per-frame decode failures
          }
        );
      } catch {
        setCameraError("Couldn't access the camera. Check permissions and try again.");
      }
    }

    start();

    return () => {
      stopped = true;
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-400">Checked in: {checkedInCount}</p>
      <div id="checkin-scanner-region" ref={containerRef} className="mx-auto max-w-sm overflow-hidden rounded-lg" />
      {cameraError && <p className="text-sm text-red-400">{cameraError}</p>}
      {result && (
        <div
          className={`mx-auto max-w-sm rounded-lg p-4 text-center text-white ${
            result.kind === "success" ? "bg-green-700" : "bg-red-700"
          }`}
        >
          {result.kind === "success" ? (
            <>
              <p className="text-lg font-semibold">Checked in</p>
              <p className="text-sm">{result.label}</p>
              <p className="text-sm">{result.contactName}</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">Rejected</p>
              <p className="text-sm">{result.message}</p>
              {result.label && <p className="text-sm">{result.label}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
