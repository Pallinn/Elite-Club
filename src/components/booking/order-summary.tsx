import { formatSatang } from "@/lib/money";

export function OrderSummary({
  eventName,
  venueName,
  startAt,
  items,
  totalSatang,
}: {
  eventName: string;
  venueName: string | null;
  startAt: Date | null;
  items?: { label: string; amountSatang: number }[];
  totalSatang?: number;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-950 p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Order summary</p>

      <div
        aria-hidden
        className="relative mt-4 flex h-32 items-center justify-center overflow-hidden rounded"
        style={{
          background:
            "radial-gradient(120% 100% at 30% 0%, oklch(0.667 0.295 322.15 / 30%) 0%, oklch(0.09 0 0) 60%)",
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(oklch(1_0_0/8%)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/8%)_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>

      <h3 className="mt-4 font-heading text-base font-bold uppercase text-white">{eventName}</h3>
      {startAt && (
        <p className="mt-1 font-mono text-xs text-neutral-500">
          {startAt
            .toLocaleString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
            .toUpperCase()}{" "}
          · {startAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </p>
      )}
      {venueName && <p className="text-sm text-neutral-400">{venueName}</p>}

      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
        {items && items.length > 0 ? (
          <>
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-neutral-300">
                <span>{item.label}</span>
                <span>{formatSatang(item.amountSatang)}</span>
              </div>
            ))}
          </>
        ) : (
          <p className="text-sm text-neutral-600">Select a ticket type</p>
        )}
      </div>

      {totalSatang !== undefined && (
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-400">
            Total
          </span>
          <span className="font-heading text-xl font-bold text-primary">
            {formatSatang(totalSatang)}
          </span>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {["SSL Secured", "PCI Compliant", "No Hidden Fees"].map((badge) => (
          <span
            key={badge}
            className="rounded border border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-neutral-500"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
