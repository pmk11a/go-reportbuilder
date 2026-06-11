import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/overlay/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form/form";
import { Input } from "@/shared/ui/form/input";
import { Button } from "@/shared/ui/overlay/button";
import { useModalStore } from "@/shared/stores/modalStore";
import { useToast } from "@/shared/hooks/use-toast";
import { useGetPeriode, useSetPeriode } from "@/shared/hooks/useBerkas";
import { useTranslation } from "react-i18next";

export function SetupPeriodeModal() {
    const { t } = useTranslation(['periode', 'common']);
    const { modals, closeModal } = useModalStore();
    const isOpen = modals["setupPeriode"] || false;
    const { toast } = useToast();

    const { data: periodeData, isFetching } = useGetPeriode();
    const setPeriodeMutation = useSetPeriode();

    // Define form schema dynamically so validation messages update on language toggle
    const formSchema = React.useMemo(() => z.object({
        bulan: z.string().min(1, t("month_required")).max(2, t("month_max"))
            .refine(val => {
                const num = parseInt(val, 10);
                return num >= 1 && num <= 12;
            }, t("month_range")),
        tahun: z.string().min(4, t("year_length")).max(4, t("year_length"))
    }), [t]);

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
        const formattedBulan = values.bulan.padStart(2, "0");
        
        setPeriodeMutation.mutate(
            { bulan: formattedBulan, tahun: values.tahun },
            {
                onSuccess: () => {
                    toast({
                        title: t("success_title"),
                        description: t("success_desc", { bulan: formattedBulan, tahun: values.tahun }),
                        variant: "success",
                    });
                    closeModal("setupPeriode");
                },
                onError: (error: any) => {
                    toast({
                        title: t("error_title"),
                        description: error.message || t("error_desc"),
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
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription className="sr-only">{t("description")}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className={`grid grid-cols-2 gap-4 ${isFetching ? 'opacity-50 pointer-events-none' : ''}`}>
                            <FormField
                                control={form.control}
                                name="bulan"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("month")}</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                min={1} 
                                                max={12} 
                                                {...field} 
                                                onBlur={(e) => {
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
                                        <FormLabel>{t("year")}</FormLabel>
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
                                {t("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={setPeriodeMutation.isPending}>
                                {setPeriodeMutation.isPending ? t("saving") : t("save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
