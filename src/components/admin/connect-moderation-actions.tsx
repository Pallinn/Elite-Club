"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DoubleConfirmDialog } from "@/components/admin/double-confirm-dialog";

export function ConnectModerationActions({
  userId,
  isActive,
  hasPhoto,
}: {
  userId: string;
  isActive: boolean;
  hasPhoto: boolean;
}) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function toggleActive() {
    setToggling(true);
    try {
      const res = await fetch(`/api/admin/connect-profiles/${userId}/toggle-active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Couldn't update this profile.");
        return;
      }
      toast.success(isActive ? "Profile deactivated." : "Profile reactivated.");
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  async function removePhoto() {
    setRemovingPhoto(true);
    try {
      const res = await fetch(`/api/admin/connect-profiles/${userId}/remove-photo`, {
        method: "POST",
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Couldn't remove this photo.");
        return;
      }
      toast.success("Photo removed and profile deactivated.");
      setConfirmRemove(false);
      router.refresh();
    } finally {
      setRemovingPhoto(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleActive}
        disabled={toggling}
        className={
          isActive
            ? "border-amber-400/40 text-amber-400 hover:bg-amber-400/10"
            : "border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10"
        }
      >
        {toggling ? "…" : isActive ? "Deactivate" : "Reactivate"}
      </Button>
      {hasPhoto && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmRemove(true)}
            className="border-red-500/40 text-red-400 hover:bg-red-500/10"
          >
            Remove photo
          </Button>
          <DoubleConfirmDialog
            open={confirmRemove}
            onOpenChange={setConfirmRemove}
            title="Remove this Connect photo?"
            description="Deletes the photo from storage and deactivates the profile - they'll need to re-upload before an admin can reactivate it."
            confirmLabel="Remove photo"
            danger
            busy={removingPhoto}
            onConfirm={removePhoto}
          />
        </>
      )}
    </div>
  );
}
