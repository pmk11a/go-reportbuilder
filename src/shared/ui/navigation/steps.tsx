import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const stepsVariants = cva('w-full');

const stepIndicatorVariants = cva(
  'flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors',
  {
    variants: {
      state: {
        completed: 'bg-primary-600 text-white',
        current: 'bg-primary-600 text-white',
        pending: 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:border-slate-700',
      },
    },
    defaultVariants: {
      state: 'pending',
    },
  }
);

const stepLineVariants = cva('flex-1 h-1 transition-colors', {
  variants: {
    completed: {
      true: 'bg-primary-600',
      false: 'bg-slate-200 dark:bg-slate-700',
    },
  },
  defaultVariants: {
    completed: false,
  },
});

export interface StepsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stepsVariants> {
  steps: Array<{
    label: string;
    description?: string;
    completed?: boolean;
    current?: boolean;
  }>;
}

const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  ({ className, steps, ...props }, ref) => (
    <div ref={ref} className={cn(stepsVariants(), className)} {...props}>
      <div className="flex gap-4">
        {steps.map((step, index) => {
          const state = step.completed
            ? 'completed'
            : step.current
            ? 'current'
            : 'pending';

          return (
            <div key={index} className="flex flex-col flex-1">
              <div className="flex items-center gap-4">
                <div className={cn(stepIndicatorVariants({ state }))}>
                  {step.completed ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      stepLineVariants({
                        completed: steps[index + 1]?.completed || step.completed,
                      })
                    )}
                  />
                )}
              </div>
              <div className="ml-14 mt-2">
                <p className="font-medium text-sm">{step.label}</p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
);
Steps.displayName = 'Steps';

export { Steps };
