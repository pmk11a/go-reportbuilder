import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/overlay/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form/form";
import { Input } from "@/components/ui/form/input";
import { Button } from "@/components/ui/overlay/button";
import { useModalStore } from "@/store/modalStore";
import { useToast } from "@/hooks/use-toast";
import { useGetPeriode, useSetPeriode } from "@/hooks/useBerkas";

const formSchema = z.object({
    bulan: z.string().min(1, "Bulan harus diisi").max(2, "Maksimal 2 digit")
        .refine(val => {
            const num = parseInt(val, 10);
            return num >= 1 && num <= 12;
        }, "Bulan harus antara 1-12"),
    tahun: z.string().min(4, "Tahun harus 4 digit").max(4, "Tahun harus 4 digit")
});

export function SetupPeriodeModal() {
    const { modals, closeModal } = useModalStore();
    const isOpen = modals["setupPeriode"] || false;
    const { toast } = useToast();

    const { data: periodeData, isFetching } = useGetPeriode();
    const setPeriodeMutation = useSetPeriode();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            bulan: String(new Date().getMonth() + 1).padStart(2, "0"),
            tahun: String(new Date().getFullYear()),
        },
    });

    useEffect(() => {
        if (isOpen && periodeData) {
            if (periodeData.BULAN) form.setValue("bulan", periodeData.BULAN);
            if (periodeData.TAHUN) form.setValue("tahun", periodeData.TAHUN);
        }
    }, [isOpen, periodeData, form]);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            closeModal("setupPeriode");
            form.reset();
        }
    };

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        // Pad month if single digit just to be safe
        const formattedBulan = values.bulan.padStart(2, "0");
        
        setPeriodeMutation.mutate(
            { bulan: formattedBulan, tahun: values.tahun },
            {
                onSuccess: () => {
                    toast({
                        title: "Berhasil",
                        description: "Periode berhasil diubah ke " + formattedBulan + "/" + values.tahun,
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
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Setup Periode</DialogTitle>
                    <DialogDescription className="sr-only">Atur bulan dan tahun periode operasional aplikasi</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className={`grid grid-cols-2 gap-4 ${isFetching ? 'opacity-50 pointer-events-none' : ''}`}>
                            <FormField
                                control={form.control}
                                name="bulan"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bulan</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                min={1} 
                                                max={12} 
                                                {...field} 
                                                onBlur={(e) => {
                                                    // Auto pad 0 on blur
                                                    if (e.target.value.length === 1) {
                                                        field.onChange("0" + e.target.value);
                                                    }
                                                    field.onBlur();
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="tahun"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tahun</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={2000} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}>
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={setPeriodeMutation.isPending}>
                                {setPeriodeMutation.isPending ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
