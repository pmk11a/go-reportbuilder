import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const codeVariants = cva(
  'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-muted-foreground'
);

export interface CodeProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof codeVariants> {
  language?: string;
}

const Code = React.forwardRef<HTMLElement, CodeProps>(
  ({ className, language, children, ...props }, ref) => (
    <code
      ref={ref}
      className={cn(codeVariants(), className)}
      {...props}
    >
      {children}
    </code>
  )
);
Code.displayName = 'Code';

export { Code };
