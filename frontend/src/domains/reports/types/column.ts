export interface IReportColumn {
  id_kolom: number
  id_laporan: number
  nama_dataset: string
  nama_kolom: string
  label_tampil: string
  urutan_tampil: number
  format_type: IColumnFormatType
  alignment: IColumnAlignment
  is_summable: boolean
  is_visible: boolean
}

export type IColumnFormatType = 'text' | 'date' | 'number' | 'currency'
export type IColumnAlignment = 'left' | 'center' | 'right'
