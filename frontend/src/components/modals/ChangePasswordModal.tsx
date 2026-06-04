import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/overlay/dialog";
import { useModalStore } from "@/store/modalStore";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { useThemeStore } from "@/store/themeStore";
import { AlertCircle, KeyRound, X } from "lucide-react";
import { PasswordInput } from "@/components/ui/form/password-input";
import { Button } from "@/components/ui/overlay/button";
import { Label } from "@/components/ui/form/label";
import { useTranslation } from "react-i18next";

export function ChangePasswordModal() {
    const { t } = useTranslation();
    const { modals, closeModal } = useModalStore();
    const isOpen = modals["changePassword"] || false;
    const { toast } = useToast();
    const isDark = useThemeStore((state) => state.isDark);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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
            setModalError(t("auth.change_password.errors.all_required"));
            return;
        }
        if (newPassword.length < 6) {
            setModalError(t("auth.change_password.errors.min_length"));
            return;
        }
        if (newPassword !== confirmPassword) {
            setModalError(t("auth.change_password.errors.mismatch"));
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await authService.changePassword(oldPassword, newPassword);
            if (res.success) {
                toast({
                    title: t("common.success"),
                    description: t("auth.change_password.success_desc"),
                    variant: "success",
                });
                handleOpenChange(false);
            } else {
                setModalError(res.message || t("auth.change_password.errors.fail_update"));
            }
        } catch (err: any) {
            setModalError(err.message || t("api.error.system_error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent hideCloseButton className={`sm:max-w-md p-0 border-0 rounded-[32px] overflow-hidden ${isDark ? "bg-[#0f172a] text-white" : "bg-white text-[#1e293b]"}`}>
                {/* Accessibility requirements */}
                <DialogHeader className="sr-only">
                    <DialogTitle>{t("auth.change_password.title")}</DialogTitle>
                    <DialogDescription>{t("auth.change_password.description")}</DialogDescription>
                </DialogHeader>

                <div className={`relative w-full p-8 border shadow-2xl ${isDark ? "border-white/5" : "border-slate-100"}`}>
                    {/* Modal Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-sky-500/10">
                                <KeyRound size={20} className="text-sky-500" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">{t("auth.change_password.title")}</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleOpenChange(false)}
                            className={`p-2 rounded-full transition-colors cursor-pointer ${isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Error message */}
                    {modalError && (
                        <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/10 text-sm font-bold">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <span>{modalError}</span>
                        </div>
                    )}

                    <form onSubmit={handleResetPassword} className="space-y-5">
                        {/* Password Lama */}
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                {t("auth.change_password.old_password")}
                            </Label>
                            <PasswordInput
                                placeholder={t("auth.change_password.old_password_placeholder")}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                            />
                        </div>

                        {/* Password Baru */}
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                {t("auth.change_password.new_password")}
                            </Label>
                            <PasswordInput
                                placeholder={t("auth.change_password.new_password_placeholder")}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>

                        {/* Konfirmasi Password Baru */}
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                {t("auth.change_password.confirm_password")}
                            </Label>
                            <PasswordInput
                                placeholder={t("auth.change_password.confirm_password_placeholder")}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                className="flex-1"
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                loading={isSubmitting}
                                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white"
                            >
                                {t("common.save")}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
