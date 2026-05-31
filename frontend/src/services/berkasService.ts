import { fetchHelper } from '@/lib/api'
import type { IAPIResponse, IPeriodeData } from '@/types/api'

export const berkasService = {
  /**
   * Mendapatkan periode aktif untuk user saat ini
   */
  async getPeriode(): Promise<IAPIResponse<IPeriodeData>> {
    return await fetchHelper<IAPIResponse<IPeriodeData>>('/berkas/get-periode')
  },

  /**
   * Mengupdate periode aktif
   */
  async setPeriode(bulan: string, tahun: string): Promise<IAPIResponse<any>> {
    return await fetchHelper<IAPIResponse<any>>('/berkas/set-periode', {
      method: 'PUT',
      body: JSON.stringify({ BULAN: bulan, TAHUN: tahun })
    })
  }
}
