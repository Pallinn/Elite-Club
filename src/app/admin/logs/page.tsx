import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ACTION_TINT: Record<string, string> = {
  "booking.created": "text-cyan-400",
  "booking.paid": "text-emerald-400",
  "booking.verify_payment_manual": "text-emerald-400",
  "booking.expired": "text-neutral-500",
  "ticket.void": "text-red-400",
  "ticket.comp_add": "text-amber-400",
  "ticket.join_redeemed": "text-cyan-400",
  "table.lock": "text-amber-400",
  "table.unlock": "text-emerald-400",
  "table.edit": "text-orange-400",
  "payment.succeeded": "text-emerald-400",
  "payment.failed": "text-red-400",
};

function tintFor(action: string): string {
  return ACTION_TINT[action] ?? "text-neutral-400";
}

export default async function AdminLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">// Activity</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-white">Activity log</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Most recent 300 events. Newest first.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-neutral-950 text-left">
            <tr className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/5 last:border-0 align-top">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-neutral-500">
                  {log.createdAt.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-white">
                  {log.actorLabel ?? (log.actorUserId ? "—" : "system")}
                </td>
                <td className={`px-4 py-3 font-mono text-xs ${tintFor(log.action)}`}>
                  {log.action}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                  {log.entityType ? `${log.entityType}${log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ""}` : "—"}
                </td>
                <td className="px-4 py-3">
                  {log.metadata ? (
                    <pre className="max-w-md whitespace-pre-wrap break-all font-mono text-[10px] text-neutral-400">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-neutral-600">—</span>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-neutral-500">
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
