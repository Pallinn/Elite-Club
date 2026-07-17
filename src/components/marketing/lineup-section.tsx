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
    <section id="lineup" className="snap-section flex min-h-screen flex-col border-t border-white/10 py-16">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="font-heading text-3xl font-bold text-white sm:text-5xl">Lineup</h2>
      </div>

      <div className="mt-10 flex flex-1 flex-col divide-y divide-white/10 sm:flex-row sm:divide-x sm:divide-y-0">
        {LINEUP.map((artist, i) => {
          const state = hovered === null ? "neutral" : hovered === i ? "hovered" : "shrunk";

          return (
            <div
              key={artist.name}
              data-state={state}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="group relative w-full min-h-[220px] flex-1 overflow-hidden bg-black transition-[width] duration-500 ease-out sm:min-h-0 sm:flex-none sm:data-[state=hovered]:w-1/2 sm:data-[state=neutral]:w-1/3 sm:data-[state=shrunk]:w-1/4"
            >
              <span className="pointer-events-none absolute left-4 top-4 z-10 h-5 w-5 border-l border-t border-amber-400/40" />
              <span className="pointer-events-none absolute right-4 top-4 z-10 h-5 w-5 border-r border-t border-amber-400/40" />

              <Image
                src={artist.image}
                alt={artist.name}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-contain object-bottom scale-95 transition-transform duration-500 ease-out group-hover:scale-125"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden px-3">
                <span className="text-center font-heading text-5xl font-bold uppercase leading-none tracking-tight text-orange-500 opacity-0 transition-opacity duration-500 group-hover:opacity-70 sm:text-6xl">
                  {artist.name}
                </span>
              </div>

              <p className="absolute bottom-4 inset-x-0 z-10 text-center font-mono text-xs font-bold uppercase tracking-[0.15em] text-white">
                {artist.time}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
