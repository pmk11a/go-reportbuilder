import { fetchHelper } from '@/lib/api'
import type { IAPIResponse } from '@/types/api';
import type {
  IKasBankHeader,
  IKasBankDetail,
  ICreateKasBankPayload,
  IUpdateKasBankPayload,
  IAddDetailPayload,
  IUpdateDetailPayload,
  IOtorisasiRequest,
  IPerkiraan,
  IKasBankListParams,
  IKasBankListResponse,
  IGenerateNoBuktiResponse,
} from '@/types/kasbank';

export const kasbankService = {
  async getPaginated(params: IKasBankListParams): Promise<IAPIResponse<IKasBankListResponse>> {
    const sp = new URLSearchParams();
    if (params.tipe) sp.set('tipe', params.tipe);
    if (params.search) sp.set('search', params.search);
    if (params.dateFrom) sp.set('dateFrom', params.dateFrom);
    if (params.dateTo) sp.set('dateTo', params.dateTo);
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.sortBy) sp.set('sortBy', params.sortBy);
    if (params.sortDir) sp.set('sortDir', params.sortDir);
    return fetchHelper<IAPIResponse<IKasBankListResponse>>(`/accounting/kasbank?${sp.toString()}`);
  },

  async getByNoBukti(noBukti: string): Promise<IAPIResponse<IKasBankHeader>> {
    return fetchHelper<IAPIResponse<IKasBankHeader>>(`/accounting/kasbank/${encodeURIComponent(noBukti)}`);
  },

  async create(data: ICreateKasBankPayload): Promise<IAPIResponse<IKasBankHeader>> {
    return fetchHelper<IAPIResponse<IKasBankHeader>>('/accounting/kasbank', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(noBukti: string, data: IUpdateKasBankPayload): Promise<IAPIResponse<IKasBankHeader>> {
    return fetchHelper<IAPIResponse<IKasBankHeader>>(`/accounting/kasbank/${encodeURIComponent(noBukti)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(noBukti: string): Promise<IAPIResponse<null>> {
    return fetchHelper<IAPIResponse<null>>(`/accounting/kasbank/${encodeURIComponent(noBukti)}`, {
      method: 'DELETE',
    });
  },

  async getDetailList(noBukti: string): Promise<IAPIResponse<{ items: IKasBankDetail[] }>> {
    return fetchHelper<IAPIResponse<{ items: IKasBankDetail[] }>>(`/accounting/kasbank/${encodeURIComponent(noBukti)}/detail`);
  },

  async getDetail(noBukti: string, urut: number): Promise<IAPIResponse<IKasBankDetail>> {
    return fetchHelper<IAPIResponse<IKasBankDetail>>(`/accounting/kasbank/${encodeURIComponent(noBukti)}/detail/${urut}`);
  },

  async addDetail(noBukti: string, data: IAddDetailPayload): Promise<IAPIResponse<IKasBankDetail>> {
    return fetchHelper<IAPIResponse<IKasBankDetail>>(`/accounting/kasbank/${encodeURIComponent(noBukti)}/detail`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDetail(noBukti: string, urut: number, data: IUpdateDetailPayload): Promise<IAPIResponse<IKasBankDetail>> {
    return fetchHelper<IAPIResponse<IKasBankDetail>>(`/accounting/kasbank/${encodeURIComponent(noBukti)}/detail/${urut}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteDetail(noBukti: string, urut: number): Promise<IAPIResponse<null>> {
    return fetchHelper<IAPIResponse<null>>(`/accounting/kasbank/${encodeURIComponent(noBukti)}/detail/${urut}`, {
      method: 'DELETE',
    });
  },

  async setOtorisasi(noBukti: string, data: IOtorisasiRequest): Promise<IAPIResponse<IKasBankHeader>> {
    return fetchHelper<IAPIResponse<IKasBankHeader>>(`/accounting/kasbank/${encodeURIComponent(noBukti)}/otorisasi`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async batalOtorisasi(noBukti: string, data: IOtorisasiRequest): Promise<IAPIResponse<IKasBankHeader>> {
    return fetchHelper<IAPIResponse<IKasBankHeader>>(`/accounting/kasbank/${encodeURIComponent(noBukti)}/batal-otorisasi`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateNoBukti(tipe: string): Promise<IAPIResponse<IGenerateNoBuktiResponse>> {
    return fetchHelper<IAPIResponse<IGenerateNoBuktiResponse>>(`/accounting/kasbank/generate-no-bukti?tipe=${encodeURIComponent(tipe)}`);
  },

  async lookupPerkiraan(q: string, kelompokKas: boolean = false, limit: number = 50): Promise<IAPIResponse<{ items: IPerkiraan[]; total: number }>> {
    const sp = new URLSearchParams({ q, kelompokKas: String(kelompokKas), limit: String(limit) });
    return fetchHelper<IAPIResponse<{ items: IPerkiraan[]; total: number }>>(`/accounting/kasbank/lookup-perkiraan?${sp.toString()}`);
  },

  async downloadPdf(noBukti: string): Promise<Blob> {
    const res = await fetch(`/api/accounting/kasbank/${encodeURIComponent(noBukti)}/pdf`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to download PDF');
    return res.blob();
  },
};