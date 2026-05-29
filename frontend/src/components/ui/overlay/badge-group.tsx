import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeGroupVariants = cva('flex flex-wrap gap-2', {
  variants: {
    variant: {
      default: 'gap-2',
      compact: 'gap-1',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});



import { Badge, BadgeProps } from '@/components/ui/overlay/badge';

export interface BadgeGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeGroupVariants> {
  badges: Array<{ label: string; variant?: BadgeProps['variant']; className?: string; icon?: React.ReactNode }>;
}

const BadgeGroup = React.forwardRef<HTMLDivElement, BadgeGroupProps>(
  ({ className, badges, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeGroupVariants({ variant }), className)}
      {...props}
    >
      {badges.map((badge, i) => (
        <Badge
          key={i}
          variant={badge.variant}
          className={cn('gap-1 px-3 py-1 text-sm', badge.className)}
        >
          {badge.icon && <span>{badge.icon}</span>}
          <span>{badge.label}</span>
        </Badge>
      ))}
    </div>
  )
);
BadgeGroup.displayName = 'BadgeGroup';

export { BadgeGroup };
