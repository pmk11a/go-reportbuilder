import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const ratingContainerVariants = cva('flex gap-1');

const ratingStarVariants = cva('transition-all', {
  variants: {
    size: {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
    },
    filled: {
      true: 'text-primary-500',
      false: 'text-slate-300 dark:text-slate-600',
    },
  },
  defaultVariants: {
    size: 'md',
    filled: false,
  },
});

export interface RatingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof ratingContainerVariants> {
  value?: number;
  maxValue?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  ({ className, value = 0, maxValue = 5, onChange, readOnly = false, size = 'md', ...props }, ref) => {
    const [hoverValue, setHoverValue] = React.useState(0);

    const displayValue = hoverValue || value;

    return (
      <div
        ref={ref}
        className={cn(ratingContainerVariants(), className)}
        onMouseLeave={() => setHoverValue(0)}
        {...props}
      >
        {Array.from({ length: maxValue }).map((_, i) => (
          <button
            key={i}
            onClick={() => !readOnly && onChange?.(i + 1)}
            onMouseEnter={() => !readOnly && setHoverValue(i + 1)}
            disabled={readOnly}
            className={cn(
              ratingStarVariants({
                size,
                filled: i < displayValue,
              }),
              readOnly && 'cursor-default'
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full transition-all duration-200"
              style={{
                fill: i < displayValue ? 'var(--color-primary-500)' : 'transparent',
                stroke: i < displayValue ? 'var(--color-primary-500)' : 'var(--color-slate-300)',
              }}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
    );
  }
);
Rating.displayName = 'Rating';

export { Rating };
