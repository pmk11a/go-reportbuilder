import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
    Users,
    UserCheck,
    Clock,
    Activity,
    CalendarCheck,
    UserX,
    KeyRound,
    LogOut,
    Settings,
    X,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { dashboardService } from "@/domains/dashboard/services/dashboardService";
import { useThemeStore } from "@/shared/stores/themeStore";
import { usePagination } from "@/shared/hooks/usePagination";
import React, { memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/data/table";
import { Each, Show } from "@/shared/ui/layout/Render";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/admin/_layout/dashboard/")({
    component: AdminDashboard,
});

// Optimized Stat Cards - No Blur, Solid Colors
const MainStatCard = memo(({ label, value, icon: Icon, isDark }: any) => (
    <div
        className={`p-8 rounded-[32px] flex justify-between items-center border transition-all duration-300 ${
            isDark ? "bg-[#0f172a] border-white/5 text-white shadow-2xl" : "bg-white border-slate-100 text-[#1e293b] shadow-xl shadow-blue-500/5"
        }`}>
        <div>
            <p className={`text-[12px] font-black mb-2 uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
            <h2 className="text-[54px] font-black leading-none tracking-tighter">{value}</h2>
        </div>
        <div className={`p-5 rounded-3xl ${isDark ? "text-sky-400" : "text-sky-600"}`}>
            <Icon size={36} />
        </div>
    </div>
));

const SubStatCard = memo(({ icon: Icon, value, label, year, color, isDark }: any) => {
    const colorMap: any = {
        blue: isDark ? "bg-blue-500/10 text-blue-400 border-blue-500/10" : "bg-blue-50 text-[#3b82f6] border-blue-100",
        green: isDark ? "bg-green-500/10 text-green-400 border-green-500/10" : "bg-green-50 text-[#22c55e] border-green-100",
        purple: isDark ? "bg-purple-500/10 text-purple-400 border-purple-500/10" : "bg-purple-50 text-[#a855f7] border-purple-100",
        red: isDark ? "bg-red-500/10 text-red-400 border-red-500/10" : "bg-red-50 text-[#ef4444] border-red-100",
        orange: isDark ? "bg-orange-500/10 text-orange-400 border-orange-500/10" : "bg-orange-50 text-[#f97316] border-orange-100",
        yellow: isDark ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/10" : "bg-yellow-50 text-[#eab308] border-blue-100",
    };

    return (
        <div className={`p-8 rounded-[28px] border text-center transition-all duration-300 hover:scale-[1.02] ${colorMap[color]}`}>
            <div className="flex justify-center mb-6">
                <div className={`p-4 rounded-2xl ${isDark ? "bg-white/5" : "bg-white shadow-sm"}`}>
                    <Icon size={32} />
                </div>
            </div>
            <div className={`text-[42px] font-black leading-none ${isDark ? "text-white" : "text-[#1e293b]"}`}>{value}</div>
            <div className="text-[10px] font-black mt-3 opacity-60 uppercase tracking-[0.2em]">
                {year} - {label}
            </div>
        </div>
    );
});

function AdminDashboard() {
    const { t } = useTranslation('dashboard');
    const isDark = useThemeStore((state) => state.isDark);
    const { page, limit, renderPagination } = usePagination(10);

    // Queries
    const { data: statsResponse } = useQuery({
        queryKey: ["dashboard", "stats"],
        queryFn: () => dashboardService.getStats(),
    });

    const { data: withoutFilesResponse } = useQuery({
        queryKey: ["dashboard", "pensiunan-without-files", page, limit],
        queryFn: () => dashboardService.getPensiunanWithoutFiles(page, limit),
    });

    const stats = statsResponse?.data || {
        total_active: 0,
        total_retired: 0,
        active_current_year: 0,
        active_last_year: 0,
        active_next_year: 0,
        retiring_current_year: 0,
        retiring_last_year: 0,
        retiring_next_year: 0,
    };

    const pensiunanList = withoutFilesResponse?.data?.data || [];
    const pensiunanTotal = withoutFilesResponse?.data?.total || 0;

    const currentYear = new Date().getFullYear();

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-700">
            {/* Top Two Main Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MainStatCard
                    label={t("total_active_employees")}
                    value={stats.total_active}
                    icon={Users}
                    isDark={isDark}
                />
                <MainStatCard
                    label={t("total_retired_employees")}
                    value={stats.total_retired}
                    icon={UserCheck}
                    isDark={isDark}
                />
            </div>

            {/* Statistik Karyawan Aktif Section */}
            <div
                className={`rounded-[32px] border p-8 transition-all duration-300 ${isDark ? "bg-[#0f172a] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-blue-500/5"}`}>
                <div className="flex items-center gap-3 mb-8">
                    <div className={`p-2.5 rounded-2xl ${isDark ? "bg-green-500/10 text-green-400" : "bg-green-500/10 text-green-500"}`}>
                        <Activity size={22} />
                    </div>
                    <h3 className={`text-xl font-black ${isDark ? "text-white" : "text-[#1e293b]"}`}>{t("active_employees_stats")}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SubStatCard
                        icon={Users}
                        value={stats.active_current_year}
                        label={t("this_year")}
                        year={currentYear}
                        color="blue"
                        isDark={isDark}
                    />
                    <SubStatCard
                        icon={Activity}
                        value={stats.active_last_year}
                        label={t("last_year")}
                        year={currentYear - 1}
                        color="green"
                        isDark={isDark}
                    />
                    <SubStatCard
                        icon={Activity}
                        value={stats.active_next_year}
                        label={t("next_year")}
                        year={currentYear + 1}
                        color="purple"
                        isDark={isDark}
                    />
                </div>
            </div>

            {/* Statistik Karyawan Pensiun Section */}
            <div
                className={`rounded-[32px] border p-8 transition-all duration-300 ${isDark ? "bg-[#0f172a] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-blue-500/5"}`}>
                <div className="flex items-center gap-3 mb-8">
                    <div className={`p-2.5 rounded-2xl ${isDark ? "bg-orange-500/10 text-orange-400" : "bg-orange-500/10 text-orange-500"}`}>
                        <Clock size={22} />
                    </div>
                    <h3 className={`text-xl font-black ${isDark ? "text-white" : "text-[#1e293b]"}`}>{t("retired_employees_stats")}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SubStatCard
                        icon={CalendarCheck}
                        value={stats.retiring_current_year}
                        label={t("this_year")}
                        year={currentYear}
                        color="red"
                        isDark={isDark}
                    />
                    <SubStatCard
                        icon={UserX}
                        value={stats.retiring_last_year}
                        label={t("last_year")}
                        year={currentYear - 1}
                        color="orange"
                        isDark={isDark}
                    />
                    <SubStatCard
                        icon={Clock}
                        value={stats.retiring_next_year}
                        label={t("next_year")}
                        year={currentYear + 1}
                        color="yellow"
                        isDark={isDark}
                    />
                </div>
            </div>

            {/* Table Section: Pensiunan Tanpa Berkas */}
            <div
                className={`rounded-[32px] border overflow-hidden transition-all duration-300 ${isDark ? "bg-[#0f172a] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-blue-500/5"}`}>
                <div className="p-8 flex justify-between items-center border-b border-white/5 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-orange-500/20">
                            !
                        </div>
                        <h3 className={`text-xl font-black ${isDark ? "text-white" : "text-[#1e293b]"}`}>{t("retired_no_docs")}</h3>
                    </div>
                    <span className="bg-orange-500/10 text-orange-500 text-xs font-black px-5 py-2 rounded-full uppercase tracking-wider border border-orange-500/20">
                        {t("pensiunan_count", { count: pensiunanTotal })}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("headers.no")}</TableHead>
                                <TableHead>{t("headers.name")}</TableHead>
                                <TableHead>{t("headers.employee_no")}</TableHead>
                                <TableHead>{t("headers.birth_date")}</TableHead>
                                <TableHead>{t("headers.retirement_date")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <Each
                                of={pensiunanList}
                                fallback={
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="py-10 text-center font-medium italic">
                                            {t("all_docs_completed")}
                                        </TableCell>
                                    </TableRow>
                                }>
                                {(pensiun: any, urutan) => (
                                    <TableRow key={pensiun.KODECUSTSUPP}>
                                        <TableCell>{(page - 1) * 10 + urutan + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold">{pensiun.NAMACUSTSUPP}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{pensiun.NoPegawai || "-"}</TableCell>
                                        <TableCell className="font-medium">{pensiun.TglLahir || "-"}</TableCell>
                                        <TableCell className="font-medium">{pensiun.TglPensiun || "-"}</TableCell>
                                    </TableRow>
                                )}
                            </Each>
                        </TableBody>
                    </Table>
                </div>
                <div className={`border-t border-white/5 ${isDark ? "bg-black/20" : "bg-slate-50/10"}`}>
                    {renderPagination({
                        totalPages: withoutFilesResponse?.data?.pagination?.last_page || 1,
                        totalItems: withoutFilesResponse?.data?.pagination?.total || 0,
                        className: "border-t-0 bg-transparent dark:bg-transparent shadow-none",
                    })}
                </div>
                <div className={`p-6 text-center border-t border-white/5 ${isDark ? "bg-black/20" : "bg-slate-50/30"}`}>
                    <p className="text-[12px] text-slate-500 flex items-center justify-center gap-2 font-bold italic">
                        <span className="text-orange-500 not-italic text-lg">|</span> {t("pensiunan_no_docs_footer")}
                    </p>
                </div>
            </div>
        </div>
    );
}

