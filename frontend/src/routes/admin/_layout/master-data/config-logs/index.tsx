import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/shared/stores/themeStore";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/shared/ui/data/table";
import { Badge } from "@/shared/ui/overlay/badge";
import { Button } from "@/shared/ui";
import { Input } from "@/shared/ui/form/input";
import { activityLogService } from "@/domains/activity/services/activityLogService";
import type { IActivityLogConfig, IActivityLogField } from "@/domains/activity/types/activity-log";
import {  Save,   ShieldAlert, FileText, Activity, Search } from "lucide-react";
import { Each, Show } from "@/shared/ui/layout/Render";
import { Skeleton } from "@/shared/ui/feedback/skeleton";
import { useToast } from "@/shared/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/admin/_layout/master-data/config-logs/")({
    component: ConfigLogsPage,
});

function ConfigLogsPage() {
    const { t } = useTranslation(['logs', 'common']);
    const isDark = useThemeStore((state) => state.isDark);
    const { toast } = useToast();
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTables = tables.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const [config, setConfig] = useState<IActivityLogConfig>({
        table_name: "",
        target_table: "",
        display_name: "",
        source_name: "",
        primary_key_field: "ID",
        is_enabled: true,
        log_create: true,
        log_update: true,
        log_delete: true,
        fields: [],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchTables();
    }, []);

    useEffect(() => {
        if (selectedTable) {
            fetchTableConfig(selectedTable);
        }
    }, [selectedTable]);

    const fetchTables = async () => {
        try {
            const res = await activityLogService.getTables();
            if (res.success && res.data) {
                setTables(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch tables", error);
        }
    };

    const fetchTableConfig = async (tableName: string) => {
        setIsLoading(true);
        try {
            const configRes = await activityLogService.getConfigByTableName(tableName);

            // Debug: log response format
            console.log('Config Response:', configRes);

            if (!configRes) {
                throw new Error('No response from config endpoint');
            }

            if (configRes.success && configRes.data) {
                setConfig(configRes.data);
            } else {
                // Fetch columns to build a new config
                const colRes = await activityLogService.getTableColumns(tableName);
                if (colRes && colRes.success && colRes.data) {
                    const cols = colRes.data;
                    setConfig({
                        table_name: tableName,
                        target_table: tableName,
                        display_name: tableName,
                        source_name: "System",
                        primary_key_field: cols.includes("ID") ? "ID" : cols[0],
                        is_enabled: true,
                        log_create: true,
                        log_update: true,
                        log_delete: true,
                        fields: cols.map((c: string, i: number) => ({
                            field_name: c,
                            display_name: c,
                            is_tracked: false,
                            is_sensitive: false,
                            field_type: "string",
                            sort_order: i,
                        })),
                    });
                }
            }
        } catch (error: any) {
            console.error("Failed to fetch config", error);
            toast({
                title: "Error",
                description: error?.message || "Failed to load configuration",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await activityLogService.saveConfig(config);
            toast({
                title: t("success"),
                description: t("config.success_save"),
                variant: "success",
            });
        } catch (error) {
            console.error("Failed to save config", error);
            toast({
                title: t("error_title"),
                description: t("config.fail_save"),
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Check all/uncheck all tracked fields
    const handleCheckAllTracked = (checked: boolean) => {
        setConfig({
            ...config,
            fields: config.fields.map(field => ({
                ...field,
                is_tracked: checked
            }))
        });
    };

    // Check if all fields are tracked
    const areAllTracked = config.fields && config.fields.length > 0 && config.fields.every(f => f.is_tracked);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden p-4">
                    <h3 className={`font-bold mb-4 px-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}>{t("config.choose_db_table")}</h3>
                    <div className="relative mb-4 px-2">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder={t("config.search_table_placeholder")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                        />
                    </div>
                    <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                        <Each of={filteredTables}>
                            {(table) => (
                                <button
                                    key={table}
                                    onClick={() => setSelectedTable(table)}
                                    className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        selectedTable === table
                                            ? isDark
                                                ? "bg-primary-600 text-white"
                                                : "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                                            : isDark
                                              ? "text-slate-400 hover:bg-slate-700/50"
                                              : "text-slate-600 hover:bg-slate-50"
                                    }`}>
                                    {table}
                                </button>
                            )}
                        </Each>
                    </div>
                </div>

                <div className="md:col-span-3">
                    <Show
                        when={!!selectedTable && !isLoading}
                        fallback={
                            isLoading ? (
                                <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl p-6">
                                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-dashed border-slate-300 dark:border-slate-700">
                                        <Skeleton className="h-8 w-48" />
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-6 w-32" />
                                            <Skeleton className="h-10 w-40 rounded-xl" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6 mb-8">
                                        <div>
                                            <Skeleton className="h-5 w-32 mb-2" />
                                            <Skeleton className="h-10 w-full rounded-lg" />
                                        </div>
                                        <div className="col-span-2">
                                            <Skeleton className="h-5 w-48 mb-2" />
                                            <div className="flex gap-6 mt-3">
                                                <Skeleton className="h-6 w-32" />
                                                <Skeleton className="h-6 w-32" />
                                                <Skeleton className="h-6 w-32" />
                                            </div>
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-48 mb-4" />
                                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{t("config.column_name")}</TableHead>
                                                    <TableHead className="text-center">{t("config.track_changes")}</TableHead>
                                                    <TableHead className="text-center">{t("config.sensitive_data")}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <Each of={Array.from({ length: 5 })}>
                                                    {(_, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>
                                                                <Skeleton className="h-5 w-48" />
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Skeleton className="h-5 w-5 mx-auto rounded" />
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Skeleton className="h-5 w-5 mx-auto rounded" />
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </Each>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`h-full min-h-[400px] flex items-center justify-center rounded-3xl border border-slate-100 dark:border-white/5 ${isDark ? "bg-slate-800/30" : "bg-slate-50"}`}>
                                    <p className={isDark ? "text-slate-500" : "text-slate-400"}>{t("config.select_table_left")}</p>
                                </div>
                            )
                        }>
                        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden p-6 mb-6">
                            <div className="flex justify-between items-center mb-6 pb-6 border-b border-dashed border-slate-300 dark:border-slate-700">
                                <div>
                                    <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
                                        <Activity
                                            size={20}
                                            className={isDark ? "text-primary-400" : "text-primary-600"}
                                        />
                                        {config.table_name}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 bg-slate-100 border-slate-300 dark:bg-slate-700 dark:border-slate-600"
                                            checked={config.is_enabled}
                                            onChange={(e) => setConfig({ ...config, is_enabled: e.target.checked })}
                                        />
                                        <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{t("config.enable_logging")}</span>
                                    </label>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        size="sm"
                                        className="flex items-center gap-2 font-bold transition-all disabled:opacity-50 h-9"
                                    >
                                        <Save size={16} />
                                        {isSaving ? t("config.saving") : t("config.save_config")}
                                    </Button>
                                </div>
                            </div>
 
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                <div>
                                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                        {t("config.primary_key")}
                                    </label>
                                    <Input
                                        type="text"
                                        value={config.primary_key_field}
                                        onChange={(e) => setConfig({ ...config, primary_key_field: e.target.value })}
                                        className="h-9 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                        {t("config.tracked_operations")}
                                    </label>
                                    <div className="flex gap-6 mt-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={config.log_create}
                                                onChange={(e) => setConfig({ ...config, log_create: e.target.checked })}
                                                className="w-4 h-4 rounded text-green-500"
                                            />
                                            <Badge variant="success">CREATE (INSERT)</Badge>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={config.log_update}
                                                onChange={(e) => setConfig({ ...config, log_update: e.target.checked })}
                                                className="w-4 h-4 rounded text-blue-500"
                                            />
                                            <Badge variant="info">UPDATE</Badge>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={config.log_delete}
                                                onChange={(e) => setConfig({ ...config, log_delete: e.target.checked })}
                                                className="w-4 h-4 rounded text-red-500"
                                            />
                                            <Badge variant="danger">DELETE</Badge>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                <FileText size={18} />
                                {t("config.column_config")}
                            </h3>

                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("config.column_name")}</TableHead>
                                            <TableHead className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span>{t("config.track_changes")}</span>
                                                    <Button
                                                        size="sm"
                                                        variant={areAllTracked ? "default" : "outline"}
                                                        onClick={() => handleCheckAllTracked(!areAllTracked)}
                                                        className="h-7 px-2 text-xs font-medium"
                                                        title={areAllTracked ? "Uncheck all" : "Check all"}
                                                    >
                                                        {areAllTracked ? "✓ All" : "All"}
                                                    </Button>
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-center">{t("config.sensitive_data")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <Each of={config.fields || []}>
                                            {(field: IActivityLogField, index) => (
                                                <TableRow
                                                    key={field.field_name}
                                                    className={index % 2 === 0 ? "" : isDark ? "bg-slate-800/30" : "bg-slate-50"}>
                                                    <TableCell>
                                                        <span className="font-mono text-sm">{field.field_name}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <label className="inline-flex cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={field.is_tracked}
                                                                onChange={(e) => {
                                                                    const newFields = [...config.fields];
                                                                    newFields[index].is_tracked = e.target.checked;
                                                                    setConfig({ ...config, fields: newFields });
                                                                }}
                                                                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 bg-slate-100 border-slate-300 dark:bg-slate-700 dark:border-slate-600"
                                                            />
                                                        </label>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <label className="inline-flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={field.is_sensitive}
                                                                disabled={!field.is_tracked}
                                                                onChange={(e) => {
                                                                    const newFields = [...config.fields];
                                                                    newFields[index].is_sensitive = e.target.checked;
                                                                    setConfig({ ...config, fields: newFields });
                                                                }}
                                                                className="w-5 h-5 rounded text-red-600 focus:ring-red-500 bg-slate-100 border-slate-300 dark:bg-slate-700 dark:border-slate-600 disabled:opacity-30"
                                                            />
                                                            <ShieldAlert
                                                                size={16}
                                                                className={field.is_sensitive ? "text-red-500" : "text-slate-300 dark:text-slate-600"}
                                                            />
                                                        </label>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Each>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    );
}
