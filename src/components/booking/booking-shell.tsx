"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { CircleUserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const STEPS = [
  { key: "ticket", label: "01 Ticket" },
  { key: "details", label: "02 Details" },
  { key: "payment", label: "03 Payment" },
] as const;

export function BookingShell({
  step,
  backHref,
  tabs,
  children,
}: {
  step: (typeof STEPS)[number]["key"];
  backHref: string;
  tabs?: React.ReactNode;
  children: React.ReactNode;
}) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <header className="flex h-16 items-center justify-between border-b border-white/10 bg-black px-4 sm:px-8">
        <Link
          href={backHref}
          className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-white"
        >
          ← Back
        </Link>
        <Link href="/" className="flex items-center">
          <Image src="/images/logo.png" alt="Elite" width={90} height={28} />
        </Link>
        <div className="flex w-[76px] justify-end">
          {session?.user ? (
            <Link href="/account" aria-label="Account">
              <Avatar size="sm">
                <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "Account"} />
                <AvatarFallback>
                  {(session.user.name ?? session.user.email ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link
              href="/login"
              aria-label="Log in or sign up"
              className="text-white transition-colors hover:text-orange-400"
            >
              <CircleUserRound className="h-6 w-6" strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        {tabs && <div className="mb-10">{tabs}</div>}

        <div className="mb-10">
          <div className="flex">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex-1">
                <p
                  className={`font-mono text-xs uppercase tracking-[0.15em] ${
                    i <= activeIndex ? "text-primary" : "text-neutral-600"
                  }`}
                >
                  {s.label}
                </p>
                <div className="mt-3 h-0.5 w-full bg-white/10">
                  <div
                    className="h-0.5 bg-primary transition-all"
                    style={{ width: i <= activeIndex ? "100%" : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
