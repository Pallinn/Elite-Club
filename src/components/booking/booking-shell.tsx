import Link from "next/link";
import Image from "next/image";

const STEPS = [
  { key: "ticket", label: "01 Ticket" },
  { key: "details", label: "02 Details" },
  { key: "payment", label: "03 Payment" },
] as const;

export function BookingShell({
  step,
  backHref,
  tabs,
  children,
}: {
  step: (typeof STEPS)[number]["key"];
  backHref: string;
  tabs?: React.ReactNode;
  children: React.ReactNode;
}) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-neutral-900">
      <header className="flex h-16 items-center justify-between border-b border-white/10 bg-black px-4 sm:px-8">
        <Link
          href={backHref}
          className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-white"
        >
          ← Back
        </Link>
        <Link href="/" className="flex items-center">
          <Image src="/images/logo.png" alt="Elite" width={90} height={28} />
        </Link>
        <div className="w-[76px]" />
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        {tabs && <div className="mb-10">{tabs}</div>}

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
