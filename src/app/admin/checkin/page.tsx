import { TableCodeCheckin } from "@/components/admin/table-code-checkin";

export default function AdminCheckinPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">// Check-in</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-white">Table check-in</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Search by guest name, table number, or table code to pull up a roster, then check people in one by one.
        </p>
      </div>
      <TableCodeCheckin />
    </div>
  );
}
