import { getPeriodeFn, setPeriodeFn } from '@/server/functions/berkas'
import type { IAPIResponse, IPeriodeData } from '@/shared/types/api'

export const berkasService = {
  async getPeriode(): Promise<IAPIResponse<IPeriodeData>> {
    const result = await getPeriodeFn()
    return result as IAPIResponse<IPeriodeData>
  },

  async setPeriode(bulan: string, tahun: string): Promise<IAPIResponse<any>> {
    const result = await setPeriodeFn({ data: { body: { BULAN: bulan, TAHUN: tahun } } })
    return result as IAPIResponse<any>
  },
}
