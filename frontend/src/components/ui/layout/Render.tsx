import React, { ReactNode } from "react";

export interface EachProps<T> {
    of: T[];
    render?: (item: T, index: number) => ReactNode;
    children?: ((item: T, index: number) => ReactNode) | ReactNode;
    fallback?: ReactNode;
}

/**
 * A declarative component for mapping arrays to JSX elements.
 * Supports both `render` prop and Function-as-Child pattern.
 */
export function Each<T>({ of, render, children, fallback }: EachProps<T>) {
    if (!of || of.length === 0) {
        return fallback ? <>{fallback}</> : null;
    }
    
    return (
        <>
            {of.map((item, index) => {
                if (render) return render(item, index);
                if (typeof children === 'function') return (children as Function)(item, index);
                return children;
            })}
        </>
    );
}

export interface ShowProps {
    when: any;
    fallback?: ReactNode;
    children: ReactNode;
}

/**
 * A declarative component for conditional rendering.
 * Replaces the native `{condition && ...}` or `{condition ? ... : ...}` pattern with an HTML-like `<Show />` tag.
 */
export function Show({ when, fallback, children }: ShowProps) {
    return when ? <>{children}</> : fallback ? <>{fallback}</> : null;
}
