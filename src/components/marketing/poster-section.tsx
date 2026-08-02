export function PosterSection() {
  return (
    <section id="poster" className="snap-section flex min-h-[calc(100svh-4rem)] items-center border-t border-white/10 px-4 py-10 sm:min-h-[calc(100vh-4rem)] sm:py-24">
      <div className="mx-auto w-full max-w-3xl text-center">
        <h2 className="font-heading text-3xl font-bold uppercase leading-[1.05] sm:text-5xl lg:text-6xl">
          <span className="block text-white">The best</span>
          <span className="block text-white">connections</span>
          <span className="block text-neutral-500">need no</span>
          <span className="block text-neutral-500">signal.</span>
        </h2>

        <p className="mx-auto mt-4 max-w-md text-sm text-neutral-400 sm:mt-8 sm:text-base">
          21.08.2026
        </p>
      </div>
    </section>
  );
}
