"use client";

import { useState } from "react";
import Image from "next/image";

const LINEUP = [
  { name: "GRIDLOCK", time: "00:00 — 02:00", image: "/images/dj_1.png" },
  { name: "PHANTOM.WAV", time: "22:00 — 00:00", image: "/images/dj_2.png" },
  { name: "ACIDBURN", time: "02:00 — 04:00", image: "/images/dj_3.png" },
];

export function LineupSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="lineup" className="snap-section flex min-h-[calc(100svh-4rem)] flex-col border-t border-white/10 py-10 sm:min-h-[calc(100vh-4rem)] sm:py-16">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="font-heading text-3xl font-bold text-white sm:text-5xl">Lineup</h2>
      </div>

      <div className="mt-6 flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mt-10 sm:snap-none sm:flex-row sm:gap-0 sm:divide-x sm:divide-white/10 sm:overflow-visible sm:px-0 sm:pb-0">
        {LINEUP.map((artist, i) => {
          const state = hovered === null ? "neutral" : hovered === i ? "hovered" : "shrunk";

          return (
            <div
              key={artist.name}
              data-state={state}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="group relative h-[52vh] w-[78vw] max-w-xs shrink-0 snap-center overflow-hidden rounded-lg border border-white/10 bg-black transition-[width] duration-500 ease-out sm:h-auto sm:max-w-none sm:shrink sm:flex-none sm:rounded-none sm:border-0 sm:data-[state=hovered]:w-1/2 sm:data-[state=neutral]:w-1/3 sm:data-[state=shrunk]:w-1/4"
            >
              <span className="pointer-events-none absolute left-4 top-4 z-10 h-5 w-5 border-l border-t border-amber-400/40" />
              <span className="pointer-events-none absolute right-4 top-4 z-10 h-5 w-5 border-r border-t border-amber-400/40" />

              <Image
                src={artist.image}
                alt={artist.name}
                fill
                sizes="(min-width: 640px) 50vw, 80vw"
                className="object-contain object-bottom scale-95 transition-transform duration-500 ease-out group-hover:scale-125"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden px-3">
                <span className="text-center font-heading text-3xl font-bold uppercase leading-none tracking-tight text-orange-500 opacity-70 transition-opacity duration-500 group-hover:opacity-70 sm:text-5xl sm:opacity-0 sm:group-hover:opacity-70 md:text-6xl">
                  {artist.name}
                </span>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-300 sm:hidden">
                {artist.time}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
