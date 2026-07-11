import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/overlay/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/overlay/dialog";
import { Input } from "@/shared/ui/form/input";
import { Label } from "@/shared/ui/form/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/form/select";
import type { IGiro } from "../../types/kasbank";

const formSchema = z.object({
	nogiro: z.string().min(1, "No. Giro wajib diisi"),
	bank: z.string().min(1, "Bank wajib diisi"),
	nominal: z.number().min(0, "Nominal tidak boleh negatif"),
	tglterbit: z.string(),
	tgljatuhtempo: z.string(),
	statusgiro: z.string(),
	tipe: z.string(),
	keterangan: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface GiroSubFormProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (giro: IGiro) => void;
	initialData?: IGiro;
	defaultTipe?: string; // from ResolveSubTransaction response statusP/L
	defaultNominal?: number;
}

export function GiroSubForm({
	open,
	onClose,
	onConfirm,
	initialData,
	defaultTipe,
	defaultNominal,
}: GiroSubFormProps) {
	const { t } = useTranslation(["accounting", "common"]);

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			nogiro: "",
			bank: "",
			nominal: 0,
			tglterbit: new Date().toISOString().split("T")[0],
			tgljatuhtempo: new Date().toISOString().split("T")[0],
			statusgiro: "0",
			tipe: "PT",
			keterangan: "",
		},
	});

	useEffect(() => {
		if (open) {
			if (initialData) {
				reset({
					nogiro: initialData.nogiro,
					bank: initialData.bank,
					nominal: initialData.nominal,
					tglterbit: initialData.tglterbit?.split("T")[0] ?? "",
					tgljatuhtempo: initialData.tgljatuhtempo?.split("T")[0] ?? "",
					statusgiro: initialData.statusgiro,
					tipe: initialData.tipe,
					keterangan: initialData.keterangan,
				});
			} else {
				reset({
					nogiro: "",
					bank: "",
					nominal: defaultNominal ?? 0,
					tglterbit: new Date().toISOString().split("T")[0],
					tgljatuhtempo: new Date().toISOString().split("T")[0],
					statusgiro: "0",
					tipe: defaultTipe ?? "PT",
					keterangan: "",
				});
			}
		}
	}, [open, initialData, defaultTipe, defaultNominal, reset]);

	const onSubmit = (values: FormValues) => {
		onConfirm({
			nogiro: values.nogiro,
			bank: values.bank,
			nominal: values.nominal,
			tglterbit: values.tglterbit ? new Date(values.tglterbit).toISOString() : null,
			tgljatuhtempo: values.tgljatuhtempo ? new Date(values.tgljatuhtempo).toISOString() : null,
			statusgiro: values.statusgiro,
			tipe: values.tipe,
			keterangan: values.keterangan,
			nobukti: "", // to be filled by parent
		});
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Form Input Giro</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
					<div>
						<Label htmlFor="nogiro">No. Giro *</Label>
						<Input id="nogiro" {...register("nogiro")} />
						{errors.nogiro && <p className="text-xs text-rose-500 mt-1">{errors.nogiro.message}</p>}
					</div>
					<div>
						<Label htmlFor="bank">Bank *</Label>
						<Input id="bank" {...register("bank")} />
						{errors.bank && <p className="text-xs text-rose-500 mt-1">{errors.bank.message}</p>}
					</div>
					<div>
						<Label htmlFor="nominal">Nominal *</Label>
						<Input
							id="nominal"
							type="number"
							step="0.01"
							value={watch("nominal")}
							onChange={(e) => setValue("nominal", parseFloat(e.target.value) || 0)}
						/>
						{errors.nominal && <p className="text-xs text-rose-500 mt-1">{errors.nominal.message}</p>}
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor="tglterbit">Tgl. Terbit</Label>
							<Input id="tglterbit" type="date" {...register("tglterbit")} />
						</div>
						<div>
							<Label htmlFor="tgljatuhtempo">Tgl. Jatuh Tempo</Label>
							<Input id="tgljatuhtempo" type="date" {...register("tgljatuhtempo")} />
						</div>
					</div>
					<div>
						<Label htmlFor="tipe">Tipe Giro</Label>
						<Select
							value={watch("tipe")}
							onValueChange={(v) => setValue("tipe", v)}
						>
							<SelectTrigger id="tipe">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="PT">Piutang Giro (PT)</SelectItem>
								<SelectItem value="HT">Hutang Giro (HT)</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="keterangan">Keterangan</Label>
						<Input id="keterangan" {...register("keterangan")} />
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							{t("actions.cancel")}
						</Button>
						<Button type="submit">
							{t("actions.confirm")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
