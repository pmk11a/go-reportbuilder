export interface IReportGroup {
  id_group: number
  id_laporan: number
  group_level: number
  group_field: string | null
  field_value: string | null
  label: string
  sort_order: number
  show_subtotal: boolean
  style_config: Record<string, any> | null
  special_handling: IGroupSpecialHandling
  config_json: Record<string, any> | null
}

export type IGroupSpecialHandling = 'default' | 'running-balance' | 'category-label'
