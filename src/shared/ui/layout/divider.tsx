import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const dividerVariants = cva('bg-border', {
  variants: {
    orientation: {
      horizontal: 'my-4 h-px w-full',
      vertical: 'h-full w-px',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
});

const dividerLabelVariants = cva('flex items-center gap-4 my-4');

const dividerLineVariants = cva('flex-1 h-px bg-border');

export interface DividerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerVariants> {
  text?: string;
  variant?: 'horizontal' | 'vertical';
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, text, variant = 'horizontal', ...props }, ref) => {
    const orientation = variant === 'vertical' ? 'vertical' : 'horizontal';

    if (variant === 'vertical') {
      return (
        <div
          ref={ref}
          className={cn(dividerVariants({ orientation }), className)}
          {...props}
        />
      );
    }

    if (text) {
      return (
        <div
          ref={ref}
          className={cn(dividerLabelVariants(), className)}
          {...props}
        >
          <div className={cn(dividerLineVariants())} />
          <span className="text-sm text-muted-foreground">{text}</span>
          <div className={cn(dividerLineVariants())} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(dividerVariants({ orientation }), className)}
        {...props}
      />
    );
  }
);
Divider.displayName = 'Divider';

export { Divider };
