'use client';

import type React from 'react';
import { forwardRef } from 'react';
import { Pagination, type PaginationProps } from './pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/form/select';

interface DataPaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
  limitOptions?: number[];
  infoText?: string | React.ReactNode;
  variant?: PaginationProps['variant'];
  maxVisible?: number;
}

export const DataPagination = forwardRef<HTMLDivElement, DataPaginationProps>(
  ({
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    onPageChange,
    onLimitChange,
    className,
    showLimitSelector = true,
    limitOptions = [5, 10, 25, 50, 100],
    infoText,
    variant = 'ellipsis',
    maxVisible = 3,
    ...props
  }, ref) => {
    // Default info text calculation if not provided
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : currentPage * itemsPerPage;
    const defaultInfoText = totalItems 
      ? `Menampilkan data ${startItem} - ${endItem} dari total ${totalItems} data (Halaman ${currentPage})`
      : `Menampilkan data ${startItem} - ${endItem} (Halaman ${currentPage})`;

    return (
      <div 
        ref={ref} 
        className={`p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 ${className || ''}`} 
        {...props}
      >
        <div className="flex flex-col gap-3">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {infoText || defaultInfoText}
          </div>
          
          {showLimitSelector && onLimitChange && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>Tampilkan</span>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(val) => onLimitChange(Number(val))}
              >
                <SelectTrigger className="h-8 w-16 bg-white dark:bg-slate-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {limitOptions.map((opt) => (
                    <SelectItem key={opt} value={opt.toString()}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>data per halaman</span>
            </div>
          )}
        </div>
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          variant={variant}
          withPrevNext={true}
          maxVisible={maxVisible}
        />
      </div>
    );
  }
);

DataPagination.displayName = 'DataPagination';
