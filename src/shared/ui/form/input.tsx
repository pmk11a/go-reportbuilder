import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const inputVariants = cva(
  'w-full px-5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all disabled:opacity-50 text-gray-900 placeholder-gray-500',
  {
    variants: {
      variant: {
        default: 'bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600',
        primary: 'bg-primary-50 border-0 text-gray-900 placeholder-gray-500 hover:bg-primary-100 focus:ring-primary-400 focus:ring-offset-0 dark:bg-slate-800 dark:text-white dark:placeholder-gray-400 dark:hover:bg-slate-700',
        secondary: 'bg-secondary-50 border border-secondary-200 text-gray-900 placeholder-gray-400 hover:border-secondary-300 focus:ring-secondary-500 dark:bg-slate-800 dark:border-secondary-700 dark:text-white dark:placeholder-gray-500 dark:hover:border-secondary-600',
        destructive: 'bg-destructive-50 border border-destructive-200 text-destructive-900 placeholder-destructive-400 hover:border-destructive-300 focus:ring-destructive-500 dark:bg-slate-800 dark:border-destructive-700 dark:text-destructive-100 dark:placeholder-destructive-500 dark:hover:border-destructive-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
