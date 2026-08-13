export interface IReportDataset {
  id_query: number
  id_laporan: number
  nama_dataset: string
  deskripsi: string | null
  query_sumber_data: string
  urutan: number
  visible: boolean
  config_json?: IDatasetConfig | null
}

export interface IDatasetConfig {
  scope?: 'global' | 'filter' | 'header' | 'body' | 'footer'
  display_role?: 'summary' | 'detail'
  summary_layout?: 'grid_2col' | 'grid_1col'
  detail_dataset?: string
  t2_sum_fields?: string[]
  bon_giro_fields?: string[]
  summary_fields?: string[]
  right_fields?: string[]
  computed?: Record<string, IComputedColumn>
  detail_layout?: string
}

export interface IComputedColumn {
  expression: string
  operands: Record<string, IOperandSource>
}

export type IOperandSource = 't1' | 'sum:t1' | 'sum:t2'
