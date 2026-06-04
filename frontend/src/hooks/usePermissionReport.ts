import { useMutation, useQuery } from '@tanstack/react-query'
import { permissionReportService } from '@/services/permissionReportService'
import type {
  IPermissionReportFilters,
  IPermissionReportResponse,
} from '@/types/permissionReport'

export const PERMISSION_REPORT_MATRIX_STALE_TIME = 5 * 60 * 1000 // 5 minutes

export const permissionReportKeys = {
  all: ['permission-report'] as const,
  matrix: (filters: IPermissionReportFilters) =>
    ['permission-report', 'matrix', filters] as const,
}

/**
 * Fetches the JSON matrix and caches it for 5 minutes per filter combination.
 * Pass `{ enabled: false }` via the second argument to defer the network call
 * until the user clicks "Apply Filters".
 */
export function usePermissionReportMatrix(
  filters: IPermissionReportFilters,
  options: { enabled?: boolean } = {}
) {
  return useQuery<IPermissionReportResponse>({
    queryKey: permissionReportKeys.matrix(filters),
    queryFn: () => permissionReportService.getMatrix(filters),
    enabled: options.enabled ?? true,
    staleTime: PERMISSION_REPORT_MATRIX_STALE_TIME,
  })
}

/**
 * Mutation that triggers an XLSX download. Returns a `Blob` from the
 * `.mutateAsync(filters)` call so the caller can dispatch the file save.
 */
export function useDownloadPermissionReportExcel() {
  return useMutation<Blob, Error, IPermissionReportFilters>({
    mutationFn: (filters) => permissionReportService.downloadExcel(filters),
  })
}

/**
 * Mutation that triggers a PDF download. Returns a `Blob` from the
 * `.mutateAsync(filters)` call so the caller can dispatch the file save.
 */
export function useDownloadPermissionReportPDF() {
  return useMutation<Blob, Error, IPermissionReportFilters>({
    mutationFn: (filters) => permissionReportService.downloadPDF(filters),
  })
}
