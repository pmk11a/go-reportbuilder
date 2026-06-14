import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const accordionVariants = cva('w-full space-y-2');

const accordionItemVariants = cva('border border-border rounded-lg');

const accordionButtonVariants = cva('w-full flex items-center justify-between px-4 py-3 font-medium hover:bg-muted transition-colors');

const accordionContentVariants = cva('px-4 py-3 border-t border-border bg-muted/30');

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionVariants> {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, items, allowMultiple = false, ...props }, ref) => {
    const [openItems, setOpenItems] = React.useState<Set<string>>(new Set());

    const toggleItem = (id: string) => {
      const newOpen = new Set(openItems);
      if (newOpen.has(id)) {
        newOpen.delete(id);
      } else {
        if (!allowMultiple) {
          newOpen.clear();
        }
        newOpen.add(id);
      }
      setOpenItems(newOpen);
    };

    return (
      <div ref={ref} className={cn(accordionVariants(), className)} {...props}>
        {items.map((item) => (
          <div key={item.id} className={cn(accordionItemVariants())}>
            <button
              onClick={() => toggleItem(item.id)}
              className={cn(accordionButtonVariants())}
            >
              <span>{item.title}</span>
              <span
                className={cn(
                  'transition-transform',
                  openItems.has(item.id) ? 'rotate-180' : ''
                )}
              >
                ▼
              </span>
            </button>
            {openItems.has(item.id) && (
              <div className={cn(accordionContentVariants())}>
                {item.content}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
);
Accordion.displayName = 'Accordion';

export { Accordion };
