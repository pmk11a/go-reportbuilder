import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const emptyStateVariants = cva('flex flex-col items-center justify-center py-12 px-4');

const emptyStateButtonVariants = cva(
  'px-4 py-2 rounded-md transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600',
        outline: 'border border-input text-foreground hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'outline' | 'secondary';
  };
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(emptyStateVariants(), className)}
      {...props}
    >
      {icon && (
        <div className="mb-4 text-4xl text-muted-foreground">{icon}</div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm mb-6 text-center">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(emptyStateButtonVariants({ variant: action.variant }))}
        >
          {action.label}
        </button>
      )}
    </div>
  )
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
