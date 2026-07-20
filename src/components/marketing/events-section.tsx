import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatSatang } from "@/lib/money";

type TierCard = {
  id: string;
  name: string;
  tablesLabel: string;
  capacity: number;
  fromSatang: number;
  drinks: string;
  soldOut: boolean;
};

export function EventsSection({ tiers }: { tiers: TierCard[] }) {
  return (
    <section id="events" className="snap-section flex min-h-screen items-center border-t border-white/10 px-4 py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">
              // Ticket tiers
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-5xl">
              Select your frequency
            </h2>
          </div>
          <p className="hidden font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 sm:block">
            {tiers.length} tiers available
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-black/60 p-6 backdrop-blur-sm transition-colors hover:border-amber-400/50"
            >
              <h3 className="font-heading text-2xl font-bold uppercase text-white">{tier.name}</h3>

              <dl className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Tables
                  </dt>
                  <dd className="text-right text-neutral-300">{tier.tablesLabel}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Capacity
                  </dt>
                  <dd className="text-neutral-300">{tier.capacity} people</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Price
                  </dt>
                  <dd className="font-heading font-bold text-amber-400">
                    {tier.soldOut ? "Sold out" : `${formatSatang(tier.fromSatang)} / table`}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Drinks
                  </dt>
                  <dd className="text-right text-neutral-300">{tier.drinks}</dd>
                </div>
              </dl>

              <Button
                variant="outline"
                disabled={tier.soldOut}
                className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black mt-6 font-mono text-xs uppercase tracking-[0.15em]"
                nativeButton={false}
                render={<Link href="/book" />}
              >
                Book now
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
