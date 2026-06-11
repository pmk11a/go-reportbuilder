import { getPeriodeFn, setPeriodeFn } from '@/server/functions/berkas'
import type { IAPIResponse, IPeriodeData } from '@/types/api'

export const berkasService = {
  async getPeriode(): Promise<IAPIResponse<IPeriodeData>> {
    const result = await getPeriodeFn()
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async setPeriode(bulan: string, tahun: string): Promise<IAPIResponse<any>> {
    const result = await setPeriodeFn({ data: { body: { BULAN: bulan, TAHUN: tahun } } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },
}
