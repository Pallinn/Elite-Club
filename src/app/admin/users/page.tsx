import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { adminConnectPhotoSrc } from "@/lib/connect-tags";
import { ConnectModerationActions } from "@/components/admin/connect-moderation-actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { connectProfile: { select: { photoUrl: true, isActive: true } } },
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">// Users</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-white">Users</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Every registered account. Photo prefers their Connect profile picture, falling back to
          their account avatar.
        </p>
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search name, email, or phone"
          className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-neutral-900 px-3 text-sm text-white sm:flex-none"
        />
        <button
          type="submit"
          className="h-9 rounded-md border border-white/10 px-3 text-sm text-white hover:bg-white/5"
        >
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-neutral-950 text-left">
            <tr className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Connect</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const photoSrc = user.connectProfile?.photoUrl
                ? adminConnectPhotoSrc(user.connectProfile.photoUrl)
                : user.image;
              return (
                <tr key={user.id} className="border-b border-white/5 bg-neutral-950 last:border-0">
                  <td className="px-4 py-3">
                    {photoSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoSrc}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-mono text-xs text-neutral-500">
                        {(user.name ?? user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white">{user.name ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-400">{user.email}</td>
                  <td className="px-4 py-3 text-neutral-400">{user.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.connectProfile ? (
                      <div className="space-y-1.5">
                        <Badge variant={user.connectProfile.isActive ? "default" : "secondary"}>
                          {user.connectProfile.isActive ? "Active" : "Deactivated"}
                        </Badge>
                        <ConnectModerationActions
                          userId={user.id}
                          isActive={user.connectProfile.isActive}
                          hasPhoto={Boolean(user.connectProfile.photoUrl)}
                        />
                      </div>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-neutral-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
