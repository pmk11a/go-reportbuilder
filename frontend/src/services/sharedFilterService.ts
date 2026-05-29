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
    // Expected endpoint: GET /api/customers?jenis=0&search=...&page=1
    // The backend should return data from DBCUSTSUPP
    try {
      const response = await fetchHelper<{ data: IPaginatedResponse<CustomerData> }>('/customers', {
        params: { jenis, search, page }
      });
      return response.data || { data: [], current_page: 1, last_page: 1, total: 0 };
    } catch (error) {
      console.error("Error fetching customers", error);
      return { data: [], current_page: 1, last_page: 1, total: 0 };
    }
  },

  async getPerkiraan(query: string = '', without?: string, posthutpiut?: string): Promise<PerkiraanData[]> {
    // Expected endpoint: GET /api/perkiraan?q=...&without=...&posthutpiut=...
    try {
      const params: any = { q: query };
      if (without) params.without = without;
      if (posthutpiut) params.posthutpiut = posthutpiut;
      
      const response = await fetchHelper<{ data: PerkiraanData[] }>('/perkiraan', { params });
      return response.data || [];
    } catch (error) {
      console.error("Error fetching perkiraan", error);
      return [];
    }
  },

  async getKelompokKas(type: string = 'KAS', query: string = ''): Promise<PerkiraanData[]> {
    // Expected endpoint: GET /api/perkiraan/kelompok-kas?type=KAS&query=...
    try {
      const response = await fetchHelper<{ data: PerkiraanData[] }>('/perkiraan/kelompok-kas', {
        params: { type, query }
      });
      return response.data || [];
    } catch (error) {
      console.error("Error fetching kelompok kas", error);
      return [];
    }
  }
};
