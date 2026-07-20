import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { JoinTableForm } from "@/components/account/join-table-form";

export default async function JoinPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/join");

  return (
    <div className="min-h-screen bg-black">
      <SiteHeader />

      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">
          // Add to my table
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-white">Got a table code?</h1>
        <p className="mt-3 text-sm text-neutral-400">
          Enter the 6-character code your friend shared with you to join their table and get
          your own e-ticket.
        </p>

        <div className="mt-8 w-full">
          <JoinTableForm />
        </div>
      </div>
    </div>
  );
}
