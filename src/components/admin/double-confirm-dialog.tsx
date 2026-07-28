"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Two-step confirmation: the first screen states what's about to happen, the
 * second forces an explicit "yes, really" click before the action fires.
 * Used for destructive/irreversible admin actions (remove a guest, grant a
 * comp ticket) where a single misclick shouldn't be enough.
 */
export function DoubleConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  danger,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  function handleOpenChange(next: boolean) {
    if (!next) setStep(1);
    onOpenChange(next);
  }

  const actionClass = danger
    ? "bg-red-600 text-white hover:bg-red-500"
    : "bg-orange-500 text-black hover:bg-orange-400";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 1 ? title : "Confirm again"}</DialogTitle>
          <DialogDescription>
            {step === 1 ? description : "This can't be undone from here. Click again to proceed."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          {step === 1 ? (
            <Button onClick={() => setStep(2)} className={actionClass}>
              Continue
            </Button>
          ) : (
            <Button disabled={busy} onClick={onConfirm} className={actionClass}>
              {busy ? "Working…" : confirmLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
