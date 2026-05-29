import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const breadcrumbVariants = cva('flex items-center gap-2');

const breadcrumbLinkVariants = cva('text-primary-600 hover:underline dark:text-primary-400');

const breadcrumbSeparatorVariants = cva('text-slate-400 dark:text-slate-600');

const breadcrumbTextVariants = cva('text-slate-500 dark:text-slate-400');

export interface BreadcrumbProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof breadcrumbVariants> {
  items: Array<{ label: string; href?: string }>;
  separator?: React.ReactNode;
}

const Breadcrumb = React.forwardRef<HTMLDivElement, BreadcrumbProps>(
  ({ className, items, separator = '/', ...props }, ref) => (
    <nav
      ref={ref}
      className={cn(breadcrumbVariants(), className)}
      aria-label="Breadcrumb"
      {...props}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className={cn(breadcrumbSeparatorVariants())}>{separator}</span>}
          {item.href ? (
            <a href={item.href} className={cn(breadcrumbLinkVariants())}>
              {item.label}
            </a>
          ) : (
            <span className={cn(breadcrumbTextVariants())}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
);
Breadcrumb.displayName = 'Breadcrumb';

export { Breadcrumb };
