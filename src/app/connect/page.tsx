import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { isEligibleForConnect } from "@/lib/connect";
import { SiteHeader } from "@/components/site-header";
import { ConnectApp } from "@/components/connect/connect-app";

export default async function ConnectPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/connect");

  const eligible = await isEligibleForConnect(session.user.id);

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <SiteHeader />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        {eligible ? (
          <ConnectApp />
        ) : (
          <div className="mx-auto max-w-sm space-y-4 py-16 text-center">
            <h1 className="text-lg font-semibold text-white">Connect</h1>
            <p className="text-sm text-neutral-400">
              Connect is open to ticket holders. Book a ticket to start matching with other
              attendees.
            </p>
            <Link
              href="/book"
              className="inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-black hover:bg-orange-400"
            >
              Browse tickets
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
