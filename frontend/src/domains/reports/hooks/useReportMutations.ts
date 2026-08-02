import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reportService } from '../services/reportService'
import type { IReportFilter, IReportDataset, IReportColumn, IReportGroup } from '../types'
import { useReportStore } from '../stores/reportStore'

export function useReportMutations(reportId: number) {
  const queryClient = useQueryClient()
  const setError = useReportStore((s) => s.setError)

  const invalidateReport = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'reports', reportId] })
  }

  // --- FILTER MUTATIONS ---
  const createFilter = useMutation({
    mutationFn: async (payload: Partial<IReportFilter>) => reportService.createFilter(reportId, payload),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  const updateFilter = useMutation({
    mutationFn: async ({ filterId, payload }: { filterId: number; payload: Partial<IReportFilter> }) =>
      reportService.updateFilter(reportId, filterId, payload),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  const deleteFilter = useMutation({
    mutationFn: async (filterId: number) => reportService.deleteFilter(reportId, filterId),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  // --- DATASET MUTATIONS ---
  const createDataset = useMutation({
    mutationFn: async (payload: Partial<IReportDataset>) => reportService.createDataset(reportId, payload),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  const updateDataset = useMutation({
    mutationFn: async ({ datasetId, payload }: { datasetId: number; payload: Partial<IReportDataset> }) =>
      reportService.updateDataset(reportId, datasetId, payload),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  const deleteDataset = useMutation({
    mutationFn: async (datasetId: number) => reportService.deleteDataset(reportId, datasetId),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  // --- COLUMN MUTATIONS ---
  const createColumn = useMutation({
    mutationFn: async (payload: Partial<IReportColumn>) => reportService.createColumn(reportId, payload),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  const updateColumn = useMutation({
    mutationFn: async ({ columnId, payload }: { columnId: number; payload: Partial<IReportColumn> }) =>
      reportService.updateColumn(reportId, columnId, payload),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  const deleteColumn = useMutation({
    mutationFn: async (columnId: number) => reportService.deleteColumn(reportId, columnId),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  // --- GROUP MUTATIONS ---
  const createGroup = useMutation({
    mutationFn: async (payload: Partial<IReportGroup>) => reportService.createGroup(reportId, payload),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  const updateGroup = useMutation({
    mutationFn: async ({ groupId, payload }: { groupId: number; payload: Partial<IReportGroup> }) =>
      reportService.updateGroup(reportId, groupId, payload),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  const deleteGroup = useMutation({
    mutationFn: async (groupId: number) => reportService.deleteGroup(reportId, groupId),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  // --- ACCESS MUTATIONS ---
  const grantAccess = useMutation({
    mutationFn: async (payload: { USERID: string; Access?: boolean; IsDesign?: boolean; IsExport?: boolean }) =>
      reportService.grantAccess(reportId, payload),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  const revokeAccess = useMutation({
    mutationFn: async (userId: string) => reportService.revokeAccess(reportId, userId),
    onSuccess: invalidateReport,
    onError: (err) => setError((err as Error).message),
  })

  return {
    createFilter,
    updateFilter,
    deleteFilter,
    createDataset,
    updateDataset,
    deleteDataset,
    createColumn,
    updateColumn,
    deleteColumn,
    createGroup,
    updateGroup,
    deleteGroup,
    grantAccess,
    revokeAccess,
  }
}
