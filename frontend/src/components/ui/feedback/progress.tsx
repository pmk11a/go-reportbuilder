import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const progressVariants = cva('relative h-2 w-full overflow-hidden rounded-full bg-muted');

const progressBarVariants = cva('h-full transition-all', {
  variants: {
    variant: {
      default: 'bg-primary-600',
      secondary: 'bg-secondary-600',
      accent: 'bg-accent-600',
      destructive: 'bg-red-600',
      success: 'bg-green-600',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value: number;
  max?: number;
  showLabel?: boolean;
  barVariant?: 'default' | 'secondary' | 'accent' | 'destructive' | 'success';
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, showLabel = false, barVariant, ...props }, ref) => {
    const percentage = Math.min((value / max) * 100, 100);

    return (
      <div
        ref={ref}
        className={cn(progressVariants(), className)}
        {...props}
      >
        <div
          className={cn(progressBarVariants({ variant: barVariant }))}
          style={{ width: `${percentage}%` }}
        />
        {showLabel && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
