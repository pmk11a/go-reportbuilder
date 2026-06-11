import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const tagVariants = cva(
  'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-sm',
  {
    variants: {
      variant: {
        default: 'bg-primary-50 text-primary-700 border border-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-900/30',
        secondary: 'bg-secondary-50 text-secondary-700 border border-secondary-100 dark:bg-secondary-900/20 dark:text-secondary-400 dark:border-secondary-900/30',
        primary: 'bg-primary-600 text-white',
        outline: 'border border-slate-200 text-slate-600 bg-transparent dark:border-slate-700 dark:text-slate-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const tagGroupVariants = cva('flex flex-wrap gap-2', {
  variants: {
    spacing: {
      sm: 'gap-1',
      md: 'gap-2',
      lg: 'gap-3',
    },
  },
  defaultVariants: {
    spacing: 'md',
  },
});

export interface TagProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagVariants> {
  removable?: boolean;
  onRemove?: () => void;
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ className, removable = false, onRemove, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(tagVariants({ variant }), className)}
        {...props}
      >
        <span>{children}</span>
        {removable && (
          <button
            onClick={onRemove}
            className="ml-1 inline-flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 w-4 h-4"
            aria-label="Remove tag"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);
Tag.displayName = 'Tag';

export interface TagGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagGroupVariants> {}

const TagGroup = React.forwardRef<HTMLDivElement, TagGroupProps>(
  ({ className, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(tagGroupVariants({ spacing }), className)}
      {...props}
    />
  )
);
TagGroup.displayName = 'TagGroup';

export { Tag, TagGroup };
