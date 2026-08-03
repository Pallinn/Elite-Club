import Link from "next/link";
import Image from "next/image";

export function InstagramBadge() {
  return (
    <Link
      href="https://www.instagram.com/elitebkk.co/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Elite on Instagram"
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur transition-colors hover:bg-white/20"
    >
      <Image src="/images/ig_logo_white.png" alt="" width={24} height={24} className="h-6 w-6" />
    </Link>
  );
}
