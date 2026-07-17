import Link from "next/link";

const STEPS = [
  { key: "ticket", label: "01 Ticket" },
  { key: "details", label: "02 Details" },
  { key: "payment", label: "03 Payment" },
] as const;

export function BookingShell({
  step,
  backHref,
  children,
}: {
  step: (typeof STEPS)[number]["key"];
  backHref: string;
  children: React.ReactNode;
}) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-black">
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-4 sm:px-8">
        <Link
          href={backHref}
          className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-white"
        >
          ← Back
        </Link>
        <Link href="/" className="font-heading text-base font-bold tracking-widest text-white">
          <span className="text-primary">NO</span>SIGNAL
        </Link>
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          Secure booking
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="mb-10">
          <div className="flex">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex-1">
                <p
                  className={`font-mono text-xs uppercase tracking-[0.15em] ${
                    i <= activeIndex ? "text-primary" : "text-neutral-600"
                  }`}
                >
                  {s.label}
                </p>
                <div className="mt-3 h-0.5 w-full bg-white/10">
                  <div
                    className="h-0.5 bg-primary transition-all"
                    style={{ width: i <= activeIndex ? "100%" : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
