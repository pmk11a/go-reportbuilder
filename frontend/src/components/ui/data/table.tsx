import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const tableVariants = cva("w-full caption-bottom text-sm text-left text-slate-500 dark:text-slate-400");

const tableHeaderVariants = cva(
    "text-xs text-white dark:text-primary-400 uppercase bg-primary-600 dark:bg-white/5 border-b-2 border-primary-700 dark:border-white/10 [&_tr]:hover:bg-transparent",
);

const tableBodyVariants = cva("");

const tableFooterVariants = cva("border-t border-slate-200 bg-slate-50/50 font-medium dark:border-slate-800 dark:bg-slate-900/30");

const tableRowVariants = cva(
    "border-b border-primary-300 dark:border-white/5 hover:bg-primary-50/50 dark:hover:bg-white/5 transition-colors data-[state=selected]:bg-primary-50 dark:data-[state=selected]:bg-white/10",
);

const tableHeadVariants = cva("px-4 py-4 font-semibold tracking-wider text-left align-middle [&:has([role=checkbox])]:pr-0");

const tableCellVariants = cva("px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0");

const tableCaptionVariants = cva("mt-4 text-sm text-slate-500 dark:text-slate-400");

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement>, VariantProps<typeof tableVariants> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
        <table
            ref={ref}
            className={cn(tableVariants(), className)}
            {...props}
        />
    </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
    <thead
        ref={ref}
        className={cn(tableHeaderVariants(), className)}
        {...props}
    />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn(tableBodyVariants(), className)}
        {...props}
    />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={cn(tableFooterVariants(), className)}
        {...props}
    />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(tableRowVariants(), className)}
        {...props}
    />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(tableHeadVariants(), className)}
        {...props}
    />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn(tableCellVariants(), className)}
        {...props}
    />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(({ className, ...props }, ref) => (
    <caption
        ref={ref}
        className={cn(tableCaptionVariants(), className)}
        {...props}
    />
));
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
