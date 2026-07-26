import Link from "next/link";

export function StickyBuyBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const href = isLoggedIn ? "/book" : "/login?callbackUrl=/book";

  return (
    <Link
      href={href}
      className="fixed inset-x-0 bottom-0 z-40 block w-full bg-white/10 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-center backdrop-blur transition-colors hover:bg-white/20"
    >
      <span className="font-heading text-xl font-bold uppercase tracking-[0.3em] text-orange-500 sm:text-2xl">
        Buy now
      </span>
    </Link>
  );
}
