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
  details: Array<{
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
  }>;
  giroList?: Array<any>;
  depositoList?: Array<any>;
  hutPiutList?: Array<any>; // Should map to SDBHUTPIUT structure
  aktivaList?: Array<any>; // Should map to SDBAKTIVA structure
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
  nobukti: string;
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
  nobukti: string;
  keterangan: string;
}

export interface ISubTransactionResult {
  trigger: 'giro' | 'deposito' | 'hutpiut' | 'aktiva' | '';
  kode: string;
  statusP: string;
  statusL: string;
}
