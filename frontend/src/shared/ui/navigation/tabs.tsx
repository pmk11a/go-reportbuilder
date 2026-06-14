import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const tabsVariants = cva('w-full');

const tabListVariants = cva('flex gap-1 border-b border-border');

const tabTriggerVariants = cva(
  'px-4 py-2 font-medium transition-colors border-b-2 cursor-pointer',
  {
    variants: {
      active: {
        true: 'text-primary-600 border-b-primary-600 dark:text-primary-400 dark:border-b-primary-400',
        false: 'text-slate-500 border-b-transparent hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export interface TabsProps extends VariantProps<typeof tabsVariants> {
  tabs: Array<{ label: string; value: string; content: React.ReactNode }>;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ tabs, defaultValue = tabs[0]?.value, onValueChange, className, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue);

    const handleTabChange = (value: string) => {
      setActiveTab(value);
      onValueChange?.(value);
    };

    return (
      <div className="w-full">
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden">
          {/* Tab List */}
          <div className={cn(tabListVariants(), 'px-4 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800')}>
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={cn(
                  tabTriggerVariants({
                    active: activeTab === tab.value,
                  })
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Tab Content */}
          <div>
            {tabs.find((tab) => tab.value === activeTab)?.content}
          </div>
        </div>
      </div>
    );
  }
);
Tabs.displayName = 'Tabs';

export { Tabs };
