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
  getOutstandingHutPiutFn,
  lookupCustSuppFn,
  lookupBagianFn,
  lookupAkumulasiAktivaFn,
  lookupBiayaAktivaFn,
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
  IOutstandingHutPiut,
  ICustSupp,
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
    return { success: true, status: 200, message: 'Success', data: result.data, meta: result.meta } as any
  },

  async getByNoBukti(noBukti: string): Promise<IAPIResponse<IKasBankHeader>> {
    const result = await getKasBankByNoBuktiFn({ data: { noBukti } })
    return result as IAPIResponse<IKasBankHeader>
  },

  async create(data: ICreateKasBankPayload): Promise<IAPIResponse<IKasBankHeader>> {
    const result = await createKasBankFn({ data: { body: data } })
    return result as IAPIResponse<IKasBankHeader>
  },

  async update(noBukti: string, data: IUpdateKasBankPayload): Promise<IAPIResponse<any>> {
    const result = await updateKasBankFn({ data: { noBukti, body: data } })
    return result as IAPIResponse<any>
  },

  async delete(noBukti: string): Promise<IAPIResponse<any>> {
    const result = await deleteKasBankFn({ data: { noBukti } })
    return result as IAPIResponse<any>
  },

  async getDetailList(noBukti: string): Promise<IAPIResponse<{header: any, details: any[]}>> {
    const result = await getKasBankDetailListFn({ data: { noBukti } })
    return result as IAPIResponse<{header: any, details: any[]}>
  },

  async getDetail(noBukti: string, urut: number): Promise<IAPIResponse<IKasBankDetail>> {
    const result = await getKasBankDetailFn({ data: { noBukti, urut } })
    return result as IAPIResponse<IKasBankDetail>
  },

  async addDetail(noBukti: string, data: IAddDetailPayload): Promise<IAPIResponse<any>> {
    const result = await addKasBankDetailFn({ data: { noBukti, body: data } })
    return result as IAPIResponse<any>
  },

  async updateDetail(noBukti: string, urut: number, data: IUpdateDetailPayload): Promise<IAPIResponse<any>> {
    const result = await updateKasBankDetailFn({ data: { noBukti, urut, body: data } })
    return result as IAPIResponse<any>
  },

  async deleteDetail(noBukti: string, urut: number): Promise<IAPIResponse<any>> {
    const result = await deleteKasBankDetailFn({ data: { noBukti, urut } })
    return result as IAPIResponse<any>
  },

  async setOtorisasi(noBukti: string, data: IOtorisasiRequest): Promise<IAPIResponse<any>> {
    const result = await setOtorisasiFn({ data: { noBukti, body: data } })
    return result as IAPIResponse<any>
  },

  async batalOtorisasi(noBukti: string, data: IOtorisasiRequest): Promise<IAPIResponse<any>> {
    const result = await batalOtorisasiFn({ data: { noBukti, body: data } })
    return result as IAPIResponse<any>
  },

  async generateNoBukti(tipe: string, devisi?: string): Promise<IGenerateNoBuktiResponse> {
    const result = await generateNoBuktiFn({ data: { tipe, devisi } })
    return result as IGenerateNoBuktiResponse
  },

  async lookupPerkiraan(q: string, kelompokKas?: string): Promise<IAPIResponse<IPerkiraan[]>> {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (kelompokKas) sp.set('kelompokKas', kelompokKas)
    const result = await lookupPerkiraanFn({ data: { q: sp.get('q') ?? '', kelompokKas: sp.get('kelompokKas') === 'true', limit: 50 } })
    return result as IAPIResponse<IPerkiraan[]>
  },

  async lookupDevisi(): Promise<any[]> {
    const result = await lookupDevisiFn()
    return result as any[]
  },

  async downloadPdf(noBukti: string): Promise<Blob> {
    const result = await downloadKasBankPdfFn({ data: { noBukti } })
    if (result instanceof Blob) return result
    throw new Error('Failed to download PDF')
  },

  async resolveSubTransaction(perkiraan: string, dk: string): Promise<any> {
    const result = await resolveSubTransactionFn({ data: { perkiraan, dk } })
    return result as any
  },

  async getOutstandingHutPiut(kodeCustSupp: string, perkiraan: string): Promise<IOutstandingHutPiut[]> {
    const sp = new URLSearchParams();
    sp.set('kodeCustSupp', kodeCustSupp);
    sp.set('perkiraan', perkiraan);
    const result = await getOutstandingHutPiutFn({ data: { query: `?${sp.toString()}` } })
    return result as IOutstandingHutPiut[];
  },

  async lookupCustSupp(q: string): Promise<ICustSupp[]> {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    const result = await lookupCustSuppFn({ data: { query: `?${sp.toString()}` } })
    return result as ICustSupp[];
  },

  async lookupBagian(q: string): Promise<any[]> {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    const result = await lookupBagianFn({ data: { query: `?${sp.toString()}` } })
    return result as any[];
  },

  async lookupAkumulasiAktiva(q: string): Promise<any[]> {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    const result = await lookupAkumulasiAktivaFn({ data: { query: `?${sp.toString()}` } })
    return result as any[];
  },

  async lookupBiayaAktiva(q: string): Promise<any[]> {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    const result = await lookupBiayaAktivaFn({ data: { query: `?${sp.toString()}` } })
    return result as any[];
  },

  async lookupPerkiraanByKode(kode: string): Promise<any> {
    const result = await lookupPerkiraanFn({ data: { q: kode, kelompokKas: false, limit: 1 } })
    return (result as any[])[0] || null;
  },

  async lookupBagianByKode(kode: string): Promise<any> {
    const sp = new URLSearchParams();
    sp.set('kodebag', kode);
    const result = await lookupBagianFn({ data: { query: `?${sp.toString()}` } })
    return (result as any[])[0] || null;
  },

  async lookupDevisiByKode(kode: string): Promise<any> {
    const result = await lookupDevisiFn()
    const filtered = (result as any[]).filter((d: any) => d.Kode === kode || d.CODE === kode)
    return filtered[0] || null;
  },

  async lookupAkumulasiByKode(kode: string): Promise<any> {
    const result = await lookupAkumulasiAktivaFn({ data: { query: `?q=${encodeURIComponent(kode)}` } })
    return (result as any[])[0] || null;
  },

  async lookupBiayaByKode(kode: string): Promise<any> {
    const result = await lookupBiayaAktivaFn({ data: { query: `?q=${encodeURIComponent(kode)}` } })
    return (result as any[])[0] || null;
  },
}
