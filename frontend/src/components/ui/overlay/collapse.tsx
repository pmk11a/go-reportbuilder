import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const collapseVariants = cva('overflow-hidden transition-all');

export interface CollapseProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof collapseVariants> {
  isOpen?: boolean;
  duration?: number;
}

const Collapse = React.forwardRef<HTMLDivElement, CollapseProps>(
  ({ className, isOpen = false, duration = 300, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(collapseVariants(), className)}
      style={{
        maxHeight: isOpen ? 'auto' : '0',
        opacity: isOpen ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
      {...props}
    >
      {children}
    </div>
  )
);
Collapse.displayName = 'Collapse';

export { Collapse };
