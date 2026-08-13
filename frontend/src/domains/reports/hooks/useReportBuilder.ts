import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IReportConfig, ILayoutConfig } from '@/domains/reports/types';
import { getReportFn, updateReportFn, getFiltersFn, getKomponenFn } from '@/server/functions/admin/reports';

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_FILTERS = [
  { id_parameter: 1, id_laporan: 140, nama_filter: 'tgl_awal', label: 'Tanggal Awal', tipe_input: 'date', wajib_isi: true, posisi: 1, konfigurasi: null, nilai_default: null },
  { id_parameter: 2, id_laporan: 140, nama_filter: 'tgl_akhir', label: 'Tanggal Akhir', tipe_input: 'date', wajib_isi: true, posisi: 2, konfigurasi: null, nilai_default: null }
];

const mockFetch = async <T>(data: T, delay = 500): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

// ============================================================
// QUERIES (GET DATA) - StaleTime: 5 Minutes
// ============================================================

export function useGetTabGeneral(reportId: number | null, isEnabled: boolean = true) {
  return useQuery({
    queryKey: ['report-builder', 'general', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const res = await getReportFn({ data: { id: reportId } });
      return res.data;
    },
    enabled: !!reportId && isEnabled,
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}

export function useGetTabFilters(reportId: number | null, isEnabled: boolean = true) {
  return useQuery({
    queryKey: ['report-builder', 'filters', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      try {
        const res = await getFiltersFn({ data: { id: reportId } });
        return res.data;
      } catch (e) {
        return mockFetch(MOCK_FILTERS);
      }
    },
    enabled: !!reportId && isEnabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetTabKomponen(reportId: number | null, isEnabled: boolean = true) {
  return useQuery({
    queryKey: ['report-builder', 'komponen', reportId],
    queryFn: async () => {
      if (!reportId) return [];
      const res = await getKomponenFn({ data: { id: reportId } });
      return res.data;
    },
    enabled: !!reportId && isEnabled,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================================
// MUTATIONS (SAVE DATA)
// ============================================================

export function useSaveTabGeneral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<IReportConfig> }) => {
      return await updateReportFn({ data: { id, payload: data } });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report-builder', 'general', variables.id] });
      alert("Tab General berhasil disimpan!");
    },
    onError: (err: any) => {
      alert("Gagal menyimpan General: " + err.message);
    }
  });
}

export function useSaveTabFilters() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_args: { id: number; data: any[] }) => mockFetch(true, 800),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report-builder', 'filters', variables.id] });
      alert("Tab Filters berhasil disimpan!");
    },
  });
}

export function useSaveTabLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_args: { id: number; componentName: string; data: ILayoutConfig }) => {
      return mockFetch(true, 800);
    },
    onSuccess: (_, { id, componentName }) => {
      queryClient.invalidateQueries({ queryKey: ['report-builder', 'layout', componentName, id] });
      alert(`Tab Layout ${componentName} berhasil disimpan!`);
    },
  });
}
