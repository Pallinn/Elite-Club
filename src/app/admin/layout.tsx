import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/reservations", label: "Reservations" },
  { href: "/admin/tables", label: "Tables" },
  { href: "/admin/checkin", label: "Check-in" },
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
        <Link href="/admin" className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <Image src="/images/logo.png" alt="Elite" width={70} height={22} priority />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-orange-500">
            Admin
          </span>
        </Link>
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
          <Link
            href="/"
            className="mt-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500 hover:text-white"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 bg-neutral-950 p-3 sm:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-md px-3 py-2 font-mono text-xs whitespace-nowrap uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="flex-1 overflow-x-auto p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
