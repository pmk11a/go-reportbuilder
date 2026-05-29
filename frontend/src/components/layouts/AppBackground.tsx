import React from "react";

interface AppBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

export function AppBackground({ children, className = "" }: AppBackgroundProps) {
    return (
        <div className={`relative w-full min-h-screen overflow-x-hidden transition-colors duration-500 login-background ${className}`}>
            {/* Decorative Blobs (Design System) */}
            <div className="blob-container absolute inset-0 z-0 pointer-events-none overflow-hidden" />

            {/* Content Layer */}
            <div className="relative z-10 w-full h-full">{children}</div>
        </div>
    );
}
