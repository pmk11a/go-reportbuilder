import * as React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Each } from '@/shared/ui/layout/Render';
import { cn } from '@/shared/utils/cn';

export interface DetailTooltipRow {
  label: string;
  value: React.ReactNode;
}

export interface DetailTooltipProps {
  trigger: React.ReactNode;
  rows: DetailTooltipRow[];
  className?: string;
}

/**
 * Generic "icon/badge + structured detail on hover" tooltip.
 *
 * No global `TooltipProvider` is mounted anywhere in the app (only
 * page-local ones exist, e.g. `shared/ui/navigation/sidebar.tsx` and
 * `routes/(public)/docs/overlay.tsx`), so this component wraps itself in
 * its own `TooltipProvider` to satisfy Radix's Provider-ancestor requirement
 * regardless of where it's rendered.
 */
export function DetailTooltip({ trigger, rows, className }: DetailTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent className={cn('px-3 py-2', className)}>
          <dl className="flex flex-col gap-1">
            <Each of={rows}>
              {(row) => (
                <div className="flex items-center gap-2 text-xs">
                  <dt className="font-semibold text-slate-300 dark:text-slate-400">{row.label}:</dt>
                  <dd className="text-slate-50 dark:text-slate-100">{row.value}</dd>
                </div>
              )}
            </Each>
          </dl>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
