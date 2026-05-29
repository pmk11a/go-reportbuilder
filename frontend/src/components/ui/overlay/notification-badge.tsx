import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeContainerVariants = cva('relative inline-block');

const badgeCountVariants = cva(
  'absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full min-w-6 h-6 transform translate-x-1/2 -translate-y-1/2',
  {
    variants: {
      variant: {
        destructive: 'bg-destructive text-destructive-foreground',
        default: 'bg-primary-600 text-white',
        secondary: 'bg-secondary text-secondary-foreground',
      },
    },
    defaultVariants: {
      variant: 'destructive',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeContainerVariants> {
  count?: number;
  max?: number;
  children?: React.ReactNode;
  badgeVariant?: 'destructive' | 'default' | 'secondary';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, count = 0, max = 99, children, badgeVariant, ...props }, ref) => {
    const displayCount = count > max ? `${max}+` : count;

    return (
      <div ref={ref} className={cn(badgeContainerVariants(), className)} {...props}>
        {children}
        {count > 0 && (
          <span className={cn(badgeCountVariants({ variant: badgeVariant }))}>
            {displayCount}
          </span>
        )}
      </div>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge as NotificationBadge };
