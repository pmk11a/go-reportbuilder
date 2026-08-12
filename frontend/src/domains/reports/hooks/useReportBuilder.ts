import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IReportConfig, ILayoutConfig } from '@/domains/reports/types';
import { getReportFn, updateReportFn, getFiltersFn } from '@/server/functions/admin/reports';

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_FILTERS = [
  { id_parameter: 1, id_laporan: 140, nama_filter: 'tgl_awal', label: 'Tanggal Awal', tipe_input: 'date', wajib_isi: true, posisi: 1, konfigurasi: null, nilai_default: null },
  { id_parameter: 2, id_laporan: 140, nama_filter: 'tgl_akhir', label: 'Tanggal Akhir', tipe_input: 'date', wajib_isi: true, posisi: 2, konfigurasi: null, nilai_default: null }
];

const MOCK_LAYOUTS: Record<string, any> = {
  header: {
    type: 'header',
    rows: [
      { columns: [{ text: 'DANA PENSIUN PEMBERI KERJA', align: 'left', width: '50%', sourceType: 'static' }, { text: 'Tanggal: {current_date}', align: 'right', width: '50%', sourceType: 'system' }] },
      { columns: [{ text: 'LAPORAN KAS', align: 'center', colSpan: 2, sourceType: 'static' }] },
      { columns: [{ text: '{nama_laporan}', align: 'center', colSpan: 2, sourceType: 'database' }] }
    ]
  },
  body: {
    type: 'body',
    rows: [
      {
        columns: [
          {
            width: '100%',
            table: {
              dataset: 'T2',
              headerRows: [
                [
                  { text: 'Tgl.', rowSpan: 2, width: '8%', align: 'center' }, { text: 'No. Bukti', rowSpan: 2, width: '12%', align: 'center' }, { text: 'Uraian', rowSpan: 2, width: '25%', align: 'center' }, { text: 'Perk.', rowSpan: 2, width: '10%', align: 'center' }, { text: 'TUNAI', colSpan: 2, align: 'center' }, { text: 'CH / GB', colSpan: 2, align: 'center' }
                ],
                [
                  { text: 'Penerimaan', align: 'center', width: '11.25%' }, { text: 'Pengeluaran', align: 'center', width: '11.25%' }, { text: 'Penerimaan', align: 'center', width: '11.25%' }, { text: 'Pengeluaran', align: 'center', width: '11.25%' }
                ]
              ],
              dataColumns: [
                { field: 'tanggal', align: 'center' }, { field: 'nobukti', align: 'center' }, { field: 'Keterangan', align: 'left' }, { field: 'lawan', align: 'left' }, { field: 'Debet', align: 'right' }, { field: 'kredit', align: 'right' }, { field: 'Debet2', align: 'right' }, { field: 'kredit2', align: 'right' }
              ]
            }
          }
        ]
      }
    ]
  },
  footer: {
    type: 'footer',
    rows: [
      {
        justifyContent: 'space-between',
        columns: [
          { title: 'Kontrol,', name: '.......................', role: 'Bag. Kontrol', align: 'center' },
          { title: 'Kasir,', name: '.......................', role: 'Kasir', align: 'center' },
          { title: 'Mengetahui,', name: '.......................', role: 'Pimpinan', align: 'center' }
        ]
      }
    ]
  }
};

const mockFetch = async <T>(data: T, delay = 500): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

// ============================================================
// QUERIES (GET DATA) - StaleTime: 5 Minutes
// ============================================================

export function useGetTabGeneral(reportId: number | null) {
  return useQuery({
    queryKey: ['report-builder', 'general', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const res = await getReportFn({ data: { id: reportId } });
      return res.data;
    },
    enabled: !!reportId,
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}

export function useGetTabFilters(reportId: number | null) {
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
    enabled: !!reportId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetTabLayout(reportId: number | null, componentName: 'header' | 'body' | 'footer') {
  return useQuery({
    queryKey: ['report-builder', 'layout', componentName, reportId],
    queryFn: async () => mockFetch(MOCK_LAYOUTS[componentName] as ILayoutConfig),
    enabled: !!reportId,
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
