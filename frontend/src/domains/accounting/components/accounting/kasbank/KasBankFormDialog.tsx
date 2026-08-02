import { kasbankService } from "@/domains/accounting/services/kasbankService";
import {
	KasBankSelect as KasBankBrowseSelect,
	type KasBankTipe as KasBankBrowseTipe,
} from "@/domains/browse/components/browse/KasBankSelect";
import { AktivaSubForm } from "./AktivaSubForm";
import { DepositoSubForm } from "./DepositoSubForm";
import { GiroSubForm } from "./GiroSubForm";
import { HutangPiutangSubForm } from "./HutangPiutangSubForm";

("use client");

import { zodResolver } from "@hookform/resolvers/zod";

import { Calculator, PenLine, Plus, Trash2 } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { useForm } from "react-hook-form";

import { useTranslation } from "react-i18next";

import { z } from "zod";

import {
	useCreateKasBank,
	useGenerateNoBukti,
	useLookupDevisi,
	useLookupPerkiraanShared,
// @ts-expect-error - unused variable
	useResolveSubTransaction,
	useUpdateKasBank,
} from "@/domains/accounting/hooks/useKasBank";
import { useKasBankDetailList } from "@/domains/accounting/hooks/useKasBankDetail";
import type {
	IAddDetailPayload,
	ICreateKasBankPayload,
	IDeposito,
	IGiro,
	IKasBankHeader,
	KasBankTipe,
} from "@/domains/accounting/types/kasbank";

import { useToast } from "@/shared/hooks/use-toast";

import { Alert } from "@/shared/ui/feedback/alert";

import { Input } from "@/shared/ui/form/input";

import { Label } from "@/shared/ui/form/label";

import { SearchableSelect } from "@/shared/ui/form/searchable-select";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/form/select";

import { Show } from "@/shared/ui/layout/Render";

import { Button } from "@/shared/ui/overlay/button";

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/overlay/dialog";

const TIPE_OPTIONS: KasBankTipe[] = ["BKM", "BKK", "BBM", "BBK"];

// Matches trade-exchange (PHP) "modal-insert.blade.php":
//   Row 1: Transaksi | PerkiraanHd | No Bukti
//   Row 2: Tanggal | Lawan_val (hidden) | Kepada / Terima Dari (note)
// Detail rows live in the "modal-insert-detail" equivalent below.
const formSchema = z.object({
	tanggal: z.string().min(1, "Tanggal wajib diisi"),
	tipeTransHd: z.enum(["BKM", "BKK", "BBM", "BBK"]),
	perkiraanHd: z.string().min(1, "Akun Kas/Bank wajib diisi"),
	note: z.string(),
	devisi: z.string().min(1, "Devisi wajib diisi"),
});

type FormValues = z.infer<typeof formSchema>;

// Display metadata per tipe (mirrors legacy bank-or-kas.js:335-363)
//
// `kelompok` (Y/T) is intentionally no longer here — Kas/Bank filtering is
// now handled by `KasBankSelect` (browse 20011 + NoKira1 parent filter).
const TIPE_META: Record<KasBankTipe, { kasLabel: string; noteLabel: string }> =
	{
		BKM: { kasLabel: "Kas", noteLabel: "Terima Dari" },
		BKK: { kasLabel: "Kas", noteLabel: "Kepada" },
		BBM: { kasLabel: "Bank", noteLabel: "Terima Dari" },
		BBK: { kasLabel: "Bank", noteLabel: "Kepada" },
	};

/**
 * Maps the KasBank transaction type to the browse `kasType` filter:
 *   BKM/BKK → KAS     (browse 20011 + NoKira1=KAS)
 *   BBM/BBK → BANK    (browse 20011 + NoKira1=BANK)
 *
 * Mirrors legacy Delphi:
 *   if Mode='BKK' or Mode='BKM' then NoKira1:='KAS' else NoKira1:='BANK';
 */
const TIPE_TO_KAS_TYPE: Record<KasBankTipe, KasBankBrowseTipe> = {
	BKM: "KAS",
	BKK: "KAS",
	BBM: "BANK",
	BBK: "BANK",
};

interface KasBankFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editData?: IKasBankHeader | null;
	onSuccess?: () => void;
	headerOnly?: boolean;
}

/** Derives detail lines for the API payload from managed state. */
function detailsToPayload(
	details: IAddDetailPayload[],
): ICreateKasBankPayload["details"] {
	return details.map((d) => ({
		perkiraan: d.perkiraan,
		lawan: d.lawan,
		debet: d.debet,
		kredit: d.kredit,
		keterangan: d.keterangan,
		valas: d.valas,
		kurs: d.kurs,
		tphc: d.tphc,
		kodebag: d.kodebag,
		kode_cust_supp: d.kode_cust_supp,
	}));
}

/* ================================================================
   KasBankFormDialog
   ================================================================ */

export function KasBankFormDialog({
	open,
	onOpenChange,
	editData,
	onSuccess,
	headerOnly,
}: KasBankFormDialogProps) {
	const { t } = useTranslation(["accounting", "common"]);
	const { toast } = useToast();
	const [selectedTipe, setSelectedTipe] = useState<KasBankTipe>("BKK");
	const [detailRows, setDetailRows] = useState<IAddDetailPayload[]>([]);
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [editingDetailIdx, setEditingDetailIdx] = useState<number | null>(null);

	const [giroList, setGiroList] = useState<IGiro[]>([]);
	const [depositoList, setDepositoList] = useState<IDeposito[]>([]);
	const [hutPiutList, setHutPiutList] = useState<any[]>([]);
	const [aktivaList, setAktivaList] = useState<any[]>([]);

	const [giroModalOpen, setGiroModalOpen] = useState(false);
	const [depositoModalOpen, setDepositoModalOpen] = useState(false);
	const [hutPiutModalOpen, setHutPiutModalOpen] = useState(false);
	const [aktivaModalOpen, setAktivaModalOpen] = useState(false);
	const [pendingDetailRow, setPendingDetailRow] = useState<{
		row: IAddDetailPayload;
		trigger: "giro" | "deposito" | "hutpiut" | "aktiva";
	} | null>(null);
	const [pendingSubTransResult, setPendingSubTransResult] = useState<any>(null);

	const { data: detailListRes } = useKasBankDetailList(editData?.nobukti ?? "");

	// Dynamic account filter was previously driven by `useLookupPerkiraanShared`
	// with `kelompok=Y/T`. It is now handled by the `KasBankSelect` (browse 20011)
	// component, which uses `kodeBrowse` + parent filter `NoKira1=KAS|BANK` to
	// discriminate Kas-only vs Bank-only rows at the SQL level.

	const { data: devisiData } = useLookupDevisi();
	const devisiOpts = useMemo(
		() =>
			(devisiData ?? []).map((d: any) => ({
				value: d.devisi,
				label: d.namadevisi,
			})),
		[devisiData],
	);

	const createMutation = useCreateKasBank(() => {
		toast({ title: t("messages.created"), variant: "success" });
		onOpenChange(false);
		setDetailRows([]);
		setGiroList([]);
		setDepositoList([]);
		setHutPiutList([]);
		setAktivaList([]);
		onSuccess?.();
	});

	const updateMutation = useUpdateKasBank(editData?.nobukti ?? "", () => {
		toast({ title: t("messages.updated"), variant: "success" });
		onOpenChange(false);
		setDetailRows([]);
		setGiroList([]);
		setDepositoList([]);
		setHutPiutList([]);
		setAktivaList([]);
		onSuccess?.();
	});

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		getValues,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			tanggal: new Date().toISOString().split("T")[0],
			tipeTransHd: "BKK",
			perkiraanHd: "",
			note: "",
			devisi: "",
		},
	});

	// Generate NoBukti only after `watch` is available (useForm above) and
	// only when both `tipe` and `devisi` are populated — the backend rejects
	// empty devisi ("devisi wajib diisi").
	const {
		data: noBuktiData,
		error: noBuktiError,
		isLoading: noBuktiLoading,
		refetch: refetchNoBukti,
	} = useGenerateNoBukti(selectedTipe, watch("devisi"));

	// Effect 1: fires immediately when dialog opens — populate header fields
	useEffect(() => {
		if (open) {
			if (editData) {
				reset({
					tanggal:
						editData.tanggal?.split("T")[0] ??
						new Date().toISOString().split("T")[0],
					tipeTransHd: editData.tipetranshd as KasBankTipe,
					perkiraanHd: editData.perkiraanhd ?? "",
					note: editData.note ?? "",
					devisi: "",
				});
				setSelectedTipe((editData.tipetranshd as KasBankTipe) ?? "BKK");
			} else {
				reset({
					tanggal: new Date().toISOString().split("T")[0],
					tipeTransHd: "BKK",
					perkiraanHd: "",
					note: "",
					devisi: "KANTOR PUSAT",
				});
				setDetailRows([]);
				setGiroList([]);
				setDepositoList([]);
				setHutPiutList([]);
				setAktivaList([]);
				setSelectedTipe("BKK");
			}
		}
	}, [open, editData, reset]);

	// Effect 2: fires when detail API data loads — populate detail-specific fields and rows
	useEffect(() => {
		if (!open || !editData || !detailListRes) return;

		const details: any[] = (detailListRes as any).details || [];

		// Fill detail-specific header fields from first detail row
		if (details.length > 0) {
			const first = details[0];
			setValue("devisi", first.devisi ?? "");
		}

		// Map detail rows
		const mappedRows: IAddDetailPayload[] = details.map((d: any) => ({
			perkiraan: d.perkiraan,
			lawan: d.lawan,
			debet: d.debet,
			kredit: d.kredit,
			keterangan: d.keterangan,
			valas: d.valas,
			kurs: d.kurs,
			kodebag: d.kodebag,
		}));
		setDetailRows(mappedRows);
	}, [open, editData, detailListRes, setValue]);

	// Effect 3: When the backend returns a generated NoBukti in create
	// mode, sync the Tanggal field to whatever date the server will stamp
	// on DBTRANS.Tanggal. The server derives Tanggal from DBPERIODE (not
	// from today) — see defaultTanggal in service.go — so we mirror that
	// here so the user sees the same date in the form as will end up in
	// the saved record. Without this, the date input keeps the wall-clock
	// value from defaultValues and the server may reject the submit with
	// ErrTanggalDiLuarPeriode if today is past the active period.
	useEffect(() => {
		if (!open || editData) return;
		const generatedAt = (noBuktiData as any)?.data?.generatedAt;
		if (!generatedAt) return;
		const isoDate = String(generatedAt).split("T")[0];
		if (isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
			setValue("tanggal", isoDate, { shouldValidate: false, shouldDirty: false });
		}
	}, [open, editData, noBuktiData, setValue]);

	const isPending = createMutation.isPending || updateMutation.isPending;
	const apiError = createMutation.error ?? updateMutation.error;

	// --- Balance helpers ---
	const totalDebet = useMemo(
		() => detailRows.reduce((sum, r) => sum + (r.debet ?? 0), 0),
		[detailRows],
	);
	const totalKredit = useMemo(
		() => detailRows.reduce((sum, r) => sum + (r.kredit ?? 0), 0),
		[detailRows],
	);
	const isBalanced = totalDebet === totalKredit && totalDebet > 0;

	// --- Detail row lifecycle ---
	const currentPerkiraanHd = watch("perkiraanHd");

	function openAddDetail() {
		setEditingDetailIdx(null);
		setDetailModalOpen(true);
	}

	function openEditDetail(idx: number) {
		setEditingDetailIdx(idx);
		setDetailModalOpen(true);
	}

	function handleCloseDetailModal() {
		setDetailModalOpen(false);
		setEditingDetailIdx(null);
	}

	function handleConfirmDetail(
		newRow: IAddDetailPayload,
		subTransResult?: any,
	) {
		const trigger = subTransResult?.trigger;

		if (trigger === "giro") {
			setPendingDetailRow({ row: newRow, trigger });
			setPendingSubTransResult(subTransResult);
			setGiroModalOpen(true);
			// We don't close detail modal yet or add row yet
			return;
		} else if (trigger === "deposito") {
			setPendingDetailRow({ row: newRow, trigger });
			setPendingSubTransResult(subTransResult);
			setDepositoModalOpen(true);
			return;
		} else if (trigger === "hutpiut") {
			setPendingDetailRow({ row: newRow, trigger });
			setPendingSubTransResult(subTransResult);
			setHutPiutModalOpen(true);
			return;
		} else if (trigger === "aktiva") {
			setPendingDetailRow({ row: newRow, trigger });
			setPendingSubTransResult(subTransResult);
			setAktivaModalOpen(true);
			return;
		}

		_finishDetailRow(newRow);
	}

	function _finishDetailRow(newRow: IAddDetailPayload) {
		if (editingDetailIdx !== null) {
			const updated = [...detailRows];
			updated[editingDetailIdx] = newRow;
			setDetailRows(updated);
		} else {
			setDetailRows([...detailRows, newRow]);
		}
		handleCloseDetailModal();
		setPendingDetailRow(null);
		setPendingSubTransResult(null);
	}

	function handleConfirmGiro(giro: IGiro) {
		setGiroList([...giroList, giro]);
		setGiroModalOpen(false);
		if (pendingDetailRow) {
			_finishDetailRow(pendingDetailRow.row);
		}
	}

	function handleConfirmDeposito(deposito: IDeposito) {
		setDepositoList([...depositoList, deposito]);
		setDepositoModalOpen(false);
		if (pendingDetailRow) {
			_finishDetailRow(pendingDetailRow.row);
		}
	}

	function handleConfirmHutPiut(selected: any[]) {
		setHutPiutList([...hutPiutList, ...selected]);
		setHutPiutModalOpen(false);
		if (pendingDetailRow) {
			_finishDetailRow(pendingDetailRow.row);
		}
	}

	function handleConfirmAktiva(aktiva: any) {
		setAktivaList([...aktivaList, aktiva]);
		setAktivaModalOpen(false);
		if (pendingDetailRow) {
			_finishDetailRow(pendingDetailRow.row);
		}
	}

	function handleDeleteDetail(idx: number) {
		setDetailRows(detailRows.filter((_, i) => i !== idx));
	}

	// --- Submit ---
	const onSubmit = (values: FormValues) => {
		if (!headerOnly && detailRows.length === 0) {
			toast({
				title: "Validasi Gagal",
				description: "Minimal satu baris detail diperlukan.",
				variant: "destructive",
			});
			return;
		}
		// TODO: Commented out per user request
		// if (totalDebet !== totalKredit || totalDebet === 0) {
		// 	toast({
		// 		title: "Validasi Gagal",
		// 		description: "Total Debet harus sama dengan Total Kredit dan lebih dari 0.",
		// 		variant: "destructive",
		// 	});
		// 	return;
		// }

		const payload: ICreateKasBankPayload = {
			tanggal: values.tanggal,
			tipeTransHd: values.tipeTransHd,
			perkiraanHd: values.perkiraanHd,
			note: values.note ?? "",
			devisi: values.devisi,
			nobon: "",
			tphc: "C", // Header tphc defaults to C, but actual tphc is per detail
			details: detailsToPayload(detailRows),
			giroList,
			depositoList,
			hutPiutList,
			aktivaList,
		};

		if (editData) {
			updateMutation.mutate(payload);
		} else {
			createMutation.mutate(payload);
		}
	};

	const tipeMeta = TIPE_META[selectedTipe];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editData ? t("form.edit_title") : "Tambah Bukti"}
					</DialogTitle>
				</DialogHeader>

				<Show when={apiError}>
					<Alert variant="destructive">{String(apiError)}</Alert>
				</Show>

				<form
					onSubmit={(e) => {
						void handleSubmit(onSubmit)(e);
					}}
					className="space-y-4"
				>
					{/* Row 1: Tipe | Akun Kas/Bank */}
					<div className="grid grid-cols-12 gap-4">
						<div className="col-span-3">
							<Label htmlFor="tipe">{t("fields.tipe")} *</Label>
							<Select
								value={selectedTipe}
								onValueChange={(v) => {
									setSelectedTipe(v as KasBankTipe);
									setValue("tipeTransHd", v as KasBankTipe);
								}}
								disabled={!!editData}
							>
								<SelectTrigger id="tipe">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TIPE_OPTIONS.map((tipe) => (
										<SelectItem key={tipe} value={tipe}>
											{t(`tipe.${tipe.toLowerCase()}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="col-span-9">
							<Label htmlFor="perkiraanHd">
								{tipeMeta?.kasLabel ?? "Akun Kas/Bank"} *
							</Label>
							<KasBankBrowseSelect
								value={watch("perkiraanHd")}
								onChange={(v) => setValue("perkiraanHd", v)}
								kasType={TIPE_TO_KAS_TYPE[selectedTipe]}
								placeholder={`Pilih ${tipeMeta?.kasLabel ?? "Akun"}`}
							/>
							{errors.perkiraanHd && (
								<p className="text-xs text-rose-500 mt-1">
									{errors.perkiraanHd.message as string}
								</p>
							)}
						</div>
					</div>

					{/* Row 1.5: No Bukti — shown only after Kas/Bank is chosen */}
					<Show when={editData || currentPerkiraanHd}>
						<div className="grid grid-cols-12 gap-4">
							<div className="col-span-3">
								<Label>{t("fields.no_bukti")}</Label>
								<Input
									value={editData?.nobukti ?? noBuktiData?.data?.nobukti ?? ""}
									disabled
									className="bg-slate-50"
								/>
								<Show when={noBuktiLoading && !editData}>
									<p className="text-xs text-slate-500 mt-1">
										Generating voucher number…
									</p>
								</Show>
								<Show when={noBuktiError && !editData}>
									<p className="text-xs text-rose-500 mt-1">
										Gagal generate No Bukti: {String(noBuktiError)}
										<button
											type="button"
											className="ml-2 underline"
											onClick={() => refetchNoBukti()}
										>
											Coba lagi
										</button>
									</p>
								</Show>
							</div>
						</div>
					</Show>

					{/* Row 2: Tanggal | Note (dynamic label) | No Invoice */}
					<div className="grid grid-cols-12 gap-4">
						<div className="col-span-3">
							<Label htmlFor="tanggal">{t("fields.tanggal")} *</Label>
							<Input id="tanggal" type="date" {...register("tanggal")} />
							{errors.tanggal && (
								<p className="text-xs text-rose-500 mt-1">
									{errors.tanggal.message as string}
								</p>
							)}
						</div>
						<div className="col-span-9">
							<Label htmlFor="note">{tipeMeta?.noteLabel ?? "Note"}</Label>
							<Input
								id="note"
								{...register("note")}
								placeholder={t("fields.keterangan")}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="devisi">Devisi *</Label>
							<SearchableSelect
								value={watch("devisi")}
								onValueChange={(val) => setValue("devisi", val)}
								options={devisiOpts}
								placeholder="Pilih Devisi"
							/>
							{errors.devisi && (
								<p className="text-xs text-rose-500">
									{errors.devisi.message as string}
								</p>
							)}
						</div>
					</div>

					{/* Detail Rows Section */}
					{!headerOnly && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label className="text-base">Rincian Jurnal *</Label>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={openAddDetail}
								>
									<Plus className="mr-1 h-4 w-4" />
									Tambah Detail
								</Button>
							</div>

							{detailRows.length > 0 && (
								<div className="rounded-lg border overflow-x-auto">
									<table className="w-full text-sm">
										<thead className="bg-slate-100 dark:bg-slate-800">
											<tr>
												<th className="text-left px-3 py-2 font-medium">
													Akun
												</th>
												<th className="text-left px-3 py-2 font-medium">
													Lawan
												</th>
												<th className="text-right px-3 py-2 font-medium">
													Debet
												</th>
												<th className="text-right px-3 py-2 font-medium">
													Kredit
												</th>
												<th className="text-left px-3 py-2 font-medium">
													Sumber
												</th>
												<th className="px-3 py-2 font-medium w-20">Aksi</th>
											</tr>
										</thead>
										<tbody>
											{detailRows.map((row, idx) => (
												<tr
													key={idx}
													className="border-t hover:bg-slate-50 dark:hover:bg-slate-900"
												>
													<td className="px-3 py-2">{row.perkiraan}</td>
													<td className="px-3 py-2">{row.lawan}</td>
													<td className="px-3 py-2 text-right font-mono">
														{row.debet > 0
															? row.debet.toLocaleString("id-ID", {
																	minimumFractionDigits: 2,
																})
															: "—"}
													</td>
													<td className="px-3 py-2 text-right font-mono">
														{row.kredit > 0
															? row.kredit.toLocaleString("id-ID", {
																	minimumFractionDigits: 2,
																})
															: "—"}
													</td>
													<td className="px-3 py-2">Manual</td>
													<td className="px-3 py-2 flex items-center gap-2">
														<button
															type="button"
															onClick={() => openEditDetail(idx)}
															className="text-blue-500 hover:text-blue-700"
														>
															<PenLine className="h-4 w-4" />
														</button>
														<button
															type="button"
															onClick={() => handleDeleteDetail(idx)}
															className="text-red-500 hover:text-red-700"
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</td>
												</tr>
											))}
										</tbody>
										<tfoot className="bg-slate-50 dark:bg-slate-800 border-t font-semibold">
											<tr>
												<td colSpan={2} className="px-3 py-2 text-right">
													Total
												</td>
												<td className="px-3 py-2 text-right font-mono">
													{totalDebet.toLocaleString("id-ID", {
														minimumFractionDigits: 2,
													})}
												</td>
												<td className="px-3 py-2 text-right font-mono">
													{totalKredit.toLocaleString("id-ID", {
														minimumFractionDigits: 2,
													})}
												</td>
												<td colSpan={2} />
											</tr>
										</tfoot>
									</table>
								</div>
							)}

							<Show when={detailRows.length === 0}>
								<p className="text-sm text-muted-foreground italic py-4 text-center">
									Klik "Tambah Detail" untuk menambah baris jurnal.
								</p>
							</Show>
						</div>
					)}

					{/* Balance summary */}
					<Show when={detailRows.length > 0}>
						<div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
							<div className="flex items-center gap-4">
								<span className="text-sm">
									Total Debet:{" "}
									<span className="font-mono font-semibold">
										{totalDebet.toLocaleString("id-ID", {
											minimumFractionDigits: 2,
										})}
									</span>
								</span>
								<span className="text-sm">
									Total Kredit:{" "}
									<span className="font-mono font-semibold">
										{totalKredit.toLocaleString("id-ID", {
											minimumFractionDigits: 2,
										})}
									</span>
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Calculator className="h-4 w-4 text-slate-500" />
								<span
									className={`text-sm font-medium ${isBalanced ? "text-emerald-600" : "text-rose-500"}`}
								>
									{isBalanced ? "Seimbang ✓" : "Tidak Seimbang ✗"}
								</span>
							</div>
						</div>
					</Show>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("actions.cancel")}
						</Button>
						<Button
							type="submit"
							disabled={isPending || detailRows.length === 0}
						>
							{isPending ? t("form.saving") : t("actions.save")}
						</Button>
					</DialogFooter>
				</form>

				{/* Detail Row Editor Modal */}
				<DetailRowEditor
					open={detailModalOpen}
					onClose={handleCloseDetailModal}
					onConfirm={handleConfirmDetail}
					existingRow={
						editingDetailIdx !== null ? detailRows[editingDetailIdx] : undefined
					}
					perkiraanHd={currentPerkiraanHd}
					tipe={selectedTipe}
				/>

				{/* Giro Sub-Form Modal */}
				<GiroSubForm
					open={giroModalOpen}
					onClose={() => setGiroModalOpen(false)}
					onConfirm={handleConfirmGiro}
					defaultTipe={
						pendingSubTransResult?.statusP?.startsWith("PT") ||
						pendingSubTransResult?.statusL?.startsWith("PT")
							? "PT"
							: "HT"
					}
					defaultNominal={
						pendingDetailRow?.row?.debet || pendingDetailRow?.row?.kredit
					}
				/>

				{/* Deposito Sub-Form Modal */}
				<DepositoSubForm
					open={depositoModalOpen}
					onClose={() => setDepositoModalOpen(false)}
					onConfirm={handleConfirmDeposito}
					defaultNominal={
						pendingDetailRow?.row?.debet || pendingDetailRow?.row?.kredit
					}
				/>

				{/* Hutang/Piutang Sub-Form Modal */}
				<HutangPiutangSubForm
					open={hutPiutModalOpen}
					onOpenChange={setHutPiutModalOpen}
					perkiraan={pendingDetailRow?.row?.perkiraan || ""}
					isPiutang={pendingSubTransResult?.statusP === "PT"} // Simple check based on resolver
					onSave={handleConfirmHutPiut}
				/>

				{/* Aktiva Sub-Form Modal */}
				<AktivaSubForm
					open={aktivaModalOpen}
					onClose={() => setAktivaModalOpen(false)}
					onConfirm={handleConfirmAktiva}
					perkiraan={pendingDetailRow?.row?.perkiraan || ""}
					devisi={getValues("devisi")}
				/>
			</DialogContent>
		</Dialog>
	);
}

/* ================================================================
   DetailRowEditor — mirrors "modal-insert-detail.blade.php"
   ================================================================ */

import type { ISubTransactionResult } from "@/domains/accounting/types/kasbank";

export interface DetailRowEditorProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (
		row: IAddDetailPayload,
		subTransResult?: ISubTransactionResult,
	) => void;
	existingRow?: IAddDetailPayload;
	perkiraanHd: string;
	tipe: KasBankTipe;
}

export function DetailRowEditor({
	open,
	onClose,
	onConfirm,
	existingRow,
	perkiraanHd,
	tipe,
}: DetailRowEditorProps) {
	const { t } = useTranslation(["accounting", "common"]);
	const [perkiraanSearch, setPerkiraanSearch] = useState("");
	const { data: detailPerkiraanData } = useLookupPerkiraanShared(
		perkiraanSearch,
		"T",
	);

	const perkiraanOpts = useMemo(
		() =>
			(detailPerkiraanData ?? []).map((p: { id: string; text: string }) => ({
				value: p.id,
				label: p.text,
			})),
		[detailPerkiraanData],
	);

	const isMasuk = tipe === "BKM" || tipe === "BBM";

	const [form, setForm] = useState<IAddDetailPayload>({
		perkiraan: "",
		lawan: "",
		debet: 0,
		kredit: 0,
		keterangan: "",
		valas: "",
		kurs: 1,
		tphc: "C",
		kodebag: "",
		kode_cust_supp: "",
	});

	// Reset form when modal opens
	useEffect(() => {
		if (open) {
			if (existingRow) {
				setForm(existingRow);
			} else {
				// New row: auto-fill lawan from header perkiraanHd
				setForm({
					perkiraan: perkiraanHd,
					lawan: perkiraanHd,
					debet: 0,
					kredit: 0,
					keterangan: "",
					valas: "",
					kurs: 1,
					tphc: "C",
					kodebag: "",
					kode_cust_supp: "",
				});
			}
		}
	}, [open, existingRow, perkiraanHd]);

	function handleJumlahChange(val: number) {
		if (isMasuk) {
			setForm((f) => ({ ...f, debet: val, kredit: 0 }));
		} else {
			setForm((f) => ({ ...f, debet: 0, kredit: val }));
		}
	}

	// When perkiraan changes in detail, auto-update lawan
	function handlePerkiranChange(code: string) {
		setForm((f) => ({ ...f, perkiraan: code, lawan: code }));
	}

	const jumlah = form.debet + form.kredit;

	const handleConfirm = async () => {
		if (!form.perkiraan) return;
		try {
			const dk = form.debet > 0 ? "D" : "K";
			const result = await kasbankService.resolveSubTransaction(
				form.perkiraan,
				dk,
			);
			onConfirm(form, result.data as ISubTransactionResult);
		} catch (error) {
			console.error("Failed to resolve sub-transaction", error);
			onConfirm(form);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-lg">
				{/* ... modal content ... */}
				<DialogHeader>
					<DialogTitle>
						{existingRow ? t("actions.edit_detail") : t("actions.add_detail")}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Perkiraan */}
					<div>
						<Label htmlFor="detail-perkiraan">{t("fields.perkiraan")} *</Label>
						<SearchableSelect
							value={form.perkiraan}
							onValueChange={handlePerkiranChange}
							options={perkiraanOpts}
							onSearchChange={setPerkiraanSearch}
							placeholder="Pilih akun"
						/>
					</div>

					{/* Valas */}
					<div>
						<Label htmlFor="detail-valas">Valas</Label>
						<Select
							value={form.valas}
							onValueChange={(v) => setForm((f) => ({ ...f, valas: v }))}
						>
							<SelectTrigger id="detail-valas">
								<SelectValue placeholder="IDR" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="IDR">IDR</SelectItem>
								<SelectItem value="USD">USD</SelectItem>
								<SelectItem value="SGD">SGD</SelectItem>
								<SelectItem value="EUR">EUR</SelectItem>
								<SelectItem value="JPY">JPY</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Kurs */}
					<div>
						<Label htmlFor="detail-kurs">Kurs</Label>
						<Input
							id="detail-kurs"
							type="number"
							step="0.01"
							value={form.kurs ?? 1}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									kurs: parseFloat(e.target.value) || 1,
								}))
							}
						/>
					</div>

					{/* Jumlah */}
					<div>
						<Label htmlFor="detail-jumlah">Jumlah *</Label>
						<Input
							id="detail-jumlah"
							type="number"
							min="0"
							step="0.01"
							value={jumlah || ""}
							onChange={(e) =>
								handleJumlahChange(parseFloat(e.target.value) || 0)
							}
						/>
					</div>

					{/* Debit/Credit preview */}
					<div className="flex gap-4 text-sm">
						<span>
							Debet:{" "}
							<span className="font-mono font-semibold">
								{form.debet.toLocaleString("id-ID", {
									minimumFractionDigits: 2,
								})}
							</span>
						</span>
						<span>
							Kredit:{" "}
							<span className="font-mono font-semibold">
								{form.kredit.toLocaleString("id-ID", {
									minimumFractionDigits: 2,
								})}
							</span>
						</span>
					</div>

					{/* TPHC */}
					<div>
						<Label htmlFor="detail-tphc">Cara Pembayaran (TPHC) *</Label>
						<Select
							value={form.tphc}
							onValueChange={(val) => setForm((f) => ({ ...f, tphc: val }))}
						>
							<SelectTrigger id="detail-tphc">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="C">C - Cash</SelectItem>
								<SelectItem value="T">T - Transfer</SelectItem>
								<SelectItem value="H">H - Hutang Giro</SelectItem>
								<SelectItem value="P">P - Piutang Giro</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Keterangan */}
					<div>
						<Label htmlFor="detail-keterangan">Keterangan</Label>
						<Input
							id="detail-keterangan"
							value={form.keterangan}
							onChange={(e) =>
								setForm((f) => ({ ...f, keterangan: e.target.value }))
							}
						/>
					</div>

					{/* NoSPK (KodeBag) */}
					<div>
						<Label htmlFor="detail-kodebag">NoSPK</Label>
						<Input
							id="detail-kodebag"
							value={form.kodebag ?? ""}
							onChange={(e) =>
								setForm((f) => ({ ...f, kodebag: e.target.value }))
							}
							placeholder="No. SPK"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						{t("actions.cancel")}
					</Button>
					<Button
						type="button"
						onClick={handleConfirm}
						disabled={!form.perkiraan}
					>
						{t("actions.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
