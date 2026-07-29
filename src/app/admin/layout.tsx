import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HomeIcon } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/reservations", label: "Reservations" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/tables", label: "Tables" },
  { href: "/admin/checkin", label: "Check-in" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/logs", label: "Activity log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white sm:flex-row">
      <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-neutral-950 sm:flex sm:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-3">
          <Link
            href="/"
            aria-label="Back to home"
            className="flex shrink-0 items-center justify-center rounded-md p-2 text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <HomeIcon className="size-4" />
          </Link>
          <Link href="/admin" className="flex min-w-0 items-center gap-3 px-1">
            <Image src="/images/logo.png" alt="Elite" width={70} height={22} priority />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-orange-500">
              Admin
            </span>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 font-mono text-xs uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
            Signed in as
          </p>
          <p className="mt-1 truncate text-sm text-white">{session.user.name ?? session.user.email}</p>
        </div>
      </aside>

      <nav className="flex shrink-0 items-center gap-1 border-b border-white/10 bg-neutral-950 p-3 sm:hidden">
        <Link
          href="/"
          aria-label="Back to home"
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-2 font-mono text-xs uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <HomeIcon className="size-4" />
        </Link>
        <div className="flex min-w-0 gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-3 py-2 font-mono text-xs whitespace-nowrap uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="flex-1 overflow-x-auto p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
