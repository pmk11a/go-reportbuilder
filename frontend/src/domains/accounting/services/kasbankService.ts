import {
  resolveSubTransactionFn,

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
  lookupDevisiFn,
  downloadKasBankPdfFn,
} from '@/server/functions/accounting/kasbank'
import type { IAPIResponse } from '@/shared/types/api'
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
} from '@/domains/accounting/types/kasbank'

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

  async update(noBukti: string, data: IUpdateKasBankPayload): Promise<IAPIResponse<any>> {
    const result = await updateKasBankFn({ data: { noBukti, body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async delete(noBukti: string): Promise<IAPIResponse<any>> {
    const result = await deleteKasBankFn({ data: { noBukti } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async getDetailList(noBukti: string): Promise<IAPIResponse<{header: any, details: any[]}>> {
    const result = await getKasBankDetailListFn({ data: { noBukti } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async getDetail(noBukti: string, urut: number): Promise<IAPIResponse<IKasBankDetail>> {
    const result = await getKasBankDetailFn({ data: { noBukti, urut } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async addDetail(noBukti: string, data: IAddDetailPayload): Promise<IAPIResponse<any>> {
    const result = await addKasBankDetailFn({ data: { noBukti, body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async updateDetail(noBukti: string, urut: number, data: IUpdateDetailPayload): Promise<IAPIResponse<any>> {
    const result = await updateKasBankDetailFn({ data: { noBukti, urut, body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async deleteDetail(noBukti: string, urut: number): Promise<IAPIResponse<any>> {
    const result = await deleteKasBankDetailFn({ data: { noBukti, urut } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async setOtorisasi(noBukti: string, data: IOtorisasiRequest): Promise<IAPIResponse<any>> {
    const result = await setOtorisasiFn({ data: { noBukti, body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async batalOtorisasi(noBukti: string, level: number): Promise<IAPIResponse<any>> {
    const result = await batalOtorisasiFn({ data: { noBukti, body: { level } } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async generateNoBukti(tipe: string, devisi?: string): Promise<IAPIResponse<IGenerateNoBuktiResponse>> {
    const result = await generateNoBuktiFn({ data: { tipe, devisi } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async lookupPerkiraan(q: string, kelompokKas?: string): Promise<IAPIResponse<IPerkiraan[]>> {
    const result = await lookupPerkiraanFn({ data: { q, kelompokKas: kelompokKas === 'true' } })
    return { success: true, status: 200, message: 'Success', data: result as any }
  },

  async lookupDevisi(): Promise<IAPIResponse<any[]>> {
    const result = await lookupDevisiFn()
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async downloadPdf(noBukti: string): Promise<Blob> {
    const result = await downloadKasBankPdfFn({ data: { noBukti } })
    if (result instanceof Blob) return result
    throw new Error('Failed to download PDF')
  },

  async resolveSubTransaction(perkiraan: string, dk: string): Promise<IAPIResponse<any>> {
    const result = await resolveSubTransactionFn({ data: { perkiraan, dk } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },
}
