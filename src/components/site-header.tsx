import Image from "next/image";
import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileNav } from "@/components/mobile-nav";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <Link href="/" className="flex items-center">
          <Image src="/images/logo.png" alt="Elite" width={90} height={28} priority />
        </Link>

        <nav className="ml-8 hidden items-center gap-8 font-mono text-xs uppercase tracking-[0.2em] text-neutral-400 sm:flex">
          <Link href="/#lineup" className="transition-colors hover:text-white">
            Lineup
          </Link>
          <Link href="/book" className="transition-colors hover:text-white">
            Book
          </Link>
          <span className="flex cursor-not-allowed items-center gap-1.5 text-neutral-600">
            Connect
            <span className="rounded border border-white/10 px-1 py-0.5 text-[9px] text-neutral-500">
              Soon
            </span>
          </span>
        </nav>

        <div className="ml-auto flex items-center justify-end gap-3">
          {session?.user ? (
            <Link
              href="/account"
              className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-neutral-300 transition-colors hover:text-white"
            >
              <Avatar size="sm">
                <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "Account"} />
                <AvatarFallback>
                  {(session.user.name ?? session.user.email ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">{session.user.name ?? session.user.email}</span>
              {session.user.role === "ADMIN" && (
                <span className="rounded border border-primary/40 px-1.5 py-0.5 text-[9px] text-primary">
                  Admin
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              aria-label="Log in or sign up"
              className="-m-2 p-2 text-white transition-colors hover:text-orange-400"
            >
              <CircleUserRound className="h-7 w-7" strokeWidth={1.5} />
            </Link>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
