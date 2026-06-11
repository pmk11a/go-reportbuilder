import { create } from 'zustand'
import type { ReportModel, LayoutConfig, ReportFilter, ReportDataset, LayoutTable } from '@/domains/accounting/types/report'

interface AdminReportState {
  activeReport: ReportModel | null;
  isLoading: boolean;
  
  // Actions
  setActiveReport: (report: ReportModel) => void;
  updateGeneral: (data: Partial<ReportModel>) => void;
  updateLayoutConfig: (config: LayoutConfig) => void;
  
  // Helpers
  addFilter: (filter: ReportFilter) => void;
  updateFilter: (id: string, filter: Partial<ReportFilter>) => void;
  removeFilter: (id: string) => void;

  addDataset: (dataset: ReportDataset) => void;
  updateDataset: (id: string, dataset: Partial<ReportDataset>) => void;
  removeDataset: (id: string) => void;
  
  addTableToLayout: (table: LayoutTable) => void;
  updateTableInLayout: (id: string, table: Partial<LayoutTable>) => void;
  removeTableFromLayout: (id: string) => void;
}

export const defaultLayoutConfig: LayoutConfig = {
  header: { position: 'center', rows: [] },
  body: { layoutType: 'grid', tables: [] },
  footer: { signatureColumns: 3, signatures: [] }
};

export const useAdminReportStore = create<AdminReportState>((set) => ({
  activeReport: null,
  isLoading: false,

  setActiveReport: (report) => set({ activeReport: report }),
  
  updateGeneral: (data) => set((state) => ({
    activeReport: state.activeReport ? { ...state.activeReport, ...data } : null
  })),

  updateLayoutConfig: (config) => set((state) => ({
    activeReport: state.activeReport ? { ...state.activeReport, layoutConfig: config } : null
  })),

  addFilter: (filter) => set((state) => {
    if (!state.activeReport) return state;
    return {
      activeReport: {
        ...state.activeReport,
        filters: [...state.activeReport.filters, filter]
      }
    };
  }),

  updateFilter: (id, filterData) => set((state) => {
    if (!state.activeReport) return state;
    return {
      activeReport: {
        ...state.activeReport,
        filters: state.activeReport.filters.map(f => f.id === id ? { ...f, ...filterData } : f)
      }
    };
  }),

  removeFilter: (id) => set((state) => {
    if (!state.activeReport) return state;
    return {
      activeReport: {
        ...state.activeReport,
        filters: state.activeReport.filters.filter(f => f.id !== id)
      }
    };
  }),

  addDataset: (dataset) => set((state) => {
    if (!state.activeReport) return state;
    return {
      activeReport: {
        ...state.activeReport,
        datasets: [...state.activeReport.datasets, dataset]
      }
    };
  }),

  updateDataset: (id, datasetData) => set((state) => {
    if (!state.activeReport) return state;
    return {
      activeReport: {
        ...state.activeReport,
        datasets: state.activeReport.datasets.map(d => d.id === id ? { ...d, ...datasetData } : d)
      }
    };
  }),

  removeDataset: (id) => set((state) => {
    if (!state.activeReport) return state;
    return {
      activeReport: {
        ...state.activeReport,
        datasets: state.activeReport.datasets.filter(d => d.id !== id)
      }
    };
  }),

  addTableToLayout: (table) => set((state) => {
    if (!state.activeReport) return state;
    const currentConfig = state.activeReport.layoutConfig || defaultLayoutConfig;
    return {
      activeReport: {
        ...state.activeReport,
        layoutConfig: {
          ...currentConfig,
          body: {
            ...currentConfig.body,
            tables: [...currentConfig.body.tables, table]
          }
        }
      }
    };
  }),

  updateTableInLayout: (id, tableData) => set((state) => {
    if (!state.activeReport) return state;
    const currentConfig = state.activeReport.layoutConfig;
    if (!currentConfig) return state;
    
    return {
      activeReport: {
        ...state.activeReport,
        layoutConfig: {
          ...currentConfig,
          body: {
            ...currentConfig.body,
            tables: currentConfig.body.tables.map(t => t.id === id ? { ...t, ...tableData } : t)
          }
        }
      }
    };
  }),

  removeTableFromLayout: (id) => set((state) => {
    if (!state.activeReport) return state;
    const currentConfig = state.activeReport.layoutConfig;
    if (!currentConfig) return state;

    return {
      activeReport: {
        ...state.activeReport,
        layoutConfig: {
          ...currentConfig,
          body: {
            ...currentConfig.body,
            tables: currentConfig.body.tables.filter(t => t.id !== id)
          }
        }
      }
    };
  })
}));
