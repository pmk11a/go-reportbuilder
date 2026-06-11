'use client';
import { forwardRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Button } from './button';

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange}>{children}</Dialog>;
}

interface AlertDialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

export const AlertDialogTrigger = forwardRef<HTMLButtonElement, AlertDialogTriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    if (asChild) {
      return (
        <DialogTrigger asChild>
          <Button ref={ref} {...props}>{children}</Button>
        </DialogTrigger>
      );
    }
    return (
      <DialogTrigger asChild>
        <button type="button" {...props}>{children}</button>
      </DialogTrigger>
    );
  }
);

interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const AlertDialogContent = forwardRef<HTMLDivElement, AlertDialogContentProps>(
  ({ children, className, ...props }, ref) => (
    <DialogContent ref={ref} className={className} {...props}>
      {children}
    </DialogContent>
  )
);

export const AlertDialogHeader = DialogHeader;
export const AlertDialogTitle = DialogTitle;
export const AlertDialogDescription = DialogDescription;
export const AlertDialogFooter = DialogFooter;

export const AlertDialogCancel = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, ...props }, ref) => (
    <Button ref={ref} variant="outline" {...props}>{children}</Button>
  )
);

export const AlertDialogAction = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, ...props }, ref) => (
    <Button ref={ref} {...props}>{children}</Button>
  )
);