import Image from "next/image";

export function PosterSection() {
  return (
    <section id="poster" className="snap-section flex min-h-screen items-center border-t border-white/10 px-4 py-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">
            // Official poster
          </p>

          <h2 className="mt-4 font-heading text-5xl font-bold uppercase leading-[1.05] sm:text-6xl">
            <span className="block text-white">Off the</span>
            <span className="block text-white">grid.</span>
            <span className="block text-neutral-500">On the</span>
            <span className="block text-neutral-500">floor.</span>
          </h2>

          <p className="mt-8 max-w-md text-base text-neutral-400">
            One night, zero bars. Save the date, save the table — because once the
            signal drops, so does the floor.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-sm -rotate-2 overflow-hidden rounded-lg border border-white/10 shadow-[0_0_80px_-10px_rgba(249,115,22,0.25)] transition-transform duration-500 hover:rotate-0">
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
