import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/shared/stores/themeStore";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/shared/ui/data/table";
import { Badge } from "@/shared/ui/overlay/badge";
import { Button } from "@/shared/ui";
import { Input } from "@/shared/ui/form/input";
import { activityLogService } from "@/domains/activity/services/activityLogService";
import { IActivityLogRes } from "@/domains/activity/types/activity-log";
import { History, Search, RefreshCw, Eye } from "lucide-react";
import { Each, Show } from "@/shared/ui/layout/Render";
import { usePagination } from "@/shared/hooks/usePagination";
import { Skeleton } from "@/shared/ui/feedback/skeleton";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/admin/_layout/master-data/activity-logs/")({
    component: ActivityLogsPage,
});

function ActivityLogsPage() {
    const { t } = useTranslation('logs');
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

    const filteredLogs = logs.filter(
        (log) =>
            log.aktivitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.pemakai.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.keterangan.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex w-full sm:w-auto items-center">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder={t("activity.search_placeholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 bg-white dark:bg-slate-950 rounded-r-none border-r-0 focus:z-10 focus:ring-secondary-500 text-sm"
                            />
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-l-none rounded-r-xl h-9 px-6 font-semibold flex items-center justify-center"
                            onClick={() => setPage(1)}
                        >
                            {t("activity.search_button")}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchLogs}
                            disabled={isLoading}
                        >
                            <RefreshCw
                                size={16}
                                className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
                            />
                            {t("activity.refresh")}
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("activity.headers.datetime")}</TableHead>
                                <TableHead>{t("activity.headers.activity")}</TableHead>
                                <TableHead>{t("activity.headers.by")}</TableHead>
                                <TableHead>{t("activity.headers.ref")}</TableHead>
                                <TableHead>{t("activity.headers.module")}</TableHead>
                                <TableHead className="text-center">{t("activity.headers.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <Show
                                when={isLoading}
                                fallback={
                                    <Show
                                        when={filteredLogs.length === 0}
                                        fallback={
                                            <Each of={filteredLogs}>
                                                {(log: IActivityLogRes) => (
                                                    <TableRow key={log.id}>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">{new Date(log.tanggal).toLocaleDateString()}</span>
                                                                <span className="text-xs text-slate-500">{new Date(log.tanggal).toLocaleTimeString()}</span>
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
                                                                title={t("activity.detail_title")}>
                                                                <Eye size={18} />
                                                            </button>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Each>
                                        }
                                    >
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center py-8 text-slate-500">
                                                {t("activity.no_data")}
                                            </TableCell>
                                        </TableRow>
                                    </Show>
                                }
                            >
                                <Each of={Array.from({ length: limit })}>
                                    {(_, index) => (
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
                                    )}
                                </Each>
                            </Show>
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
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
                    onClick={() => setSelectedLog(null)}>
                    <div
                        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white"}`}
                        onClick={(e) => e.stopPropagation()}>
                        <div className={`p-6 border-b flex justify-between items-center ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                            <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{t("activity.detail_title")}</h2>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">{t("activity.detail_activity")}</p>
                                    <div>{getActionBadge(selectedLog.aktivitas)}</div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">{t("activity.detail_time")}</p>
                                    <p className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                        {new Date(selectedLog.tanggal).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">{t("activity.detail_user")}</p>
                                    <p className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{selectedLog.pemakai}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">{t("activity.detail_ref")}</p>
                                    <p className={`font-mono text-sm ${isDark ? "text-sky-400" : "text-sky-600"}`}>{selectedLog.no_bukti}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">{t("activity.detail_raw")}</p>
                                <pre
                                    className={`p-4 rounded-xl text-sm overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed ${
                                        isDark
                                            ? "bg-black/50 text-emerald-400 border border-slate-800"
                                            : "bg-slate-50 text-emerald-700 border border-slate-200"
                                    }`}>
                                    {selectedLog.keterangan || t("activity.detail_no_payload")}
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
                                {t("activity.detail_close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
