import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/utils/cn';

const tooltipVariants = cva('relative inline-block');

const tooltipContentVariants = cva(
  'absolute z-50 px-2 py-1 text-sm bg-foreground text-background rounded whitespace-nowrap',
  {
    variants: {
      position: {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
      },
    },
    defaultVariants: {
      position: 'top',
    },
  }
);

export interface TooltipProps extends VariantProps<typeof tooltipVariants> {
  children?: React.ReactNode;
  content?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const TooltipSimple = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, content, position = 'top', className }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const tooltipRef = React.useRef<HTMLDivElement>(null);

    return (
      <div
        ref={ref}
        className={cn(tooltipVariants(), className)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}

        {isVisible && (
          <div
            ref={tooltipRef}
            className={cn(tooltipContentVariants({ position }))}
          >
            {content}
          </div>
        )}
      </div>
    );
  }
);
TooltipSimple.displayName = 'Tooltip';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-50 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-slate-800 dark:text-slate-100 dark:ring-1 dark:ring-slate-700',
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { TooltipSimple as SimpleTooltip, Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };
