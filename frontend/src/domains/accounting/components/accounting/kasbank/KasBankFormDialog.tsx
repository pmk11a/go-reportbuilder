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
	useResolveSubTransaction,
	useUpdateKasBank,
} from "@/domains/accounting/hooks/useKasBank";
import { useKasBankDetailList } from "@/domains/accounting/hooks/useKasBankDetail";
import type {
	IAddDetailPayload,
	IAktiva,
	ICreateKasBankPayload,
	IDeposito,
	IGiro,
	IHutPiut,
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
		// New fields for Aktiva sub-form data (stored in DBTRANSAKSI columns):
		custSuppL: d.custSuppL,
		noAktivaP: d.noAktivaP,
		noAktivaL: d.noAktivaL,
		xSusut: d.xSusut,
		perlakuanAktiva: d.perlakuanAktiva,
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
	const [hutPiutList, setHutPiutList] = useState<IHutPiut[]>([]);
	const [aktivaList, setAktivaList] = useState<IAktiva[]>([]);

	const [giroModalOpen, setGiroModalOpen] = useState(false);
	const [depositoModalOpen, setDepositoModalOpen] = useState(false);
	const [hutPiutModalOpen, setHutPiutModalOpen] = useState(false);
	const [aktivaModalOpen, setAktivaModalOpen] = useState(false);
	const [pendingDetailRow, setPendingDetailRow] = useState<{
		row: IAddDetailPayload;
		trigger: "giro" | "deposito" | "hutpiut" | "aktiva";
		detailIdx: number; // 0-based index in detailRows; used to derive NoMsk for hutPiut
		nomsk: number; // 1-based Urut in DBTRANSAKSI that triggered this sub-form
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
			devisi: "01",
		},
	});

		// Generate NoBukti only after `watch` is available (useForm above) and
		// only when both `tipe` and `devisi` are populated — the backend rejects
		// empty devisi ("devisi wajib diisi").
		// NOTE: devisiVal is intentionally read fresh below via watch() in useEffect;
		// the initial value here is a fallback — the real trigger is Effect 5.
		const initialDevisiVal = editData ? (watch("devisi") || "KANTOR PUSAT") : watch("devisi");
		const {
			data: noBuktiData,
			error: noBuktiError,
			isLoading: noBuktiLoading,
			refetch: refetchNoBukti,
		} = useGenerateNoBukti(selectedTipe, initialDevisiVal);

	// DEBUG: Trace NoBukti data shape
	console.log("[KasBank] noBuktiData:", noBuktiData, "selectedTipe:", selectedTipe, "initialDevisiVal:", initialDevisiVal);

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
					devisi: "01",
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
			setValue("devisi", first.devisi ?? "KANTOR PUSAT");
		} else {
			// Fallback: if no details, set default devisi so NoBukti can generate
			setValue("devisi", "KANTOR PUSAT");
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
			kode_cust_supp: d.kodecustsupp || "",
			hutpiut_selected: d.hutpiut_selected || [],
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
		const generatedAt = (noBuktiData as any)?.generatedAt;
		if (!generatedAt) return;
		const isoDate = String(generatedAt).split("T")[0];
		if (isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
			setValue("tanggal", isoDate, { shouldValidate: false, shouldDirty: false });
		}
	}, [open, editData, noBuktiData, setValue]);

	// Effect 4: when devisi becomes available (edit mode), refetch NoBukti
	useEffect(() => {
		if (!open || !editData) return;
		const devisiVal = watch("devisi");
		if (devisiVal && devisiVal.trim().length > 0) {
			refetchNoBukti();
		}
	}, [open, editData, watch("devisi"), refetchNoBukti]);

	// Effect 5: when devisi becomes available (new mode), refetch NoBukti.
	// The initial `useGenerateNoBukti` call fires with empty devisi (disabled),
	// so we need this effect to trigger after Effect 1 sets devisi to "KANTOR PUSAT".
	useEffect(() => {
		if (!open || editData) return;
		const devisiVal = watch("devisi");
		if (devisiVal && devisiVal.trim().length > 0) {
			refetchNoBukti();
		}
	}, [open, editData, watch("devisi"), refetchNoBukti]);

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
		console.log("[KasBank] handleConfirmDetail trigger =", trigger, "row.perkiraan =", newRow?.perkiraan);

		const detailIdx =
			editingDetailIdx !== null ? editingDetailIdx : detailRows.length;
		const nomsk = detailIdx + 1; // 1-based Urut
		const pending = { row: newRow, trigger, detailIdx, nomsk };

		if (trigger === "giro") {
			setPendingDetailRow(pending);
			setPendingSubTransResult(subTransResult);
			setGiroModalOpen(true);
			// We don't close detail modal yet or add row yet
			return;
		} else if (trigger === "deposito") {
			setPendingDetailRow(pending);
			setPendingSubTransResult(subTransResult);
			setDepositoModalOpen(true);
			return;
		} else if (trigger === "hutpiut") {
			setPendingDetailRow(pending);
			setPendingSubTransResult(subTransResult);
			setHutPiutModalOpen(true);
			return;
		} else if (trigger === "aktiva") {
			setPendingDetailRow(pending);
			setPendingSubTransResult(subTransResult);
			setAktivaModalOpen(true);
			return;
		}

		// No sub-transaction needed (regular detail row).
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
		// StatusGiro comes from pendingSubTransResult (mirrors Delphi's THPCChange):
		//   H+ = Hutang Giro Buka for BKM  -> Debet on DBTRANSAKSI (D side)
		//   H- = Hutang Giro Cair for BKK   -> Kredit on DBTRANSAKSI (K side)
		//   P+ = Piutang Giro Buka for BKM  -> Debet on DBTRANSAKSI (D side)
		//   P- = Piutang Giro Cair for BKK   -> Kredit on DBTRANSAKSI (K side)
		const statusGiro =
			pendingSubTransResult?.statusP ?? pendingSubTransResult?.statusL ?? "";
		const giroWithStatus: IGiro = {
			...giro,
			statusgiro: statusGiro,
		};
		setGiroList([...giroList, giroWithStatus]);
		setGiroModalOpen(false);
		if (pendingDetailRow) {
			_finishDetailRow(pendingDetailRow.row);
		}
	}

	function handleConfirmDeposito(deposito: IDeposito) {
		// StatusDeposito: DP+ = Buka Deposito for BKM, DP- = Cair Deposito for BKK.
		const statusDeposito =
			pendingSubTransResult?.statusP ?? pendingSubTransResult?.statusL ?? "";
		const depositoWithStatus: IDeposito = {
			...deposito,
			statusdeposito: statusDeposito,
		};
		setDepositoList([...depositoList, depositoWithStatus]);
		setDepositoModalOpen(false);
		if (pendingDetailRow) {
			_finishDetailRow(pendingDetailRow.row);
		}
	}

	function handleConfirmHutPiut(selected: IHutPiut[]) {
		// Persist the selected items as DBHUTPIUT rows (hutPiutList).
		// Also update the pending detail row with custSuppL from the selected items
		// and store the selection for display.
		if (pendingDetailRow) {
			const updatedRows = [...detailRows];
			const targetIdx = editingDetailIdx ?? updatedRows.length;
			if (!updatedRows[targetIdx]) {
				updatedRows[targetIdx] = pendingDetailRow.row;
			}
			// Derive custSuppL from the first selected item (Lawan/K side).
			const first = selected[0];
			const custL = first ? first.kodecustsupp : pendingDetailRow.row.custSuppL;
			// For D/Perkiraan side, also update kode_cust_supp.
			const custP = first ? first.kodecustsupp : pendingDetailRow.row.kode_cust_supp;
			updatedRows[targetIdx] = {
				...updatedRows[targetIdx],
				kode_cust_supp: custP,
				custSuppL: custL,
				hutpiut_selected: selected,
			};
			setDetailRows(updatedRows);
		}
		// Append to hutPiutList — each item maps to a DBHUTPIUT row.
		// The service layer will derive Tipe (PT/HT/UPT/UHT) from the sub-trans result.
		const withNomsk = selected.map(item => ({
			...item,
			nomsk: pendingDetailRow?.nomsk,
		}));
		setHutPiutList([...hutPiutList, ...withNomsk]);
		setHutPiutModalOpen(false);
		// Cleanup state directly instead of using _finishDetailRow,
		// because we've already updated detailRows above to include
		// hutpiut_selected, custSuppL, and kode_cust_supp.
		if (pendingDetailRow) {
			 handleCloseDetailModal();
			 setPendingDetailRow(null);
			 setPendingSubTransResult(null);
		}
	}

	function handleConfirmAktiva(aktiva: IAktiva) {
		setAktivaList([...aktivaList, aktiva]);
		setAktivaModalOpen(false);
		if (pendingDetailRow) {
			// Wire Aktiva sub-form data back to the pending detail row so it gets
			// persisted to DBTRANSAKSI as NoAktivaP/L, XSusut, PerlakuanAktiva.
			// The perkiraan from Aktiva sub-form is the NoAktiva code (e.g. "1-11.001").
			//
			// Determine which side (Perkiraan or Lawan) carries the aktiva posting:
			// In BKK/BBM: perkiraan=Kas/Bank, lawan=aktiva → aktiva on Lawan side → noAktivaL
			// In BKM/BBK: perkiraan=aktiva, lawan=Kas/Bank → aktiva on Perkiraan side → noAktivaP
			// This matches the Delphi sub-transaction resolution (CekLawanDiPosting).
			const row = pendingDetailRow.row;
			const aktivaIsOnPerkiraanSide = row.perkiraan === aktiva.perkiraan;
			const updatedRow: IAddDetailPayload = {
				...row,
				noAktivaP: aktivaIsOnPerkiraanSide ? aktiva.perkiraan : undefined,
				noAktivaL: !aktivaIsOnPerkiraanSide ? aktiva.perkiraan : undefined,
				xSusut: aktiva.xsusut,
				perlakuanAktiva: aktiva.perlakuanaktiva,
			};
			_finishDetailRow(updatedRow);
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
					<Alert variant="destructive">
						{apiError instanceof Error ? apiError.message : String(apiError)}
					</Alert>
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
							<div className="col-span-6">
								<Label>{t("fields.no_bukti")}</Label>
								<Input
									value={editData?.nobukti ?? noBuktiData?.noBukti ?? ""}
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
								{/* Diagnostic: backend returned data but NoBukti is empty */}
								<Show when={!editData && !noBuktiLoading && !noBuktiError && noBuktiData && !noBuktiData.noBukti}>
									<p className="text-xs text-amber-600 mt-1">
										Backend returned empty NoBukti. Periksa konfigurasi DBNOMOR.FORMAT1..4, PEMISAH, dan ALIAS untuk tipe <b>{selectedTipe}</b>.
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
													Jumlah
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
														{(row.debet || 0) + (row.kredit || 0) > 0
															? ((row.debet || 0) + (row.kredit || 0)).toLocaleString("id-ID", {
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
													{(totalDebet + totalKredit).toLocaleString("id-ID", {
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
							{/*<div className="flex items-center gap-4">
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
							</div>*/}
							{/* <div className="flex items-center gap-2">
								<Calculator className="h-4 w-4 text-slate-500" />
								<span
									className={`text-sm font-medium ${isBalanced ? "text-emerald-600" : "text-rose-500"}`}
								>
									{isBalanced ? "Seimbang ✓" : "Tidak Seimbang ✗"}
								</span>
							</div> */}
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
					perkiraan={pendingDetailRow?.row?.lawan || pendingDetailRow?.row?.perkiraan || ""}
					kodeCustSupp={pendingDetailRow?.row?.kode_cust_supp || ""}
					isPiutang={
						pendingSubTransResult?.statusP?.startsWith("PT") || pendingSubTransResult?.statusP?.startsWith("UPT") || pendingSubTransResult?.statusL?.startsWith("PT") || pendingSubTransResult?.statusL?.startsWith("UPT") ||
						pendingDetailRow?.row?.perkiraan?.includes("1-13") ||
						false
					}
					initialData={
						editingDetailIdx !== null && detailRows[editingDetailIdx]?.hutpiut_selected
							? detailRows[editingDetailIdx].hutpiut_selected
							: []
					}
					nomsk={pendingDetailRow?.nomsk || undefined}
					onSave={handleConfirmHutPiut}
				/>

				{/* Aktiva Sub-Form Modal */}
				{/* Pre-fill perkiraan from parent row's lawan account — the contra-side
					account is what carries the sub-ledger posting for aktiva (matches
					Delphi FrmKasBankAktiva where Lawan determines the aktiva group). */}
				<AktivaSubForm
					open={aktivaModalOpen}
					onClose={() => setAktivaModalOpen(false)}
					onConfirm={handleConfirmAktiva}
					devisi={getValues("devisi")}
					initialData={pendingDetailRow ? {
						perkiraan: pendingDetailRow.row.lawan || '',
						kelompok: 0, nobelakang: '', nobelakang2: '',
						tglpengakuan: new Date().toISOString().split('T')[0], tipeaktiva: 0,
						keterangan: '', kuantum: 1, persen: 0, metode: 'L', akumulasi: '',
						biaya: '', persenbiaya1: 0, biaya2: '', persenbiaya2: 0, biaya3: '',
						persenbiaya3: 0, persenpajak: 0, xsusut: 1, perlakuanaktiva: 0,
						kodebag: '', devisi: getValues("devisi") || '', noAktivahd: '',
					} : undefined}
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
	const [lawanSearch, setLawanSearch] = useState("");
	// Perkiraan (Kas/Bank side) lookup — "N" skips the KelompokKas preload (an
	// optimisation since we don't need DBPOSTHUTPIUT metadata here). The backend
	// perkiraan endpoint does not filter by posthutpiut either way; both
	// dropdowns surface the full perkiraan master so the user can pick any
	// account (Kas/Bank, expense/revenue, Hutang/Piutang/Aktiva, etc.).
	const { data: detailPerkiraanData } = useLookupPerkiraanShared(
		perkiraanSearch,
		"N",
	);
	// Lawan (contra-account side) lookup. Same shape as Perkiraan — the user
	// picks the contra account that drives the DBPOSTHUTPIUT-based sub-form
	// trigger (HutPiut/Aktiva/Giro entries live in the same perkiraan master).
	const { data: lawanPerkiraanData } = useLookupPerkiraanShared(
		lawanSearch,
		"N",
	);

	const perkiraanOpts = useMemo(
		() =>
			(detailPerkiraanData ?? []).map((p: { id?: string; text?: string }) => ({
				value: String(p.id ?? ''),
				label: String(p.text ?? p.id ?? ''),
			})),
		[detailPerkiraanData],
	);

	const lawanOpts = useMemo(
		() =>
			(lawanPerkiraanData ?? []).map((p: { id?: string; text?: string }) => ({
				value: String(p.id ?? ''),
				label: String(p.text ?? p.id ?? ''),
			})),
		[lawanPerkiraanData],
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
				// New row: prefill Perkiraan from the header Kas/Bank account so the
				// user only has to pick the Lawan (contra-account). Lawan is left
				// blank on purpose — the user MUST pick a HutPiut/Aktiva/etc account
				// as Lawan for the sub-transaction trigger to work (mirrors Delphi
				// FrmKasBank.pas where mLawan is typed in by the user, not copied).
				setForm({
					perkiraan: perkiraanHd,
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
			}
		}
	}, [open, existingRow, perkiraanHd]);

	function handleJumlahChange(val: number) {
		// TODO: restore isMasuk logic when tipe D/K setting is re-enabled
		// if (isMasuk) {
		// 	setForm((f) => ({ ...f, debet: val, kredit: 0 }));
		// } else {
		// 	setForm((f) => ({ ...f, debet: 0, kredit: val }));
		// }
		// Temporary: always write to Debet regardless of tipe
		setForm((f) => ({ ...f, debet: val, kredit: 0 }));
	}

	// Perkiraan change: do NOT auto-copy to Lawan. The user must explicitly pick
	// the contra-account (Lawan) — only then does the sub-transaction trigger
	// fire (Delphi's CekLawanDiPosting(mLawan, DK) is called on Lawan, not on
	// Perkiraan).
	function handlePerkiranChange(code: string) {
		setForm((f) => ({ ...f, perkiraan: code }));
	}

	function handleLawanChange(code: string) {
		setForm((f) => ({ ...f, lawan: code }));
	}

	const jumlah = form.debet + form.kredit;

	const handleConfirm = async () => {
		if (!form.perkiraan) return;
		try {
			const dk = form.debet > 0 ? "D" : "K";
			// Resolve sub-transaction by mirroring Delphi CekLawanDiPosting(mLawan, DK):
			//   - BKK/BBK mode: Perkiraan = Kas/Bank side, Lawan = expense/revenue side
			//     → lookup DBPOSTHUTPIUT by Lawan (the contra-account carrying the sub-ledger posting).
			//   - BKM/BBM mode: Perkiraan = expense/revenue side, Lawan = Kas/Bank side
			//     → lookup DBPOSTHUTPIUT by Perkiraan (since in this direction Perkiraan carries the sub-ledger posting).
			// If the user did not pick a distinct Lawan, fall back to Perkiraan so the
			// lookup still runs (it will simply return no trigger if no match).
			const isKreditMode = tipe === "BKK" || tipe === "BBM";
			const lookupPerk =
				isKreditMode && form.lawan ? form.lawan : form.perkiraan;
			const result = await kasbankService.resolveSubTransaction(
				lookupPerk,
				dk,
			);
			console.log("[KasBank] resolveSubTransaction result:", result);
			// kasbankService.resolveSubTransaction returns the SSubTransactionResult
			// directly (already unwrapped in resolveSubTransactionFn). Be defensive
			// in case the response shape ever changes — accept both `{ data: {...} }`
			// and the bare object.
			const subTrans: ISubTransactionResult =
				(result && (result as any).data) || (result as ISubTransactionResult) || {};
			console.log("[KasBank] subTrans.trigger =", subTrans?.trigger);
			onConfirm(form, subTrans);
		} catch (error) {
			console.error("Failed to resolve sub-transaction", error);
			// Pass empty subTransResult so the parent can decide what to do.
			// Without the second arg, _finishDetailRow runs and skips sub-forms.
			onConfirm(form, { trigger: "", kode: "", statusP: "", statusL: "" } as ISubTransactionResult);
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
							placeholder="Pilih akun Kas/Bank"
						/>
					</div>

					{/* Lawan (contra-account — HutPiut/Aktiva/Giro etc.) */}
					<div>
						<Label htmlFor="detail-lawan">{t("fields.lawan")} *</Label>
						<SearchableSelect
							value={form.lawan}
							onValueChange={handleLawanChange}
							options={lawanOpts}
							onSearchChange={setLawanSearch}
							placeholder="Pilih akun lawan (Hutang/Piutang/Aktiva dll)"
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
					<div className="flex gap-4 text-sm hidden">
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
						disabled={
							!form.perkiraan ||
							// In BKK/BBK mode the sub-transaction trigger is looked up by
							// Lawan (the expense/revenue side); require Lawan to be picked
							// before we can resolve a trigger. In BKM/BBM mode Lawan is
							// optional since the lookup falls back to Perkiraan.
							((tipe === "BKK" || tipe === "BBM") && !form.lawan)
						}
					>
						{t("actions.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
