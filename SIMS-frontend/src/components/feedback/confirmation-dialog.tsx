'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmationDialogProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  /** Dialog title. */
  title:         string;
  /** Explanatory body text. */
  description?:  string;
  /** Confirm button label. */
  confirmLabel?: string;
  /** Cancel button label. */
  cancelLabel?:  string;
  /** Whether the action is destructive (red confirm button). */
  destructive?:  boolean;
  /** Shows a loading spinner on the confirm button. */
  loading?:      boolean;
  onConfirm:     () => void | Promise<void>;
  onCancel?:     () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Accessible confirmation dialog for irreversible actions.
 *
 * @example
 * <ConfirmationDialog
 *   open={deleteOpen}
 *   onOpenChange={setDeleteOpen}
 *   title="Delete Exam"
 *   description="This action cannot be undone. The exam and all submissions will be permanently deleted."
 *   destructive
 *   onConfirm={handleDelete}
 * />
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  destructive  = false,
  loading      = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
    onCancel?.();
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" hideClose={loading}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                destructive ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning',
              )}
              aria-hidden="true"
            >
              {destructive ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>

        {description && (
          <DialogBody>
            <DialogDescription>{description}</DialogDescription>
          </DialogBody>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="md"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            size="md"
            loading={loading}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
