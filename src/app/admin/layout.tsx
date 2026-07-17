import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/admin" className="text-lg font-semibold text-white">
            NO SIGNAL &middot; Admin
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="text-neutral-300 hover:text-white">Overview</Link>
            <Link href="/admin/event" className="text-neutral-300 hover:text-white">Event</Link>
            <Link href="/admin/bookings" className="text-neutral-300 hover:text-white">Bookings</Link>
            <Link href="/admin/checkin" className="text-neutral-300 hover:text-white">Check-in</Link>
            <Link href="/" className="text-neutral-500 hover:text-white">Back to site</Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
