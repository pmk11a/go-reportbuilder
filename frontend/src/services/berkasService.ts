import { fetchHelper } from '@/lib/api'
import type { IAPIResponse, IPeriodeData } from '@/types/api'

export const berkasService = {
  /**
   * Mendapatkan periode aktif untuk user saat ini
   */
  async getPeriode(): Promise<IAPIResponse<IPeriodeData>> {
    try {
      return await fetchHelper<IAPIResponse<IPeriodeData>>('/berkas/get-periode')
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Gagal memuat periode'
      }
    }
  },

  /**
   * Mengupdate periode aktif
   */
  async setPeriode(bulan: string, tahun: string): Promise<IAPIResponse<any>> {
    try {
      return await fetchHelper<IAPIResponse<any>>('/berkas/set-periode', {
        method: 'PUT',
        body: JSON.stringify({ BULAN: bulan, TAHUN: tahun })
      })
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Gagal menyimpan periode'
      }
    }
  }
}
