export interface IReportFilter {
  id_parameter: number
  id_laporan: number
  nama_filter: string
  label: string
  tipe_input: IFilterInputType
  wajib_isi: boolean
  nilai_default: string | null
  posisi: number
  konfigurasi: IFilterKonfigurasi | null
}

export type IFilterInputType =
  | 'date'
  | 'month'
  | 'year'
  | 'text'
  | 'number'
  | 'combobox'
  | 'browse'
  | 'dropdown'
  | 'select'
  | 'select-db'
  | 'checkbox'
  | 'perkiraan'

export interface IFilterKonfigurasi {
  colspan?: number
  kode_browse?: string
  mode?: 'checkbox' | 'dropdown'
  parent_filter?: string
  parent_filters?: IParentFilter[]
  default_source?: {
    type: 'static' | 'prefetch';
    prefetch_id?: string;
    field_name?: string;
  };
  query?: string;
  value_field?: string;
  label_field?: string;
  options_statis?: { value: string; label: string }[];
  jenis_sistem?: string;
  options?: string[];
  label_map?: Record<string, string>;
  multi?: boolean;
  is_multiple?: boolean;
}

export interface IParentFilter {
  source: string
  target?: string
  operator?: string
  type?: string
}
