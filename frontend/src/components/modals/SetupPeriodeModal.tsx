import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/overlay/dialog";
import { Input } from "@/components/ui/form/input";
import { Label } from "@/components/ui/form/label";
import { Button } from "@/components/ui/overlay/button";
import { useModalStore } from "@/store/modalStore";
import { useToast } from "@/hooks/use-toast";
import { useThemeStore } from "@/store/themeStore";
import { useGetPeriode, useSetPeriode } from "@/hooks/useBerkas";

export function SetupPeriodeModal() {
    const { modals, closeModal } = useModalStore();
    const isOpen = modals["setupPeriode"] || false;
    const { isDark } = useThemeStore();
    const { toast } = useToast();

    const [bulan, setBulan] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
    const [tahun, setTahun] = useState(String(new Date().getFullYear()));

    const { data: periodeData, isFetching } = useGetPeriode();
    const setPeriodeMutation = useSetPeriode();

    useEffect(() => {
        if (isOpen && periodeData) {
            if (periodeData.BULAN) setBulan(periodeData.BULAN);
            if (periodeData.TAHUN) setTahun(periodeData.TAHUN);
        }
    }, [isOpen, periodeData]);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            closeModal("setupPeriode");
        }
    };

    const handleSave = () => {
        setPeriodeMutation.mutate(
            { bulan, tahun },
            {
                onSuccess: () => {
                    toast({
                        title: "Berhasil",
                        description: "Periode berhasil diubah ke " + bulan + "/" + tahun,
                        variant: "default",
                    });
                    closeModal("setupPeriode");
                },
                onError: (error: any) => {
                    toast({
                        title: "Gagal",
                        description: error.message || "Gagal mengubah periode",
                        variant: "destructive",
                    });
                }
            }
        );
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={handleOpenChange}>
            <DialogContent className={isDark ? "bg-slate-900/60 backdrop-blur-xl text-slate-100 border-slate-800" : "bg-white/80 backdrop-blur-xl border-white/50"}>
                <DialogHeader>
                    <DialogTitle>Setup Periode</DialogTitle>
                    <DialogDescription className="sr-only">Atur bulan dan tahun periode operasional aplikasi</DialogDescription>
                </DialogHeader>

                <div className={`grid gap-6 py-4 ${isFetching ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="bulan">Bulan</Label>
                            <Input
                                id="bulan"
                                type="number"
                                min={1}
                                max={12}
                                value={bulan}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    // Handle padStart manually when on blur or let user type 1 first
                                    if (val.length === 1 && parseInt(val) > 1) {
                                        val = "0" + val;
                                    }
                                    setBulan(val);
                                }}
                                onBlur={(e) => {
                                    let val = e.target.value;
                                    if (val.length === 1) {
                                        setBulan("0" + val);
                                    }
                                }}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tahun">Tahun</Label>
                            <Input
                                id="tahun"
                                type="number"
                                min={2000}
                                value={tahun}
                                onChange={(e) => setTahun(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => closeModal("setupPeriode")}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={setPeriodeMutation.isPending}>
                        {setPeriodeMutation.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
