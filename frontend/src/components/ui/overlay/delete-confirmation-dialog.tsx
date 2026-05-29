'use client';

import { forwardRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationDialog = forwardRef<HTMLDivElement, DeleteConfirmationDialogProps>(
  ({
    open,
    onOpenChange,
    onConfirm,
    title = 'Are you sure?',
    description,
    itemName,
    isDeleting = false,
    ...props
  }, ref) => {
    const defaultDescription = itemName
      ? `This will permanently delete "${itemName}". This action cannot be undone.`
      : 'This action cannot be undone. This will permanently delete the item.';

    return (
      <div ref={ref} {...props}>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <DialogTitle>{title}</DialogTitle>
              </div>
              <DialogDescription className="pt-3">
                {description || defaultDescription}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

DeleteConfirmationDialog.displayName = 'DeleteConfirmationDialog';

