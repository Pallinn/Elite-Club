import Image from "next/image";

export function PosterSection() {
  return (
    <section id="poster" className="snap-section flex min-h-[calc(100svh-4rem)] items-center border-t border-white/10 px-4 py-10 sm:min-h-[calc(100vh-4rem)] sm:py-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">
            // Official poster
          </p>

          <h2 className="mt-3 font-heading text-3xl font-bold uppercase leading-[1.05] sm:mt-4 sm:text-5xl lg:text-6xl">
            <span className="block text-white">Off the</span>
            <span className="block text-white">grid.</span>
            <span className="block text-neutral-500">On the</span>
            <span className="block text-neutral-500">floor.</span>
          </h2>

          <p className="mt-4 max-w-md text-sm text-neutral-400 sm:mt-8 sm:text-base">
            One night, zero bars. Save the date, save the table — because once the
            signal drops, so does the floor.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[220px] -rotate-2 overflow-hidden rounded-lg border border-white/10 shadow-[0_0_80px_-10px_rgba(249,115,22,0.25)] transition-transform duration-500 hover:rotate-0 sm:max-w-sm">
            <Image
              src="/images/poster.png"
              alt="No Signal event poster — Saturday 26.07.25, 10PM till late"
              width={1086}
              height={1448}
              className="h-auto w-full"
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
