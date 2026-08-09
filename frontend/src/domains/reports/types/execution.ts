import type { IReportConfig } from './report';
import type { IReportGroup } from './group';

export interface IReportExecutionResult {
  datasets: Record<string, Record<string, any>[]>
  groupedData: Record<string, any> | null
  grandTotal: Record<string, number>
  config: IReportConfig
  groupingConfig: IGroupingConfig | null
  errors?: string[]
}

export interface IGroupingConfig {
  specialHandling: string
  config: Record<string, any>
  groups: IReportGroup[]
}

export interface IReportFilterValues {
  [filterName: string]: string | string[] | null
}

export interface IQueryPreviewResult {
  success: boolean
  columns?: string[]
  rows?: Record<string, any>[]
  rowCount?: number
  message?: string
}
