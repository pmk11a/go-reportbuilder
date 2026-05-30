import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface LanguageToggleProps {
    className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
    const { i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const currentLang = i18n.language || 'en';
    const isEn = currentLang.startsWith('en');

    const toggleLanguage = () => {
        const newLang = isEn ? 'id' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className={`rounded-full transition-all duration-300 hover:bg-white/20 active:scale-95 group overflow-hidden ${className || ""}`}
            aria-label="Toggle language"
            title={isEn ? "Switch to Indonesian" : "Switch to English"}>
            <div className="relative w-10 h-10 flex items-center justify-center font-bold text-sm">
                <div className="bg-white dark:bg-transparent w-10 h-10 flex items-center justify-center rounded-full text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors shadow-sm dark:shadow-none">
                    {isEn ? 'EN' : 'ID'}
                </div>
            </div>
        </button>
    );
}
