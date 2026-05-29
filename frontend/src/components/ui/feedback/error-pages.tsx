import React from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, Home, RefreshCcw, SearchX } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

interface PErrorPageProps {
    title?: string;
    description?: string;
    isLayout?: boolean; // If true, it means it's rendered inside a layout (admin/karyawan)
    error?: Error;
    reset?: () => void;
}

export function NotFoundComponent({ 
    title = "Halaman Tidak Ditemukan", 
    description = "Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.", 
    isLayout = false 
}: PErrorPageProps) {
    const isDark = useThemeStore((state) => state.isDark);
    const router = useRouter();

    return (
        <div className={`flex flex-col items-center justify-center p-4 sm:p-8 ${isLayout ? "h-[75vh]" : "min-h-screen bg-background text-foreground"}`}>
            <div className={`max-w-xl w-full p-8 sm:p-12 rounded-3xl flex flex-col items-center text-center transition-all ${
                isLayout 
                ? (isDark ? "bg-slate-900 border border-slate-800 shadow-2xl" : "bg-white border border-slate-100 shadow-2xl") 
                : ""
            }`}>
                <div className={`p-6 rounded-3xl ${isDark ? "bg-slate-800/50" : "bg-white shadow-sm border border-slate-100"} mb-8`}>
                    <SearchX size={64} className={isDark ? "text-slate-400" : "text-slate-500"} />
                </div>
                <h1 className={`text-5xl md:text-6xl font-black mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
                    404
                </h1>
                <h2 className={`text-xl md:text-2xl font-bold mb-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {title}
                </h2>
                <p className={`max-w-md mx-auto mb-10 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {description}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => router.history.back()}
                        className={`px-8 py-3 rounded-2xl font-bold transition-all w-full sm:w-auto ${
                            isDark 
                            ? "bg-slate-800 hover:bg-slate-700 text-white" 
                            : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm"
                        }`}
                    >
                        Kembali
                    </button>
                    <Link
                        to="/"
                        className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-primary-600/30"
                    >
                        <Home size={20} />
                        Ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}

export function GlobalErrorComponent({ 
    title = "Terjadi Kesalahan", 
    description = "Sistem mengalami masalah saat memproses permintaan Anda.", 
    isLayout = false,
    error,
    reset
}: PErrorPageProps) {
    const isDark = useThemeStore((state) => state.isDark);
    
    return (
        <div className={`flex flex-col items-center justify-center p-4 sm:p-8 ${isLayout ? "h-[75vh]" : "min-h-screen bg-background text-foreground"}`}>
            <div className={`max-w-xl w-full p-8 sm:p-12 rounded-3xl flex flex-col items-center text-center transition-all ${
                isLayout 
                ? (isDark ? "bg-slate-900 border border-slate-800 shadow-2xl" : "bg-white border border-slate-100 shadow-2xl") 
                : ""
            }`}>
                <div className={`p-6 rounded-3xl ${isDark ? "bg-red-500/10" : "bg-red-50 border border-red-100"} mb-8 shadow-sm`}>
                    <AlertTriangle size={64} className={isDark ? "text-red-400" : "text-red-500"} />
                </div>
                <h1 className={`text-3xl md:text-4xl font-black mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
                    {title}
                </h1>
                <p className={`max-w-md mx-auto mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {description}
                </p>
                
                {error && (
                    <div className={`mb-10 p-4 rounded-xl text-left w-full overflow-auto text-sm font-mono border ${isDark ? "bg-black/50 text-red-400 border-red-900/30" : "bg-red-50/50 text-red-600 border-red-100"} shadow-inner`}>
                        {error.message || "Unknown error occurred"}
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    {reset && (
                        <button
                            onClick={reset}
                            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-primary-600/30"
                        >
                            <RefreshCcw size={20} />
                            Coba Lagi
                        </button>
                    )}
                    <Link
                        to="/"
                        className={`px-8 py-3 rounded-2xl font-bold transition-all flex items-center justify-center w-full sm:w-auto ${
                            isDark 
                            ? "bg-slate-800 hover:bg-slate-700 text-white" 
                            : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm"
                        }`}
                    >
                        Ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}
