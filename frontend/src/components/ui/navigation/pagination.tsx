import * as React from 'react';
import { cn } from '@/utils/cn';

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
  variant?: 'normal' | 'ellipsis';
  withPrevNext?: boolean;
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ className, currentPage, totalPages, onPageChange, maxVisible = 5, variant = 'ellipsis', withPrevNext = true, ...props }, ref) => {
    const getPageNumbers = () => {
      const pages = [];
      if (variant === 'normal') {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
        return pages;
      }
      const half = Math.floor(maxVisible / 2);
      let start = Math.max(1, currentPage - half);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      if (start > 1) pages.push(1);
      if (start > 2) pages.push('...');

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push('...');
      if (end < totalPages) pages.push(totalPages);

      return pages;
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center gap-1', className)}
        {...props}
      >
        {withPrevNext && (
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 rounded border border-input hover:bg-muted disabled:opacity-50 text-slate-600 dark:text-slate-300 dark:border-slate-700 font-medium"
          >
            ← Prev
          </button>
        )}

        {getPageNumbers().map((page, i) => (
          <button
            key={i}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={cn(
              'px-2 py-1 rounded border min-w-[32px] transition-colors',
              page === currentPage
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
              page === '...' && 'cursor-default hover:bg-transparent'
            )}
          >
            {page}
          </button>
        ))}

        {withPrevNext && (
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 rounded border border-input hover:bg-muted disabled:opacity-50 text-slate-600 dark:text-slate-300 dark:border-slate-700 font-medium"
          >
            Next →
          </button>
        )}
      </div>
    );
  }
);
Pagination.displayName = 'Pagination';

export { Pagination };
