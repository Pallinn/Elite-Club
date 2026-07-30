"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const LINEUP = [
  { name: "AJ", back: "/images/back_AJ.jpg", photo: "/images/dj_aj.png" },
  { name: "ARTY", back: "/images/back_R-TY.jpg", photo: "/images/dj_R-TY.png" },
  { name: "KENYA", back: "/images/back_KENYA.jpg", photo: "/images/dj_kenya.png" },
  { name: "KYU", back: "/images/back_KYU.jpg", photo: "/images/dj_KYU.png" },
];

export function LineupSection() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [activeMobile, setActiveMobile] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mql = window.matchMedia("(max-width: 639px)");
    const ratios = new Map<number, number>();
    let observer: IntersectionObserver | null = null;

    function setup() {
      observer?.disconnect();
      ratios.clear();
      if (!mql.matches) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const index = cardRefs.current.findIndex((el) => el === entry.target);
            if (index !== -1) ratios.set(index, entry.intersectionRatio);
          });

          let bestIndex = 0;
          let bestRatio = -1;
          ratios.forEach((ratio, index) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestIndex = index;
            }
          });
          setActiveMobile(bestIndex);
        },
        { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
      );

      cardRefs.current.forEach((el) => el && observer!.observe(el));
    }

    setup();
    mql.addEventListener("change", setup);
    return () => {
      observer?.disconnect();
      mql.removeEventListener("change", setup);
    };
  }, []);

  return (
    <section id="lineup" className="snap-section flex min-h-[calc(100svh-4rem)] flex-col border-t border-white/10 py-10 sm:min-h-[calc(100vh-4rem)] sm:py-16">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="font-heading text-3xl font-bold text-white sm:text-5xl">Lineup</h2>
      </div>

      <div
        ref={containerRef}
        className="mt-6 flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mt-10 sm:snap-none sm:flex-row sm:gap-0 sm:divide-x sm:divide-white/10 sm:overflow-visible sm:px-0 sm:pb-0"
      >
        {LINEUP.map((artist, i) => {
          const state = hovered === null ? "neutral" : hovered === i ? "hovered" : "shrunk";

          return (
            <div
              key={artist.name}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              data-state={state}
              data-active={activeMobile === i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="group relative h-[52vh] w-[78vw] max-w-xs shrink-0 snap-center overflow-hidden rounded-lg border border-white/10 scale-90 opacity-60 transition-[width,transform,opacity] duration-500 ease-out data-[active=true]:scale-100 data-[active=true]:opacity-100 sm:h-auto sm:max-w-none sm:shrink sm:flex-none sm:rounded-none sm:border-0 sm:scale-100 sm:opacity-100 sm:data-[state=hovered]:w-[34%] sm:data-[state=neutral]:w-1/4 sm:data-[state=shrunk]:w-[22%]"
            >
              <Image
                src={artist.back}
                alt=""
                fill
                sizes="(min-width: 640px) 50vw, 80vw"
                className="object-cover object-[center_25%]"
              />

              <Image
                src={artist.photo}
                alt={artist.name}
                fill
                sizes="(min-width: 640px) 50vw, 80vw"
                className="object-contain object-bottom origin-bottom transition-transform duration-500 ease-out group-hover:scale-125"
              />

            </div>
          );
        })}
      </div>
    </section>
  );
}
