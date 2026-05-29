import { useThemeStore } from "@/store/themeStore";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
    const { isDark, toggleTheme } = useThemeStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <button
            onClick={toggleTheme}
            className={`rounded-full transition-all duration-300 hover:bg-white/20 active:scale-95 group overflow-hidden ${className || ""}`}
            aria-label="Toggle theme"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            <div className="relative w-10 h-10 flex items-center justify-center">
                {isDark ? (
                    // Moon Icon (Animated)
                    <svg
                        className="w-full h-full text-blue-400 transition-transform duration-500 rotate-0 group-hover:rotate-12"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </svg>
                ) : (
                    // Sun Icon with Rays (Matching IUser Request)
                    <div className="bg-white w-10 h-10 p-2 rounded-full shadow-sm">
                        <svg
                            className="w-full h-full text-amber-500 transition-transform duration-500 rotate-0 group-hover:rotate-90"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg">
                            <circle
                                cx="12"
                                cy="12"
                                r="5"
                                fill="currentColor"
                            />
                            <line
                                x1="12"
                                y1="1"
                                x2="12"
                                y2="3"
                            />
                            <line
                                x1="12"
                                y1="21"
                                x2="12"
                                y2="23"
                            />
                            <line
                                x1="4.22"
                                y1="4.22"
                                x2="5.64"
                                y2="5.64"
                            />
                            <line
                                x1="18.36"
                                y1="18.36"
                                x2="19.78"
                                y2="19.78"
                            />
                            <line
                                x1="1"
                                y1="12"
                                x2="3"
                                y2="12"
                            />
                            <line
                                x1="21"
                                y1="12"
                                x2="23"
                                y2="12"
                            />
                            <line
                                x1="4.22"
                                y1="19.78"
                                x2="5.64"
                                y2="18.36"
                            />
                            <line
                                x1="18.36"
                                y1="5.64"
                                x2="19.78"
                                y2="4.22"
                            />
                        </svg>
                    </div>
                )}
            </div>
        </button>
    );
}
