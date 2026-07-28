import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatSatang } from "@/lib/money";

type TierCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  benefits: string[];
  fromSatang: number;
  soldOut: boolean;
};

export function EventsSection({ tiers }: { tiers: TierCard[] }) {
  return (
    <section id="events" className="snap-section flex min-h-[calc(100svh-4rem)] items-center border-t border-white/10 px-4 py-10 sm:min-h-[calc(100vh-4rem)] sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">
              // Ticket tiers
            </p>
            <h2 className="mt-3 font-heading text-2xl font-bold text-white sm:text-5xl">
              Select your frequency
            </h2>
          </div>
          <p className="hidden font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 sm:block">
            {tiers.length} tiers available
          </p>
        </div>

        <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:mt-12 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="flex w-[78vw] max-w-xs shrink-0 snap-center flex-col overflow-hidden rounded-lg border border-white/10 bg-black/60 backdrop-blur-sm transition-colors hover:border-amber-400/50 sm:w-auto sm:max-w-none sm:shrink"
            >
              <div className="relative flex aspect-video items-center justify-center border-b border-white/10 bg-white/5">
                {tier.imageUrl ? (
                  <Image src={tier.imageUrl} alt={tier.name} fill className="object-cover" />
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-600">
                    Image coming soon
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4 sm:p-6">
                <h3 className="font-heading text-xl font-bold uppercase text-white sm:text-2xl">{tier.name}</h3>

                <p className="mt-2 font-heading font-bold text-amber-400">
                  {tier.soldOut ? "Sold out" : `${formatSatang(tier.fromSatang)} / table`}
                </p>

                {tier.benefits.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-sm text-neutral-300 sm:mt-5 sm:space-y-2 sm:pt-5">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  variant="outline"
                  disabled={tier.soldOut}
                  className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black mt-4 font-mono text-xs uppercase tracking-[0.15em] sm:mt-6"
                  nativeButton={false}
                  render={<Link href="/book" />}
                >
                  Book now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
