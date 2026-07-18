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
  /** Customer/supplier code for pelunasan settlement */
  kode_cust_supp?: string;
  /** Selected Hutang/Piut items */
  hutpiut_selected?: any[];
}

export interface ICreateKasBankPayload {
  tanggal: string;
  tipeTransHd: KasBankTipe;
  perkiraanHd: string;
  note: string;
  tgljurnal?: string;      // Batas Waktu
  noJurnal?: string;       // No. Order
  noBuktiSem?: string;     // No. Invoice (not in DBTRANS, stored in detail)
  noOrder?: string;        // alias kept for compatibility
  noInvoice?: string;      // alias kept for compatibility
  kodeProject?: string;
  devisi: string;
  nobon: string;
  tphc: string;
  details: IDetailRow[];
  giroList?: Array<any>;
  depositoList?: Array<any>;
  hutPiutList?: Array<any>; // Should map to SDBHUTPIUT structure
  aktivaList?: Array<any>; // Should map to SDBAKTIVA structure
}

export interface IAktiva {
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
  details?: Array<{
    perkiraan: string;
    lawan: string;
    debet: number;
    kredit: number;
    keterangan: string;
    valas?: string;
    kurs?: number;
  }>;
  giroList?: IGiro[];
  depositoList?: IDeposito[];
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
  /** Customer/supplier code for pelunasan settlement */
  kode_cust_supp?: string;
  /** Selected Hutang/Piut items */
  hutpiut_selected?: any[];
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
  kode: string;
  nama: string;
}
