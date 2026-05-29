"use client";

import React, { useEffect, useState } from "react";
import { useThemeStore } from "@/store/themeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Initialize theme on client-side only
        useThemeStore.getState().initTheme();
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    return <>{children}</>;
}

export { useThemeStore as useTheme } from "@/store/themeStore";
