import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/account/profile-form";
import { SignOutButton } from "@/components/sign-out-button";
import Link from "next/link";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Profile</h1>
        <SignOutButton />
      </div>
      <ProfileForm
        initialName={user.name ?? ""}
        initialPhone={user.phone ?? ""}
        email={user.email}
      />
    </div>
  );
}
