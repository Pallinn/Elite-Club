import Image from "next/image";

export function HeroSection({ eventName }: { eventName: string }) {
  return (
    <section className="snap-section relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden text-center sm:min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-black"
      />

      <div className="flex -translate-y-16 flex-col items-center px-4 sm:-translate-y-24">
        <Image src="/images/logo.png" alt="Elite" width={176} height={55} priority />

        <p className="mt-2 mb-10 font-mono text-[9px] font-bold tracking-[0.3em] text-orange-500 sm:text-[10px]">
          PRESENTS
        </p>

        <div className="relative aspect-[342/39] w-[300px] overflow-hidden sm:w-[500px] md:w-[650px]">
          <Image src="/images/no_signal.png" alt={eventName} fill className="object-cover" priority />
        </div>
      </div>
    </section>
  );
}
