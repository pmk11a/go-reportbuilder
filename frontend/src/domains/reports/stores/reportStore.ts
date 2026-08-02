// Report Store - Zustand state management for reports

import { create } from 'zustand'
import type {
  IReport,
  IReportConfig,
  IReportFilterValues,
//   IQueryPreviewResult,
  IAvailableKodeMenu
} from '../types'

interface ReportState {
  // Admin state
  reports: IReport[]
  selectedReport: IReport | null
  selectedReportConfig: IReportConfig | null
  availableKodeMenu: IAvailableKodeMenu[]
  allUsers: { USERID: string; FullName: string }[]
  activeTab: 'general' | 'filters' | 'datasets' | 'columns' | 'grouping' | 'access'

  // User viewer state
  currentReport: IReportConfig | null
  filterValues: IReportFilterValues
  isExecuting: boolean
  executionError: string | null

  // Loading states
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Actions - Admin
  setReports: (reports: IReport[]) => void
  selectReport: (report: IReport | null) => void
  setReportConfig: (config: IReportConfig | null) => void
  setAvailableKodeMenu: (menu: IAvailableKodeMenu[]) => void
  setAllUsers: (users: { USERID: string; FullName: string }[]) => void
  setActiveTab: (tab: 'general' | 'filters' | 'datasets' | 'columns' | 'grouping' | 'access') => void

  // Actions - Admin CRUD
  addReport: (report: IReport) => void
  updateReportInList: (id: number, updates: Partial<IReport>) => void
  removeReport: (id: number) => void

  // Actions - User Viewer
  setCurrentReport: (config: IReportConfig | null) => void
  setFilterValue: (name: string, value: string | string[] | null) => void
  setFilterValues: (values: IReportFilterValues) => void
  resetFilters: () => void
  setIsExecuting: (executing: boolean) => void
  setExecutionError: (error: string | null) => void

  // Loading
  setIsLoading: (loading: boolean) => void
  setIsSaving: (saving: boolean) => void
  setError: (error: string | null) => void

  // Reset
  clearSelection: () => void
}

export const useReportStore = create<ReportState>((set) => ({
  // Initial state - Admin
  reports: [],
  selectedReport: null,
  selectedReportConfig: null,
  availableKodeMenu: [],
  allUsers: [],
  activeTab: 'general',

  // Initial state - User
  currentReport: null,
  filterValues: {},
  isExecuting: false,
  executionError: null,

  // Initial state - Loading
  isLoading: false,
  isSaving: false,
  error: null,

  // Actions - Admin
  setReports: (reports) => set({ reports }),

  selectReport: (report) => set({
    selectedReport: report,
    selectedReportConfig: null,
    activeTab: 'general'
  }),

  setReportConfig: (config) => set({ selectedReportConfig: config }),

  setAvailableKodeMenu: (menu) => set({ availableKodeMenu: menu }),

  setAllUsers: (users) => set({ allUsers: users }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  // Actions - Admin CRUD
  addReport: (report) => set((state) => ({
    reports: [...state.reports, report]
  })),

  updateReportInList: (id, updates) => set((state) => ({
    reports: state.reports.map((r) =>
      r.id_laporan === id ? { ...r, ...updates } : r
    ),
    selectedReport: state.selectedReport?.id_laporan === id
      ? { ...state.selectedReport, ...updates }
      : state.selectedReport
  })),

  removeReport: (id) => set((state) => ({
    reports: state.reports.filter((r) => r.id_laporan !== id),
    selectedReport: state.selectedReport?.id_laporan === id ? null : state.selectedReport,
    selectedReportConfig: state.selectedReport?.id_laporan === id ? null : state.selectedReportConfig
  })),

  // Actions - User Viewer
  setCurrentReport: (config) => set({
    currentReport: config,
    filterValues: {},
    executionError: null
  }),

  setFilterValue: (name, value) => set((state) => ({
    filterValues: { ...state.filterValues, [name]: value }
  })),

  setFilterValues: (values) => set({ filterValues: values }),

  resetFilters: () => set({ filterValues: {} }),

  setIsExecuting: (executing) => set({ isExecuting: executing }),

  setExecutionError: (error) => set({ executionError: error }),

  // Loading
  setIsLoading: (loading) => set({ isLoading: loading }),

  setIsSaving: (saving) => set({ isSaving: saving }),

  setError: (error) => set({ error }),

  // Reset
  clearSelection: () => set({
    selectedReport: null,
    selectedReportConfig: null,
    currentReport: null,
    filterValues: {},
    isExecuting: false,
    executionError: null,
    error: null
  })
}))

// Selector helpers
export const selectFilters = (state: ReportState) =>
  state.selectedReportConfig?.filters || []

export const selectDatasets = (state: ReportState) =>
  state.selectedReportConfig?.datasets || []

export const selectColumns = (state: ReportState) =>
  state.selectedReportConfig?.columns || {}

export const selectGroups = (state: ReportState) =>
  state.selectedReportConfig?.groups || []
