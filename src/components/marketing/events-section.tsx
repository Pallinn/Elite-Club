import { formatSatangRange } from "@/lib/money";

type TierCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  benefits: string[];
  priceMinSatang: number;
  priceMaxSatang: number;
  soldOut: boolean;
};

export function EventsSection({ tiers }: { tiers: TierCard[] }) {
  return (
    <section id="events" className="snap-section flex min-h-[calc(100svh-4rem)] items-start border-t border-white/10 px-4 py-6 sm:min-h-[calc(100vh-4rem)] sm:items-center sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white sm:text-5xl">
            Select your table
          </h2>
        </div>

        <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:mt-12 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="flex w-[78vw] max-w-xs shrink-0 snap-center flex-col overflow-hidden rounded-lg border border-white/10 bg-black/60 backdrop-blur-sm transition-colors hover:border-amber-400/50 sm:w-auto sm:max-w-none sm:shrink"
            >
              <div className="flex flex-1 flex-col p-3 sm:p-6">
                <h3 className="font-heading text-lg font-bold uppercase text-white sm:text-2xl">{tier.name}</h3>

                <p className="mt-1 font-heading font-bold text-amber-400 sm:mt-2">
                  {tier.soldOut
                    ? "Sold out"
                    : `${formatSatangRange(tier.priceMinSatang, tier.priceMaxSatang)} / table`}
                </p>

                {tier.benefits.length > 0 && (
                  <ul className="mt-2 space-y-1 border-t border-white/10 pt-2 text-xs text-neutral-300 sm:mt-5 sm:space-y-2 sm:pt-5 sm:text-sm">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
