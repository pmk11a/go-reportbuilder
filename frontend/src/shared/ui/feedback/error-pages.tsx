import  { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, Check, Copy, Home, RefreshCcw, SearchX } from "lucide-react";
import { useThemeStore } from "@/shared/stores/themeStore";

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
    const router = useRouter();
    const [isCopied, setIsCopied] = useState(false);
    const errorMessage = error?.message || "Unknown error occurred";
    const currentRoute = router.state.location.href;
    const errorStack = error?.stack || "Stack trace tidak tersedia.";
    const errorLocation = errorStack
        .split("\n")
        .slice(1)
        .map((line) => line.trim())
        .find(Boolean) || "File/component tidak tersedia.";
    const diagnosticText = [
        `Route: ${currentRoute}`,
        `Location: ${errorLocation}`,
        `Error: ${errorMessage}`,
        "",
        errorStack,
    ].join("\n");

    const handleCopyError = async () => {
        const copyWithTextarea = () => {
            const textarea = document.createElement("textarea");
            textarea.value = diagnosticText;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
        };

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(diagnosticText);
            } else {
                copyWithTextarea();
            }
        } catch {
            copyWithTextarea();
        }

        setIsCopied(true);
        window.setTimeout(() => setIsCopied(false), 2000);
    };
    
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
                    <div className={`relative mb-10 p-4 pr-12 rounded-xl text-left w-full overflow-auto text-sm border ${isDark ? "bg-black/50 text-red-400 border-red-900/30" : "bg-red-50/50 text-red-600 border-red-100"} shadow-inner`}>
                        <button
                            type="button"
                            onClick={handleCopyError}
                            className={`absolute right-2 top-2 rounded-lg p-2 transition-colors ${
                                isDark
                                    ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                                    : "text-slate-500 hover:bg-white hover:text-slate-900"
                            }`}
                            title={isCopied ? "Berhasil disalin" : "Salin pesan error"}
                            aria-label={isCopied ? "Berhasil disalin" : "Salin pesan error"}
                        >
                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <dl className="space-y-3 font-mono">
                            <div>
                                <dt className="text-xs font-bold uppercase opacity-70">Current Route</dt>
                                <dd className="break-all">{currentRoute}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-bold uppercase opacity-70">File / Component</dt>
                                <dd className="break-all">{errorLocation}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-bold uppercase opacity-70">Error</dt>
                                <dd className="break-words">{errorMessage}</dd>
                            </div>
                        </dl>
                        <details className="mt-4 border-t border-current/20 pt-3">
                            <summary className="cursor-pointer font-sans text-xs font-bold uppercase">
                                Stack Trace
                            </summary>
                            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs">
                                {errorStack}
                            </pre>
                        </details>
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

export function BadRequestComponent({ 
    title = "Permintaan Tidak Valid", 
    description = "Maaf, permintaan yang Anda kirimkan tidak dapat diproses oleh server.", 
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
                <div className={`p-6 rounded-3xl ${isDark ? "bg-orange-500/10" : "bg-orange-50 border border-orange-100"} mb-8 shadow-sm`}>
                    <AlertTriangle size={64} className={isDark ? "text-orange-400" : "text-orange-500"} />
                </div>
                <h1 className={`text-5xl md:text-6xl font-black mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
                    400
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

export function ServerErrorComponent({ 
    title = "Internal Server Error", 
    description = "Maaf, terjadi kesalahan internal pada server kami. Silakan coba beberapa saat lagi.", 
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
                <div className={`p-6 rounded-3xl ${isDark ? "bg-red-500/10" : "bg-red-50 border border-red-100"} mb-8 shadow-sm`}>
                    <AlertTriangle size={64} className={isDark ? "text-red-400" : "text-red-500"} />
                </div>
                <h1 className={`text-5xl md:text-6xl font-black mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
                    500
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
