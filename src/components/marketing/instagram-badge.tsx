import Link from "next/link";
import Image from "next/image";

export function InstagramBadge() {
  return (
    <Link
      href="https://www.instagram.com/elite.bkkclub/"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-2 backdrop-blur transition-colors hover:bg-white/20"
    >
      <Image src="/images/ig_logo.png" alt="" width={20} height={20} className="h-5 w-5" />
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-white">elite.bkkclub</span>
    </Link>
  );
}
