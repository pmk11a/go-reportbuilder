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
  generateNoBuktiPreviewFn,
  lookupPerkiraanFn,
  lookupDevisiFn,
  downloadKasBankPdfFn,
  getOutstandingHutPiutFn,
  lookupCustSuppFn,
  lookupBagianFn,
  lookupAkumulasiAktivaFn,
  lookupBiayaAktivaFn,
  generateNoUrutAktivaFn,
  generateNoUrutAktiva2Fn,
  lookupAktivaGroupByKodeFn,
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

  async generateNoBuktiPreview(tipe: string): Promise<{ noBukti: string; seq: string; generatedAt?: string }> {
    const result = await generateNoBuktiPreviewFn({ data: { tipe } })
    return result as { noBukti: string; seq: string; generatedAt?: string }
  },

  async lookupPerkiraan(q: string, kelompokKas?: string): Promise<IAPIResponse<IPerkiraan[]>> {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (kelompokKas) sp.set('kelompokKas', kelompokKas)
    // lookupPerkiraanFn returns the underlying SKasBankLookupPerkiraanResponse
    // (already envelope-unwrapped): { items: SDbPerkiraan[], total: number }.
    const result: any = await lookupPerkiraanFn({ data: { q: sp.get('q') ?? '', kelompokKas: sp.get('kelompokKas') === 'true', limit: 50 } })
    const items: IPerkiraan[] = Array.isArray(result?.items)
      ? result.items
      : Array.isArray(result)
      ? result
      : []
    return {
      success: true,
      status: 200,
      message: 'Success',
      data: items,
    } as IAPIResponse<IPerkiraan[]>
  },

  async lookupDevisi(): Promise<any[]> {
    // lookupDevisiFn returns the raw `data` array of the response envelope.
    const result: any = await lookupDevisiFn()
    return Array.isArray(result) ? result : (result as any)?.data ?? []
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
    // Belt-and-suspenders: handle raw array OR wrapper OR null
    if (Array.isArray(result)) return result as IOutstandingHutPiut[]
    return ((result as any)?.data as IOutstandingHutPiut[] | undefined) ?? []
  },

  async lookupCustSupp(q: string, perkiraan?: string): Promise<ICustSupp[]> {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (perkiraan) sp.set('perkiraan', perkiraan);
    const result = await lookupCustSuppFn({ data: { query: `?${sp.toString()}` } })
    // Belt-and-suspenders: handle raw array OR wrapper OR null
    if (Array.isArray(result)) return result as ICustSupp[]
    return ((result as any)?.data as ICustSupp[] | undefined) ?? []
  },

  async lookupBagian(q: string): Promise<any[]> {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    const result = await lookupBagianFn({ data: { query: `?${sp.toString()}` } })
    if (Array.isArray(result)) return result as any[]
    return ((result as any)?.data as any[] | undefined) ?? []
  },

  async lookupAkumulasiAktiva(q: string): Promise<any[]> {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    const result = await lookupAkumulasiAktivaFn({ data: { query: `?${sp.toString()}` } })
    if (Array.isArray(result)) return result as any[]
    return ((result as any)?.data as any[] | undefined) ?? []
  },

  async lookupBiayaAktiva(q: string): Promise<any[]> {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    const result = await lookupBiayaAktivaFn({ data: { query: `?${sp.toString()}` } })
    if (Array.isArray(result)) return result as any[]
    return ((result as any)?.data as any[] | undefined) ?? []
  },

  async generateNoUrutAktiva(perkiraan: string, devisi: string): Promise<string> {
    const result = await generateNoUrutAktivaFn({ data: { perkiraan, devisi } })
    // Server function returns result.data (the string directly), not {data: {nourut: ...}}
    return ((result as any)?.nourut ?? result ?? '') as string
  },

  async generateNoUrutAktiva2(prefix: string, devisi: string): Promise<string> {
    const result = await generateNoUrutAktiva2Fn({ data: { prefix, devisi } })
    return ((result as any)?.nourut2 ?? result ?? '') as string
  },

  async lookupPerkiraanByKode(kode: string): Promise<any> {
    // The Aktiva group's perkiraan is identified by dbposthutpiut.Kode='AKV'
    // (Delphi: PerkiraanKeyDown for FrmSubAktiva uses DBPOSTHUTPIUT,
    // not DBPERKIRAAN). Therefore AktivaSubForm now calls
    // lookupAktivaGroupByKode (DBPOSTHUTPIUT-backed) instead of this generic
    // DBPERKIRAAN lookup. This method is retained for non-Aktiva callers
    // (e.g. detail-row Perkiraan lookup).
    const result: any = await lookupPerkiraanFn({ data: { q: kode, kelompokKas: false, limit: 1 } })
    const arr: any[] = Array.isArray(result)
      ? result
      : Array.isArray(result?.items)
      ? result.items
      : Array.isArray(result?.data)
      ? result.data
      : []
    return arr[0] ?? null
  },

  /**
   * Lookup Group Aktiva by kode — backed by dbposthutpiut (Kode='AKV'),
   * mirrors Delphi PerkiraanKeyDown for the Aktiva sub-form.
   * Returns array of { perkiraan, keterangan, namadevisi }.
   */
  async lookupAktivaGroup(query: string): Promise<any[]> {
    const result = await lookupAktivaGroupByKodeFn({ data: { q: query } })
    if (Array.isArray(result)) return result as any[]
    return ((result as any)?.data as any[] | undefined) ?? []
  },

  async lookupAktivaGroupByKode(kode: string): Promise<any> {
    const rows = await this.lookupAktivaGroup(kode)
    return rows[0] ?? null
  },

  async lookupBagianByKode(kode: string): Promise<any> {
    return this.lookupBagian(kode).then((rows) => rows[0] ?? null)
  },

  async lookupDevisiByKode(kode: string): Promise<any> {
    const result = await lookupDevisiFn()
    const rows: any[] = Array.isArray(result) ? result : (result as any)?.data ?? []
    return rows.find((d: any) => d.Devisi === kode || d.devisi === kode) ?? null
  },

  async lookupAkumulasiByKode(kode: string): Promise<any> {
    return this.lookupAkumulasiAktiva(kode).then((rows) => rows[0] ?? null)
  },

  async lookupBiayaByKode(kode: string): Promise<any> {
    return this.lookupBiayaAktiva(kode).then((rows) => rows[0] ?? null)
  },
}
