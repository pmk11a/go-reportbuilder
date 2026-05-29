import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const kbdVariants = cva(
  'inline-flex items-center gap-1 px-2 py-1 text-sm font-semibold text-foreground bg-muted border border-border rounded'
);

export interface KbdProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> {
  keys?: string[];
}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, keys, children, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(kbdVariants(), className)}
      {...props}
    >
      {keys ? (
        keys.map((key, i) => (
          <React.Fragment key={key}>
            {i > 0 && <span className="text-xs">+</span>}
            <span>{key}</span>
          </React.Fragment>
        ))
      ) : (
        children
      )}
    </kbd>
  )
);
Kbd.displayName = 'Kbd';

export { Kbd };
