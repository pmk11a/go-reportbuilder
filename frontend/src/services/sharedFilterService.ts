import { getCustomersFn, getPerkiraanFn, getKelompokKasFn } from '@/server/functions/shared/filters'

export interface CustomerData {
  KODECUSTSUPP: string
  NAMACUSTSUPP: string
  ALAMAT1: string
  Kota: string
}

export interface IPaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
}

export interface PerkiraanData {
  id: string
  text: string
  Kode?: string
  Description?: string
}

export const sharedFilterService = {
  async getCustomers(jenis: number, search: string = '', page: number = 1): Promise<IPaginatedResponse<CustomerData>> {
    const result = await getCustomersFn({ data: { jenis, search, page } })
    return result as any
  },

  async getPerkiraan(query: string = '', without?: string, posthutpiut?: string): Promise<PerkiraanData[]> {
    const result = await getPerkiraanFn({ data: { q: query, without, posthutpiut } })
    return result as any
  },

  async getKelompokKas(type: string = 'KAS', query: string = ''): Promise<PerkiraanData[]> {
    const result = await getKelompokKasFn({ data: { type, query } })
    return result as any
  },
}
