import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { berkasService } from '@/domains/berkas/services/berkasService'
import type { IPeriodeData } from '@/shared/types/api'

export const useGetPeriode = () => {
  return useQuery({
    queryKey: ['periode'],
    queryFn: async () => {
      const response = await berkasService.getPeriode()
      if (!response.success) {
        throw new Error(response.message || 'Failed to get periode')
      }
      return response.data as IPeriodeData
    }
  })
}

export const useSetPeriode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bulan, tahun }: { bulan: string; tahun: string }) => {
      const response = await berkasService.setPeriode(bulan, tahun)
      if (!response.success) {
        throw new Error(response.message || 'Failed to set periode')
      }
      return response
    },
    onSuccess: () => {
      // Invalidate the cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['periode'] })
    }
  })
}
