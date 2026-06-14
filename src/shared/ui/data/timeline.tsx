import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const timelineVariants = cva('relative space-y-0');

const timelineItemVariants = cva(
  'relative flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white shadow-sm ring-1 ring-slate-200 transition-all dark:border-slate-900 dark:bg-slate-900 dark:ring-slate-800 z-10',
  {
    variants: {
      variant: {
        default: 'text-slate-600 dark:text-slate-400',
        primary: 'bg-primary-600 text-white ring-primary-600 dark:bg-primary-600',
        success: 'bg-green-600 text-white ring-green-600',
        warning: 'bg-yellow-500 text-white ring-yellow-500',
        error: 'bg-red-600 text-white ring-red-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TimelineItem extends VariantProps<typeof timelineItemVariants> {
  title: string;
  description?: string;
  time?: string;
  icon?: React.ReactNode;
}

export interface TimelineProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof timelineVariants> {
  items: TimelineItem[];
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, items, ...props }, ref) => (
    <div ref={ref} className={cn(timelineVariants(), 'relative pl-12 py-2', className)} {...props}>
      {/* The Vertical Line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800" />
      
      {items.map((item, index) => {
        return (
          <div key={index} className="relative mb-10 last:mb-0">
            {/* The Dot/Icon */}
            <div className="absolute -left-[52px] top-0 flex items-center justify-center w-10">
              <div className={cn(
                timelineItemVariants({ variant: item.variant }),
                "shadow-sm ring-4 ring-white dark:ring-slate-900"
              )}>
                {item.icon || <span className="text-xs font-bold">{index + 1}</span>}
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{item.title}</h4>
                {item.time && (
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                    {item.time}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-2xl mt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  )
);
Timeline.displayName = 'Timeline';

export { Timeline };
