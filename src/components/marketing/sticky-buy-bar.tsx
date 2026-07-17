import Link from "next/link";

export function StickyBuyBar() {
  return (
    <Link
      href="/book"
      className="fixed inset-x-0 bottom-0 z-40 block w-full bg-white/10 py-3 text-center backdrop-blur transition-colors hover:bg-white/20"
    >
      <p className="font-mono text-xs uppercase tracking-[0.4em] text-white">Find your signal</p>
      <span className="font-heading text-xl font-bold uppercase tracking-[0.3em] text-orange-500 sm:text-2xl">
        Buy now
      </span>
    </Link>
  );
}
