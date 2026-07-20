import Link from "next/link";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-4xl flex-1 gap-8 px-4 py-10">
        <nav className="w-40 shrink-0 space-y-1 text-sm">
          <Link href="/account" className="block rounded px-3 py-2 text-neutral-300 hover:bg-white/5 hover:text-white">
            Profile
          </Link>
          <Link href="/account/bookings" className="block rounded px-3 py-2 text-neutral-300 hover:bg-white/5 hover:text-white">
            My bookings
          </Link>
           {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="block rounded bg-orange-500/10 px-3 py-2 font-medium text-orange-400 hover:bg-orange-500/20"
            >
              Admin Dashboard
            </Link>
          )}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
