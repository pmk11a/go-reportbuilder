import React, { Fragment, ReactNode } from "react";

export interface EachProps<T> {
    of: T[];
    render?: (item: T, index: number) => ReactNode;
    children?: ((item: T, index: number) => ReactNode) | ReactNode;
    fallback?: ReactNode;
}

const KEY_FIELDS = [
    "id",
    "key",
    "uuid",
    "user_id",
    "session_id",
    "menu_id",
    "config_id",
    "nobukti",
] as const;

function getAutomaticKey<T>(item: T, index: number): React.Key {
    if (item !== null && typeof item === "object") {
        const record = item as Record<string, unknown>;

        for (const field of KEY_FIELDS) {
            const value = record[field];
            if (typeof value === "string" || typeof value === "number") {
                return `${field}:${value}:index:${index}`;
            }
        }

        const idField = Object.keys(record).find((field) => field.endsWith("_id"));
        if (idField) {
            const value = record[idField];
            if (typeof value === "string" || typeof value === "number") {
                return `${idField}:${value}:index:${index}`;
            }
        }
    }

    return `index:${index}`;
}

/**
 * A declarative component for mapping arrays to JSX elements.
 * Supports both `render` prop and Function-as-Child pattern, and assigns
 * stable keys automatically when the item contains an identifier.
 */
export function Each<T>({ of, render, children, fallback }: EachProps<T>) {
    if (!of || of.length === 0) {
        return fallback ? <>{fallback}</> : null;
    }
    
    return (
        <>
            {of.map((item, index) => {
                const renderedNode = render
                    ? render(item, index)
                    : typeof children === "function"
                        ? children(item, index)
                        : children;

                if (React.isValidElement(renderedNode) && renderedNode.key !== null) {
                    return renderedNode;
                }

                return (
                    <Fragment key={getAutomaticKey(item, index)}>
                        {renderedNode}
                    </Fragment>
                );
            })}
        </>
    );
}

export interface ShowProps {
    when: any;
    fallback?: ReactNode;
    children: ReactNode | (() => ReactNode);
}

/**
 * A declarative component for conditional rendering.
 * Replaces the native `{condition && ...}` or `{condition ? ... : ...}` pattern with an HTML-like `<Show />` tag.
 * Supports both a plain `ReactNode` child and the Function-as-Child pattern (mirrors `Each`).
 */
export function Show({ when, fallback, children }: ShowProps) {
    if (!when) {
        return fallback ? <>{fallback}</> : null;
    }

    const renderedNode = typeof children === "function" ? children() : children;
    return <>{renderedNode}</>;
}
