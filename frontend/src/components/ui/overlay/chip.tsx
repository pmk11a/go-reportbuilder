import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const chipVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        filled: 'bg-primary-600 text-white border-0',
        outlined: 'bg-transparent text-primary-700 border border-primary-600 dark:text-primary-400 dark:border-primary-500',
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  label: string;
  onRemove?: () => void;
  icon?: React.ReactNode;
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, label, onRemove, variant, size, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(chipVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span>{icon}</span>}
        <span>{label}</span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/20 dark:hover:bg-white/20"
            aria-label="Remove chip"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);
Chip.displayName = 'Chip';

export { Chip };
