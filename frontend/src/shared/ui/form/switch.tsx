import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const switchTrackVariants = cva('w-10 h-6 rounded-full transition-colors', {
  variants: {
    checked: {
      true: 'bg-primary-600',
      false: 'bg-slate-200 dark:bg-slate-700 border border-transparent',
    },
  },
  defaultVariants: {
    checked: false,
  },
});

const switchThumbVariants = cva(
  'w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5',
  {
    variants: {
      checked: {
        true: 'translate-x-4',
        false: 'translate-x-0.5',
      },
    },
    defaultVariants: {
      checked: false,
    },
  }
);

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'checked'>,
    VariantProps<typeof switchTrackVariants> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked);

    const handleChange = () => {
      const newState = !isChecked;
      setIsChecked(newState);
      onCheckedChange?.(newState);
    };

    return (
      <label className={cn('relative inline-flex items-center cursor-pointer', className)}>
        <input
          ref={ref}
          type="checkbox"
          checked={isChecked}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />
        <div className={cn(switchTrackVariants({ checked: isChecked }))}>
          <div className={cn(switchThumbVariants({ checked: isChecked }))} />
        </div>
      </label>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
