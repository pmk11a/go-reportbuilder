export type KasBankTipe = 'BKM' | 'BKK' | 'BBM' | 'BBK';

export interface IKasBankHeader {
  nobukti: string;
  tanggal: string | null;
  note: string;
  tipetranshd: string;
  perkiraanhd: string | null;
  totald: number;
  totalk: number;
  otorisasi1: boolean;
  otorisasi2: boolean;
  locked: boolean;
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
  details: Array<{
    perkiraan: string;
    lawan: string;
    debet: number;
    kredit: number;
    keterangan: string;
    valas?: string;
    kurs?: number;
  }>;
}

export interface IUpdateKasBankPayload {
  tanggal?: string;
  tipeTransHd?: KasBankTipe;
  perkiraanHd?: string;
  note?: string;
  details?: Array<{
    perkiraan: string;
    lawan: string;
    debet: number;
    kredit: number;
    keterangan: string;
    valas?: string;
    kurs?: number;
  }>;
}

export interface IAddDetailPayload {
  perkiraan: string;
  lawan: string;
  debet: number;
  kredit: number;
  keterangan: string;
  valas?: string;
  kurs?: number;
}

export interface IUpdateDetailPayload extends IAddDetailPayload {
  urut: number;
}

export interface IOtorisasiRequest {
  level: 1 | 2;
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