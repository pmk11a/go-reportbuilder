import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const counterVariants = cva('flex items-center gap-0 rounded-lg border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-950 shadow-sm w-fit');

export interface CounterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'value'>,
    VariantProps<typeof counterVariants> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const Counter = React.forwardRef<HTMLDivElement, CounterProps>(
  ({ className, value, onChange, min = 0, max = 100, step = 1, disabled = false, ...props }, ref) => {
    const internalValue = value ?? 0;

    const handleDecrement = (e: React.MouseEvent) => {
      e.preventDefault();
      if (internalValue > min) onChange?.(internalValue - step);
    };

    const handleIncrement = (e: React.MouseEvent) => {
      e.preventDefault();
      if (internalValue < max) onChange?.(internalValue + step);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value) || 0;
      if (newValue >= min && newValue <= max) onChange?.(newValue);
    };

    return (
      <div
        ref={ref}
        className={cn(counterVariants(), className)}
        {...props}
      >
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || internalValue <= min}
          className="flex items-center justify-center w-10 h-10 text-slate-500 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:bg-slate-900 transition-colors border-r dark:border-slate-800"
        >
          −
        </button>
        <input
          type="number"
          value={internalValue}
          onChange={handleChange}
          disabled={disabled}
          className="w-12 text-center border-0 bg-transparent font-bold text-slate-900 dark:text-white outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || internalValue >= max}
          className="flex items-center justify-center w-10 h-10 text-slate-500 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:bg-slate-900 transition-colors border-l dark:border-slate-800"
        >
          +
        </button>
      </div>
    );
  }
);
Counter.displayName = 'Counter';

export { Counter };
