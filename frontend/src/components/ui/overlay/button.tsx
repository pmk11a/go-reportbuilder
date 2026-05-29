import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600',
        destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
        outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
        secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 dark:bg-secondary-700 dark:hover:bg-secondary-600',
        ghost: 'text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700',
        link: 'text-primary-600 underline-offset-4 hover:underline dark:text-primary-400',
        primary: 'text-white rounded-xl py-3 px-4 hover:brightness-90 dark:hover:brightness-110 transition-all',
        accent: 'text-white rounded-xl py-3 px-4 hover:brightness-90 dark:hover:brightness-110 transition-all',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    const isGradientVariant = variant === 'primary' || variant === 'accent';
    const gradientStyle = isGradientVariant ? {
      background: variant === 'primary' 
        ? `linear-gradient(to right, var(--color-primary-600), var(--color-primary-700))`
        : `linear-gradient(to right, var(--color-accent-600), var(--color-accent-700))`
    } : undefined;

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        style={gradientStyle}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="inline-block mr-2 animate-spin">⟳</span>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
