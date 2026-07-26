import Link from "next/link";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-10 sm:flex-row sm:gap-8">
        <nav className="flex gap-2 overflow-x-auto text-sm sm:w-40 sm:shrink-0 sm:flex-col sm:gap-0 sm:space-y-1 sm:overflow-visible">
          <Link href="/account" className="block shrink-0 rounded px-3 py-2 whitespace-nowrap text-neutral-300 hover:bg-white/5 hover:text-white sm:whitespace-normal">
            Profile
          </Link>
          <Link href="/account/bookings" className="block shrink-0 rounded px-3 py-2 whitespace-nowrap text-neutral-300 hover:bg-white/5 hover:text-white sm:whitespace-normal">
            My bookings
          </Link>
           {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="block shrink-0 rounded bg-orange-500/10 px-3 py-2 font-medium whitespace-nowrap text-orange-400 hover:bg-orange-500/20 sm:whitespace-normal"
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
