import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const statVariants = cva(
  'relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50'
);

export interface StatProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statVariants> {
  label: string;
  value: string | number;
  change?: { value: number; positive?: boolean };
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
}

const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  ({ className, label, value, change, icon, variant = 'default', ...props }, ref) => {
    const isPrimary = variant === 'primary';
    const isSecondary = variant === 'secondary';
    const isAccent = variant === 'accent';
    
    return (
      <div
        ref={ref}
        className={cn(
          statVariants(),
          isPrimary && 'border-primary-200 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-slate-900 dark:border-primary-800',
          isSecondary && 'border-secondary-200 bg-gradient-to-br from-secondary-50 to-white dark:from-secondary-900/10 dark:to-slate-900 dark:border-secondary-800',
          isAccent && 'border-accent-200 bg-gradient-to-br from-accent-50 to-white dark:from-accent-900/10 dark:to-slate-900 dark:border-accent-800',
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <p className={cn(
              "text-sm font-semibold tracking-wide uppercase",
              isPrimary ? "text-primary-600 dark:text-primary-400" : "text-slate-500 dark:text-slate-400"
            )}>{label}</p>
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{value}</h3>
            
            {change && (
              <div className="flex items-center gap-1.5 mt-3">
                <span className={cn(
                  'flex items-center text-xs font-bold px-2 py-0.5 rounded-lg shadow-sm',
                  change.positive 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                )}>
                  {change.positive ? '↑' : '↓'} {Math.abs(change.value)}%
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">vs last month</span>
              </div>
            )}
          </div>

          {icon && (
            <div className={cn(
              "p-4 rounded-2xl shadow-sm transition-transform hover:scale-110 duration-300",
              isPrimary ? "bg-primary-600 text-white shadow-primary-500/20" : 
              isSecondary ? "bg-secondary-600 text-white" :
              isAccent ? "bg-accent-500 text-white" :
              "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700"
            )}>
              {icon}
            </div>
          )}
        </div>
        
        {/* Subtle background decoration */}
        {(isPrimary || isSecondary || isAccent) && (
          <div className={cn(
            "absolute -right-4 -bottom-4 w-32 h-32 rounded-full blur-3xl opacity-20",
            isPrimary ? "bg-primary-500" : isSecondary ? "bg-secondary-500" : "bg-accent-500"
          )} />
        )}
      </div>
    );
  }
);
Stat.displayName = 'Stat';

export { Stat };
