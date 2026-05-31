import { fetchHelper } from '@/lib/api';

export interface CustomerData {
  KODECUSTSUPP: string;
  NAMACUSTSUPP: string;
  ALAMAT1: string;
  Kota: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface PerkiraanData {
  id: string;
  text: string;
  Kode?: string;
  Description?: string;
}

export const sharedFilterService = {
  async getCustomers(jenis: number, search: string = '', page: number = 1): Promise<IPaginatedResponse<CustomerData>> {
    const response = await fetchHelper<{ data: IPaginatedResponse<CustomerData> }>('/customers', {
      params: { jenis, search, page }
    });
    return response.data;
  },

  async getPerkiraan(query: string = '', without?: string, posthutpiut?: string): Promise<PerkiraanData[]> {
    const params: any = { q: query };
    if (without) params.without = without;
    if (posthutpiut) params.posthutpiut = posthutpiut;
    
    const response = await fetchHelper<{ data: PerkiraanData[] }>('/perkiraan', { params });
    return response.data;
  },

  async getKelompokKas(type: string = 'KAS', query: string = ''): Promise<PerkiraanData[]> {
    const response = await fetchHelper<{ data: PerkiraanData[] }>('/perkiraan/kelompok-kas', {
      params: { type, query }
    });
    return response.data;
  }
};
