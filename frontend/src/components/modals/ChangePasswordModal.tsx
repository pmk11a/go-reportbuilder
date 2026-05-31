import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/overlay/dialog";
import { useModalStore } from "@/store/modalStore";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { useThemeStore } from "@/store/themeStore";
import { AlertCircle, Lock, EyeOff, Eye, X } from "lucide-react";

export function ChangePasswordModal() {
    const { modals, closeModal } = useModalStore();
    const isOpen = modals["changePassword"] || false;
    const { toast } = useToast();
    const isDark = useThemeStore((state) => state.isDark);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            closeModal("changePassword");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setModalError("");
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError("");

        if (!oldPassword || !newPassword || !confirmPassword) {
            setModalError("Semua kolom password wajib diisi.");
            return;
        }
        if (newPassword.length < 6) {
            setModalError("Password baru minimal 6 karakter.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setModalError("Konfirmasi password baru tidak cocok.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await authService.changePassword(oldPassword, newPassword);
            if (res.success) {
                toast({
                    title: "Berhasil",
                    description: "Password berhasil diperbarui.",
                    variant: "success",
                });
                handleOpenChange(false);
            } else {
                setModalError(res.message || "Gagal memperbarui password.");
            }
        } catch (err: any) {
            setModalError(err.message || "Terjadi kesalahan sistem.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className={`sm:max-w-md p-0 border-0 rounded-[32px] overflow-hidden ${isDark ? "bg-[#0f172a] text-white" : "bg-white text-[#1e293b]"}`}>
                {/* Standard Shadcn Dialog requirements */}
                <DialogHeader className="sr-only">
                    <DialogTitle>Ganti Password</DialogTitle>
                    <DialogDescription>Formulir ganti password akun Anda.</DialogDescription>
                </DialogHeader>
                
                <div className={`relative w-full p-8 border shadow-2xl ${isDark ? "border-white/5" : "border-slate-100"}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black tracking-tight">Ganti Password</h3>
                        <button
                            onClick={() => handleOpenChange(false)}
                            className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {modalError && (
                        <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/10 text-sm font-bold">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <span>{modalError}</span>
                        </div>
                    )}

                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div>
                            <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                Password Lama
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showOldPassword ? "text" : "password"}
                                    placeholder="Masukkan password lama"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border font-bold text-sm bg-transparent outline-none focus:ring-2 focus:ring-sky-500 ${
                                        isDark ? "border-white/10 text-white placeholder:text-slate-600" : "border-slate-200 text-slate-800 placeholder:text-slate-400"
                                    }`}
                                />
                                <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors">
                                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                Password Baru
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Masukkan password baru"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border font-bold text-sm bg-transparent outline-none focus:ring-2 focus:ring-sky-500 ${
                                        isDark ? "border-white/10 text-white placeholder:text-slate-600" : "border-slate-200 text-slate-800 placeholder:text-slate-400"
                                    }`}
                                />
                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors">
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                Konfirmasi Password Baru
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Konfirmasi password baru"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border font-bold text-sm bg-transparent outline-none focus:ring-2 focus:ring-sky-500 ${
                                        isDark ? "border-white/10 text-white placeholder:text-slate-600" : "border-slate-200 text-slate-800 placeholder:text-slate-400"
                                    }`}
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors">
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => handleOpenChange(false)}
                                className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all duration-300 active:scale-95 ${
                                    isDark ? "bg-white/5 hover:bg-white/10 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3.5 rounded-2xl font-black text-sm bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition-all duration-300 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
