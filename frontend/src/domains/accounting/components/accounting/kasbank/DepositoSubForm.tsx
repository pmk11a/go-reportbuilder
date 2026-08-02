import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/overlay/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/overlay/dialog";
import { Input } from "@/shared/ui/form/input";
import { Label } from "@/shared/ui/form/label";
import type { IDeposito } from "../../../types/kasbank";

const formSchema = z.object({
	nodeposito: z.string().min(1, "No. Deposito wajib diisi"),
	bank: z.string().min(1, "Bank wajib diisi"),
	nominal: z.number().min(0, "Nominal tidak boleh negatif"),
	bunga: z.number().min(0, "Bunga tidak boleh negatif"),
	tglbuka: z.string(),
	tgljatuhtempo: z.string(),
	statusdeposito: z.string(),
	keterangan: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface DepositoSubFormProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (deposito: IDeposito) => void;
	initialData?: IDeposito;
	defaultNominal?: number;
}

export function DepositoSubForm({
	open,
	onClose,
	onConfirm,
	initialData,
	defaultNominal,
}: DepositoSubFormProps) {
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
			nodeposito: "",
			bank: "",
			nominal: 0,
			bunga: 0,
			tglbuka: new Date().toISOString().split("T")[0],
			tgljatuhtempo: new Date().toISOString().split("T")[0],
			statusdeposito: "0",
			keterangan: "",
		},
	});

	useEffect(() => {
		if (open) {
			if (initialData) {
				reset({
					nodeposito: initialData.nodeposito,
					bank: initialData.bank,
					nominal: initialData.nominal,
					bunga: initialData.bunga,
					tglbuka: initialData.tglbuka?.split("T")[0] ?? "",
					tgljatuhtempo: initialData.tgljatuhtempo?.split("T")[0] ?? "",
					statusdeposito: initialData.statusdeposito,
					keterangan: initialData.keterangan,
				});
			} else {
				reset({
					nodeposito: "",
					bank: "",
					nominal: defaultNominal ?? 0,
					bunga: 0,
					tglbuka: new Date().toISOString().split("T")[0],
					tgljatuhtempo: new Date().toISOString().split("T")[0],
					statusdeposito: "0",
					keterangan: "",
				});
			}
		}
	}, [open, initialData, defaultNominal, reset]);

	const onSubmit = (values: FormValues) => {
		onConfirm({
			nodeposito: values.nodeposito,
			bank: values.bank,
			nominal: values.nominal,
			bunga: values.bunga,
			tglbuka: values.tglbuka ? new Date(values.tglbuka).toISOString() : null,
			tgljatuhtempo: values.tgljatuhtempo ? new Date(values.tgljatuhtempo).toISOString() : null,
			statusdeposito: values.statusdeposito,
			keterangan: values.keterangan,
			nobukti: "", // to be filled by parent
		});
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Form Input Deposito</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
					<div>
						<Label htmlFor="nodeposito">No. Deposito *</Label>
						<Input id="nodeposito" {...register("nodeposito")} />
						{errors.nodeposito && <p className="text-xs text-rose-500 mt-1">{errors.nodeposito.message}</p>}
					</div>
					<div>
						<Label htmlFor="bank">Bank *</Label>
						<Input id="bank" {...register("bank")} />
						{errors.bank && <p className="text-xs text-rose-500 mt-1">{errors.bank.message}</p>}
					</div>
					<div className="grid grid-cols-2 gap-4">
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
						<div>
							<Label htmlFor="bunga">Bunga (%)</Label>
							<Input
								id="bunga"
								type="number"
								step="0.01"
								value={watch("bunga")}
								onChange={(e) => setValue("bunga", parseFloat(e.target.value) || 0)}
							/>
							{errors.bunga && <p className="text-xs text-rose-500 mt-1">{errors.bunga.message}</p>}
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor="tglbuka">Tgl. Buka</Label>
							<Input id="tglbuka" type="date" {...register("tglbuka")} />
						</div>
						<div>
							<Label htmlFor="tgljatuhtempo">Tgl. Jatuh Tempo</Label>
							<Input id="tgljatuhtempo" type="date" {...register("tgljatuhtempo")} />
						</div>
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
