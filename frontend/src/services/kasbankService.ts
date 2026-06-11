import {
  getKasBankListFn,
  getKasBankByNoBuktiFn,
  createKasBankFn,
  updateKasBankFn,
  deleteKasBankFn,
  getKasBankDetailListFn,
  getKasBankDetailFn,
  addKasBankDetailFn,
  updateKasBankDetailFn,
  deleteKasBankDetailFn,
  setOtorisasiFn,
  batalOtorisasiFn,
  generateNoBuktiFn,
  lookupPerkiraanFn,
  downloadKasBankPdfFn,
} from '@/server/functions/accounting/kasbank'
import type { IAPIResponse } from '@/types/api'
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
} from '@/types/kasbank'

function buildQuery(params: IKasBankListParams): string {
  const sp = new URLSearchParams()
  if (params.tipe) sp.set('tipe', params.tipe)
  if (params.search) sp.set('search', params.search)
  if (params.dateFrom) sp.set('dateFrom', params.dateFrom)
  if (params.dateTo) sp.set('dateTo', params.dateTo)
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('perPage', String(params.perPage))
  if (params.sortBy) sp.set('sortBy', params.sortBy)
  if (params.sortDir) sp.set('sortDir', params.sortDir)
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const kasbankService = {
  async getPaginated(params: IKasBankListParams): Promise<IAPIResponse<IKasBankListResponse>> {
    const result = await getKasBankListFn({ data: { query: buildQuery(params) } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async getByNoBukti(noBukti: string): Promise<IAPIResponse<IKasBankHeader>> {
    const result = await getKasBankByNoBuktiFn({ data: { noBukti } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async create(data: ICreateKasBankPayload): Promise<IAPIResponse<IKasBankHeader>> {
    const result = await createKasBankFn({ data: { body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async update(noBukti: string, data: IUpdateKasBankPayload): Promise<IAPIResponse<IKasBankHeader>> {
    const result = await updateKasBankFn({ data: { noBukti, body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async delete(noBukti: string): Promise<IAPIResponse<null>> {
    await deleteKasBankFn({ data: { noBukti } })
    return { success: true, status: 200, message: 'Success', data: null }
  },

  async getDetailList(noBukti: string): Promise<IAPIResponse<{ items: IKasBankDetail[] }>> {
    const result = await getKasBankDetailListFn({ data: { noBukti } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async getDetail(noBukti: string, urut: number): Promise<IAPIResponse<IKasBankDetail>> {
    const result = await getKasBankDetailFn({ data: { noBukti, urut } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async addDetail(noBukti: string, data: IAddDetailPayload): Promise<IAPIResponse<IKasBankDetail>> {
    const result = await addKasBankDetailFn({ data: { noBukti, body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async updateDetail(noBukti: string, urut: number, data: IUpdateDetailPayload): Promise<IAPIResponse<IKasBankDetail>> {
    const result = await updateKasBankDetailFn({ data: { noBukti, urut, body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async deleteDetail(noBukti: string, urut: number): Promise<IAPIResponse<null>> {
    await deleteKasBankDetailFn({ data: { noBukti, urut } })
    return { success: true, status: 200, message: 'Success', data: null }
  },

  async setOtorisasi(noBukti: string, data: IOtorisasiRequest): Promise<IAPIResponse<IKasBankHeader>> {
    const result = await setOtorisasiFn({ data: { noBukti, body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async batalOtorisasi(noBukti: string, data: IOtorisasiRequest): Promise<IAPIResponse<IKasBankHeader>> {
    const result = await batalOtorisasiFn({ data: { noBukti, body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async generateNoBukti(tipe: string): Promise<IAPIResponse<IGenerateNoBuktiResponse>> {
    const result = await generateNoBuktiFn({ data: { tipe } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async lookupPerkiraan(q: string, kelompokKas: boolean = false, limit: number = 50): Promise<IAPIResponse<{ items: IPerkiraan[]; total: number }>> {
    const result = await lookupPerkiraanFn({ data: { q, kelompokKas, limit } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async downloadPdf(noBukti: string): Promise<Blob> {
    const result = await downloadKasBankPdfFn({ data: { noBukti } })
    return new Blob([new Uint8Array(result.buffer)], { type: result.contentType })
  },
}
