export interface IActivityLogField {
  id?: number;
  field_name: string;
  display_name: string;
  is_tracked: boolean;
  is_sensitive: boolean;
  field_type: string;
  sort_order: number;
}

export interface IActivityLogConfig {
  id?: number;
  table_name: string;
  target_table: string;
  display_name: string;
  source_name: string;
  primary_key_field: string;
  is_enabled: boolean;
  log_create: boolean;
  log_update: boolean;
  log_delete: boolean;
  fields: IActivityLogField[];
}

export interface IActivityLogRes {
  id: number;
  tahun: number;
  bulan: number;
  tanggal: string;
  pemakai: string;
  aktivitas: string;
  sumber: string;
  no_bukti: string;
  keterangan: string;
}
