import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const loadingStateVariants = cva('flex flex-col items-center justify-center py-12');

export interface LoadingStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingStateVariants> {
  isLoading?: boolean;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ className, isLoading = false, children, fallback, ...props }, ref) => {
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn(loadingStateVariants(), className)}
          {...props}
        >
          {fallback || (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                <div className="absolute top-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-primary-600 dark:border-t-primary-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500 animate-pulse uppercase tracking-widest">Loading...</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }
);
LoadingState.displayName = 'LoadingState';

export { LoadingState };
