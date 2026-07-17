import { CheckinScanner } from "@/components/admin/checkin-scanner";

export default function AdminCheckinPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Check-in</h1>
      <CheckinScanner />
    </div>
  );
}
