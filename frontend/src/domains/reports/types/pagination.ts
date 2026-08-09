import type { IReport } from './report';

export interface IReportListParams {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive' | 'all'
  kodeMenu?: string
}

export interface IReportListResponse {
  items: IReport[]
  total: number
  page: number
  perPage: number
}
