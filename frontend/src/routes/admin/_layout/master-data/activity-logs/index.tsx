import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/data/table";
import { Badge } from "@/components/ui/overlay/badge";
import { activityLogService } from "@/services/activityLogService";
import { IActivityLogRes } from "@/types/activity-log";
import { History, Search, RefreshCw, Eye } from "lucide-react";
import { Each, Show } from "@/components/ui/layout/Render";
import { usePagination } from "@/hooks/usePagination";
import { Skeleton } from "@/components/ui/feedback/skeleton";

export const Route = createFileRoute("/admin/_layout/master-data/activity-logs/")({
    component: ActivityLogsPage,
});

function ActivityLogsPage() {
    const isDark = useThemeStore((state) => state.isDark);
    const [logs, setLogs] = useState<IActivityLogRes[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLog, setSelectedLog] = useState<IActivityLogRes | null>(null);

    const [total, setTotal] = useState(0);

    const { page, setPage, limit, renderPagination } = usePagination(10);

    useEffect(() => {
        fetchLogs();
    }, [page, limit]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await activityLogService.getActivityLogs(page, limit);
            if (res.success) {
                setLogs(res.data);
                setTotal(res.meta?.total || res.pagination?.total || 0);
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getActionBadge = (action: string) => {
        if (action.includes("CREATE")) return <Badge variant="success">{action}</Badge>;
        if (action.includes("UPDATE")) return <Badge variant="info">{action}</Badge>;
        if (action.includes("DELETE")) return <Badge variant="danger">{action}</Badge>;
        return <Badge variant="default">{action}</Badge>;
    };

    // Simple client-side filtering for demonstration, real search should be server-side
    const filteredLogs = logs.filter(
        (log) =>
            log.aktivitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.pemakai.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.keterangan.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari aktivitas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-full py-2 bg-slate-50 dark:bg-slate-950 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium transition-all dark:text-white placeholder:text-slate-400"
                            />
                        </div>
                        <button
                            onClick={() => setPage(1)}
                            className={`px-6 py-2 rounded-r-lg border font-semibold text-sm transition-all ${
                                isDark
                                    ? "bg-slate-700 border-slate-700 text-white hover:bg-slate-600"
                                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                            }`}>
                            Cari
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchLogs}
                            className={`flex items-center px-4 py-2 rounded-lg border font-semibold text-sm transition-all ${
                                isDark
                                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}>
                            <RefreshCw
                                size={16}
                                className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
                            />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal & Waktu</TableHead>
                                <TableHead>Aktivitas</TableHead>
                                <TableHead>Oleh</TableHead>
                                <TableHead>Ref (NoBukti)</TableHead>
                                <TableHead>Modul</TableHead>
                                <TableHead className="text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: limit }).map((_, index) => (
                                    <TableRow key={`skeleton-${index}`}>
                                        <TableCell>
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-3 w-16 mt-1" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-32" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-16" />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Skeleton className="h-8 w-8 mx-auto rounded-md" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center py-8 text-slate-500">
                                        Tidak ada data log aktivitas ditemukan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log: IActivityLogRes) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{new Date(log.tanggal).toLocaleDateString("id-ID")}</span>
                                                <span className="text-xs text-slate-500">{new Date(log.tanggal).toLocaleTimeString("id-ID")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getActionBadge(log.aktivitas)}</TableCell>
                                        <TableCell>
                                            <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{log.pemakai}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm">{log.no_bukti}</span>
                                        </TableCell>
                                        <TableCell>{log.sumber}</TableCell>
                                        <TableCell className="text-center">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    isDark
                                                        ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                                                        : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                                                }`}
                                                title="Lihat Detail">
                                                <Eye size={18} />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Section */}
                <div className={`p-4 border-t ${isDark ? "border-slate-700/50" : "border-slate-200"}`}>
                    {renderPagination({ totalPages: Math.ceil(total / limit), totalItems: total })}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setSelectedLog(null)}>
                    <div
                        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white"}`}
                        onClick={(e) => e.stopPropagation()}>
                        <div className={`p-6 border-b flex justify-between items-center ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                            <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Detail Perubahan</h2>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Aktivitas</p>
                                    <div>{getActionBadge(selectedLog.aktivitas)}</div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Waktu</p>
                                    <p className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                        {new Date(selectedLog.tanggal).toLocaleString("id-ID")}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Pelaku (IUser ID)</p>
                                    <p className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{selectedLog.pemakai}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Referensi</p>
                                    <p className={`font-mono text-sm ${isDark ? "text-sky-400" : "text-sky-600"}`}>{selectedLog.no_bukti}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Raw Data (Keterangan)</p>
                                <pre
                                    className={`p-4 rounded-xl text-sm overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed ${
                                        isDark
                                            ? "bg-black/50 text-emerald-400 border border-slate-800"
                                            : "bg-slate-50 text-emerald-700 border border-slate-200"
                                    }`}>
                                    {selectedLog.keterangan || "Tidak ada detail payload."}
                                </pre>
                            </div>
                        </div>

                        <div
                            className={`p-4 border-t flex justify-end ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50"}`}>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className={`px-6 py-2 rounded-xl font-bold transition-all ${
                                    isDark
                                        ? "bg-slate-800 hover:bg-slate-700 text-white"
                                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}>
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
