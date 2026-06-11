import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const sliderVariants = cva('w-full');

export interface SliderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof sliderVariants> {
  min?: number;
  max?: number;
  value?: number;
  onChange?: (value: number) => void;
  step?: number;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, min = 0, max = 100, value = 50, onChange, step = 1, ...props }, ref) => {
    const percentage = ((value - min) / (max - min)) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(parseFloat(e.target.value));
    };

    return (
      <div ref={ref} className={cn(sliderVariants(), className)} {...props}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          step={step}
          onChange={handleChange}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
          style={{
            accentColor: 'var(--color-primary-600)',
            background: `linear-gradient(to right, var(--color-primary-600) 0%, var(--color-primary-600) ${percentage}%, transparent ${percentage}%, transparent 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{min}</span>
          <span className="font-medium text-foreground">{value}</span>
          <span>{max}</span>
        </div>
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
