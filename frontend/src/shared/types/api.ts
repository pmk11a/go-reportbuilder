export interface IAPIResponse<T = any> {
  success: boolean
  status?: number
  data?: T
  message?: string
  error?: string
}

export interface IPaginatedResponse<T = any> {
  success: boolean
  status?: number
  message?: string
  data: T[]
  pagination?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  meta?: {
    total: number;
    page: number;
    limit: number;
  }
}

export interface IPeriodeData {
  USERID: string
  BULAN: string
  TAHUN: string
}
