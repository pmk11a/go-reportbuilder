export type KasBankTipe = 'BKM' | 'BKK' | 'BBM' | 'BBK';

export interface IKasBankHeader {
  nobukti: string;
  tanggal: string | null;
  note: string;
  tipetranshd: string;
  perkiraanhd: string | null;
  tgljurnal: string | null;
  maxol: number;
  totald: number;
  totalk: number;
  otorisasi1: boolean;
  otorisasi2: boolean;
  otorisasi3: boolean;
  otorisasi4: boolean;
  otorisasi5: boolean;
  locked: boolean;
  jumlahvalas: number;
  jumlahrupiah: number;
  otouser1: string;
  otouser2: string;
  otouser3: string;
  otouser4: string;
  otouser5: string;
  tgloto1: string | null;
  tgloto2: string | null;
  tgloto3: string | null;
  tgloto4: string | null;
  tgloto5: string | null;
  devisi?: string;
  nobon?: string;
  tphc?: string;
}

export interface IKasBankDetail {
  urut: number;
  perkiraan: string;
  lawan: string;
  debet: number;
  kredit: number;
  keterangan: string;
  tipetrans: string;
  tphc: string;
  valas: string;
  kurs: number;
}

export interface IDetailRow {
  perkiraan: string;
  lawan: string;
  debet: number;
  kredit: number;
  keterangan: string;
  valas?: string;
  kurs?: number;
  /** Sumber: C=Cash, T=Transfer, H=Hutang Giro, P=Piutang Giro */
  tphc?: string;
  /** SPK / project reference (KodeBag) */
  kodebag?: string;
  /** Customer/supplier code for pelunasan settlement (D/Perkiraan side) */
  kode_cust_supp?: string;
  /** Customer/supplier code for K/Lawan side (HutPiut settlement) */
  custSuppL?: string;
  /** Selected Hutang/Piut items */
  hutpiut_selected?: any[];
  /** No. Aktiva fixed-asset number for D/Perkiraan side (from Aktiva sub-form) */
  noAktivaP?: string;
  /** No. Aktiva fixed-asset number for K/Lawan side (from Aktiva sub-form) */
  noAktivaL?: string;
  /** x Susut bulan ini (from Aktiva sub-form, XSusut field) */
  xSusut?: number;
  /** Perlakuan aktiva: 0=normal, 1=Jual, 2=Keluar Aktiva (from Aktiva sub-form) */
  perlakuanAktiva?: number;
}

export interface ICreateKasBankPayload {
  tanggal: string;
  tipeTransHd: KasBankTipe;
  perkiraanHd: string;
  note: string;
  tgljurnal?: string;      // Batas Waktu
  noJurnal?: string;       // No. Order
  noBuktiSem?: string;     // No. Invoice
  noOrder?: string;        // alias kept for compatibility
  noInvoice?: string;      // alias kept for compatibility
  kodeProject?: string;
  devisi: string;
  nobon: string;
  tphc: string;
  details: IDetailRow[];
  /** Giro entries for H+/P+ (open giro) or H-/P- (settle giro) */
  giroList?: IGiro[];
  /** Deposito entries for DP+ (open) or DP- (settle) */
  depositoList?: IDeposito[];
  /** Hutang/Piutang pelunasan entries — maps to DBHUTPIUT table */
  hutPiutList?: IHutPiut[];
  /** Aktiva tetap entries — maps to DBAKTIVA table */
  aktivaList?: IAktiva[];
}

export interface IAktiva {
  /** Group Aktiva code (e.g. "1-11"). NOT the detail-row's lawan/perkiraan —
   *  user types it or picks via browse, matching Delphi FrmKasBankAktiva.
   *  On save, this field is OVERWRITTEN with the full `KodeAktiva`
   *  (Perkiraan + "." + NoUrut + "." + NoUrut2) so it matches the
   *  IDetailRow.noAktivaP/L semantics. */
  perkiraan: string;
  kelompok: number; // 0=Header, 1=Sub
  nobelakang: string; // No Urut
  nobelakang2: string; // No Urut 2 (for Sub Aktiva)
  tglpengakuan: string; // Tanggal Perolehan
  tipeaktiva: number; // 0=Aktiva Tetap, 1=Aktiva Yang Dibiayakan
  keterangan: string;
  kuantum: number; // Quantity
  persen: number; // % Susut
  metode: string; // L=Lurus, M=Menurun, P=Pajak
  akumulasi: string; // Akun Akumulasi
  biaya: string; // Akun Biaya Penyusutan 1
  persenbiaya1: number; // % Susut Biaya 1
  biaya2: string; // Akun Biaya Penyusutan 2
  persenbiaya2: number; // % Susut Biaya 2
  biaya3: string; // Akun Biaya Penyusutan 3
  persenbiaya3: number; // % Susut Biaya 3
  /** % Pajak — Delphi FrmSubAktiva.PersenPajak. Defaults to 0 when unused.
   *  When metode === 'P', the user enters the tax percentage here. */
  persenpajak: number;
  xsusut: number; // x Susut Bulan ini
  perlakuanaktiva: number; // 0=-, 1=Jual, 2=Keluar Aktiva
  kodebag: string;
  devisi: string;
}

export interface IUpdateKasBankPayload {
  tanggal?: string;
  tipeTransHd?: KasBankTipe;
  perkiraanHd?: string;
  note?: string;
  batasWaktu?: string;
  noOrder?: string;
  noInvoice?: string;
  kodeProject?: string;
  devisi?: string;
  nobon?: string;
  tphc?: string;
  details?: IDetailRow[];
  giroList?: IGiro[];
  depositoList?: IDeposito[];
  hutPiutList?: IHutPiut[];
  aktivaList?: IAktiva[];
}

export interface IAddDetailPayload {
  perkiraan: string;
  lawan: string;
  debet: number;
  kredit: number;
  keterangan: string;
  valas?: string;
  kurs?: number;
  /** Sumber: C=Cash, T=Transfer, H=Hutang Giro, P=Piutang Giro */
  tphc?: string;
  /** SPK / project reference (KodeBag) */
  kodebag?: string;
  /** Customer/supplier code for pelunasan settlement (D/Perkiraan side) */
  kode_cust_supp?: string;
  /** Customer/supplier code for K/Lawan side (HutPiut settlement) */
  custSuppL?: string;
  /** Selected Hutang/Piut items */
  hutpiut_selected?: any[];
  /** No. Aktiva for D/Perkiraan side (from Aktiva sub-form) */
  noAktivaP?: string;
  /** No. Aktiva for K/Lawan side (from Aktiva sub-form) */
  noAktivaL?: string;
  /** x Susut bulan ini (from Aktiva sub-form) */
  xSusut?: number;
  /** Perlakuan aktiva: 0=normal, 1=Jual, 2=Keluar Aktiva (from Aktiva sub-form) */
  perlakuanAktiva?: number;
}

export interface IUpdateDetailPayload extends IAddDetailPayload {
  urut: number;
}

export interface IOtorisasiRequest {
  level: 1 | 2 | 3 | 4 | 5;
  action: 'set' | 'cancel';
}

export interface IPerkiraan {
  perkiraan: string;
  keterangan: string;
  kelompok: string;
  tipe: string;
}

export interface IKasBankListParams {
  tipe?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface IKasBankListResponse {
  items: IKasBankHeader[];
  total: number;
  page: number;
  perPage: number;
}

export interface IGenerateNoBuktiResponse {
  tipe: string;
  nobukti: string;
  generatedAt: string;
}
export interface IGiro {
  nogiro: string;
  bank: string;
  nominal: number;
  tglterbit: string | null;
  tgljatuhtempo: string | null;
  statusgiro: string;
  tipe: string;
  keterangan: string;
}

export interface IDeposito {
  nodeposito: string;
  bank: string;
  nominal: number;
  bunga: number;
  tglbuka: string | null;
  tgljatuhtempo: string | null;
  statusdeposito: string;
  keterangan: string;
}

/** Mirrors SDBHUTPIUT (DBHUTPIUT table) structure.
 *  Used in hutPiutList of ICreateKasBankPayload.
 *
 *  Key fields:
 *  - NoFaktur: Invoice/Faktur number
 *  - NoMsk: Urut of the detail row that triggered this entry
 *  - Tipe: PT/HT/UPT/UHT — determines Debet vs Kredit direction
 *    (PT+/UPT+ = Kredit, PT-/UPT- = Debet for piutang)
 *    (HT+/UHT+ = Kredit, HT-/UHT- = Debet for hutang)
 *  - NoBukti: the KasBank voucher NoBukti (filled by service layer)
 *  - TglBukti: transaction date
 *  - TglJatuhTempo: invoice due date
 *  - Debet/Kredit: the payment amount (direction by Tipe)
 *  - Valas/Kurs/DebetD/KreditD: foreign currency amounts
 */
export interface IHutPiut {
  nofaktur: string;
  noretur?: string;
  tiptrans?: string;
  kodecustsupp: string;
  nobukti?: string;     // Set by service layer if empty
  nomsk?: number;       // Urut of detail row (default 1, set by service)
  tanggal?: string;
  jatuhtempo?: string;
  debet?: number;
  kredit?: number;
  valas?: string;
  kurs?: number;
  debetd?: number;
  kreditd?: number;
  saldo?: number;
  saldod?: number;
  tipetrans?: string;
  tipe?: string;        // PT/HT/UPT/UHT
  perkiraan?: string;
  catatan?: string;
  noinvoice?: string;
  kodevls_?: string;
  kurs_?: number;
  kursbayar?: number;
}

export interface ISubTransactionResult {
  trigger: 'giro' | 'deposito' | 'hutpiut' | 'aktiva' | '';
  kode: string;
  statusP: string;
  statusL: string;
}

export interface IOutstandingHutPiut {
  nofaktur: string;
  tanggal: string | null;
  jatuhtempo: string | null;
  catatan: string | null;
  debet: number;
  kredit: number;
  debetd: number;
  kredited: number;
  valas: string | null;
  kurs: number;
  tipetrans: string | null;
  nobukti: string | null;
  kodecustsupp: string;
  perkiraan: string;
  jmlbayar: number;
  saldo: number;
}

export interface ICustSupp {
  // Match backend SDBCUSTSUPP PascalCase fields (camelized JSON response).
  KodeCustSupp: string;
  NamaCustSupp: string;
}
