'use client';

import * as React from 'react';
import { Check, Search, X, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

/**
 * Searchable Select Component
 *
 * Enhanced select with built-in search/filter capability.
 * Supports both controlled and uncontrolled modes.
 *
 * @example
 * ```tsx
 * import { SearchableSelect } from '@/shared/ui/form/searchable-select';
 *
 * export function MyComponent() {
 *   const [value, setValue] = React.useState('');
 *
 *   return (
 *     <SearchableSelect
 *       value={value}
 *       onValueChange={setValue}
 *       placeholder="Select an option..."
 *       options={[
 *         { value: 'option1', label: 'Option 1' },
 *         { value: 'option2', label: 'Option 2' },
 *       ]}
 *     />
 *   );
 * }
 * ```
 */

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode; // Optional icon to render in dropdown
}

export interface SearchableSelectProps
  extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  options: SearchableSelectOption[];
  disabled?: boolean;
  onSearchChange?: (value: string) => void;
}

const SearchableSelect = React.forwardRef<
  HTMLDivElement,
  SearchableSelectProps
>(
  (
    {
      id,
      value,
      onValueChange,
      placeholder = 'Select an option...',
      searchPlaceholder = 'Search...',
      options = [],
      disabled = false,
      onSearchChange,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState('');
    const [internalValue, setInternalValue] = React.useState(value || '');
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Sync internal value with prop value
    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const handleSearchChange = (val: string) => {
      setSearchValue(val);
      onSearchChange?.(val);
    };

    const handleSelect = (optionValue: string) => {
      setInternalValue(optionValue);
      onValueChange?.(optionValue);
      setIsOpen(false);
      setSearchValue('');
    };

    // Filter options based on search value and limit to 50 for performance
    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    ).slice(0, 50);

    // Get selected option label
    const selectedLabel = options.find((opt) => opt.value === internalValue)?.label;

    // Close on click outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          contentRef.current &&
          triggerRef.current &&
          !contentRef.current.contains(event.target as Node) &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }

      return undefined;
    }, [isOpen]);

    return (
      <div
        ref={ref}
        className={cn('relative w-full', className)}
        {...props}
      >
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'hover:bg-accent/50 transition-colors'
          )}
        >
          <span className={cn(internalValue ? 'text-foreground' : 'text-muted-foreground')}>
            {selectedLabel || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {internalValue && !disabled && (
              <X
                className="h-4 w-4 cursor-pointer hover:opacity-70"
                onClick={(e) => {
                  e.stopPropagation();
                  setInternalValue('');
                  onValueChange?.('');
                }}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </button>

        {/* Dropdown Content */}
        {isOpen && !disabled && (
          <div
            ref={contentRef}
            className="absolute top-full left-0 right-0 mt-2 z-[100] border border-slate-200 rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  autoFocus
                  className={cn(
                    'flex h-10 w-full rounded-lg border border-slate-100 bg-slate-50 pl-9 pr-3 py-1 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-950'
                  )}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-lg transition-all',
                      'hover:bg-slate-100 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50',
                      internalValue === option.value
                        ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {internalValue === option.value && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                    {option.icon && (
                      <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                        {option.icon}
                      </div>
                    )}
                    <span className="flex-1 truncate">{option.label}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-sm text-slate-400">
                  Tidak ada hasil ditemukan
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

SearchableSelect.displayName = 'SearchableSelect';

export { SearchableSelect };
