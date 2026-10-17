"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemName?: string;
  confirmText?: string;
  requireTypedWord?: string; // e.g. "DELETE"
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  confirmText = "Confirm",
  requireTypedWord,
  isDestructive = true,
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [typedInput, setTypedInput] = useState("");

  const isConfirmedDisabled = requireTypedWord
    ? typedInput.trim() !== requireTypedWord
    : false;

  const handleClose = () => {
    setTypedInput("");
    onOpenChange(false);
  };

  const handleAction = () => {
    onConfirm();
    setTypedInput("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)]">
          {isDestructive ? (
            <AlertTriangle className="h-5 w-5 text-[#EF4444] shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-[#6366F1] shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            <p className="text-[var(--foreground)]">{description}</p>
            {itemName && (
              <p className="mt-1 font-mono font-semibold text-[var(--foreground)] bg-[var(--border)] px-1.5 py-0.5 rounded inline-block text-xs">
                {itemName}
              </p>
            )}
          </div>
        </div>

        {requireTypedWord && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-muted)]">
              To proceed, please type <strong className="font-mono text-[var(--foreground)]">{requireTypedWord}</strong> below:
            </p>
            <Input
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={`Type "${requireTypedWord}" to confirm`}
              className="font-mono text-sm"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isDestructive ? "danger" : "primary"}
            disabled={isConfirmedDisabled || isLoading}
            isLoading={isLoading}
            onClick={handleAction}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
