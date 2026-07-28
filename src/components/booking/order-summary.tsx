import { formatSatang } from "@/lib/money";
import type { TableProvisions } from "@/lib/table-provisions";

export function OrderSummary({
  eventName,
  items,
  totalSatang,
  provisions,
  footer,
}: {
  eventName: string;
  items?: { label: string; amountSatang: number }[];
  totalSatang?: number;
  provisions?: TableProvisions;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-950 p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Order summary</p>

      <h3 className="mt-4 font-heading text-base font-bold uppercase text-white">{eventName}</h3>

      {provisions && (
        <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-4 font-mono text-xs text-neutral-300">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Capacity</dt>
            <dd>{provisions.capacityRange} guests</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Black Label</dt>
            <dd>x{provisions.blackLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Mixers</dt>
            <dd>x{provisions.mixers}</dd>
          </div>
        </dl>
      )}

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

      {footer && <div className="mt-5">{footer}</div>}
    </div>
  );
}
