import * as React from 'react';
import { cn } from '@/shared/utils/cn';

interface CustomTooltipRow {
  label: string;
  value: React.ReactNode;
}

interface CustomTooltipProps {
  children: React.ReactNode;
  rows: CustomTooltipRow[];
  className?: string;
}

/**
 * Elegant, floating detail tooltip.
 * Renders a smooth, bordered card with label-value pairs on hover.
 * No Radix dependency — pure CSS transition.
 */
export function CustomTooltip({ children, rows, className }: CustomTooltipProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div
      className={cn('group/tooltip relative inline-flex items-center', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      {visible && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform transition-all duration-200 group-hover/tooltip:opacity-100 opacity-0 scale-95 group-hover/tooltip:scale-100">
          {/* Arrow */}
          <div className="ml-4 h-3 w-3 -translate-y-2 rotate-45 border-l border-t border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800" />

          {/* Card */}
          <div className="min-w-[180px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/50 dark:border-slate-600 dark:bg-slate-800 dark:shadow-slate-900/50">
            {rows.map((row, i) => (
              <div key={i} className="flex items-start gap-2 text-xs first:mt-0 last:mb-0">
                <span className="mt-px font-medium text-slate-500 dark:text-slate-400 shrink-0">{row.label}:</span>
                <span className="text-slate-800 dark:text-slate-100">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
