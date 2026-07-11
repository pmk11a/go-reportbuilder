import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2, ChevronRight, Database, FileText } from 'lucide-react'
import { Input } from '@/shared/ui/form/input'
import { Badge } from '@/shared/ui/overlay/badge'
import { Each, Show } from '@/shared/ui/layout/Render'
import { Skeleton } from '@/shared/ui/feedback/skeleton'
import { browseService } from '@/domains/browse/services/browseService'
import { browseKeys } from '@/domains/browse/hooks/useBrowse'
import { useBrowseSearch } from '@/domains/browse/hooks/useBrowseSearch'
import { useThemeStore } from '@/shared/stores/themeStore'
import type { IBrowseType, IBrowseRow } from '@/domains/browse/types/browse'

export const Route = createFileRoute('/admin/_layout/master-data/dynamic-browse/')({
  component: DynamicBrowsePage,
})

function DynamicBrowsePage() {
  const isDark = useThemeStore((state) => state.isDark)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: types, isLoading: typesLoading } = useQuery({
    queryKey: browseKeys.types(),
    queryFn: () => browseService.listTypes(),
    staleTime: 60 * 60 * 1000,
  })

  const {
    options: searchResults,
    isLoading: searchLoading,
    onSearchChange,
  } = useBrowseSearch({
    kodeBrowse: selectedType ?? '',
    minChars: 1,
    limit: 100,
  })

  const handleTypeSelect = useCallback((kode: string) => {
    setSelectedType(kode)
    setSearchTerm('')
    onSearchChange('')
  }, [onSearchChange])

  const selectedTypeInfo = types?.find((t) => t.kodeBrowse === selectedType)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar: Browse types list */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden p-4">
          <h3 className={`font-bold mb-4 px-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            Browse Types
          </h3>
          <div className="relative mb-4 px-2">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search browse types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
            <Show
              when={!typesLoading}
              fallback={
                <div className="px-2 py-3 flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              }
            >
              <Each of={types || []}>
                {(t: IBrowseType) => (
                  <button
                    key={t.kodeBrowse}
                    onClick={() => handleTypeSelect(t.kodeBrowse)}
                    className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      selectedType === t.kodeBrowse
                        ? isDark
                          ? 'bg-primary-600 text-white'
                          : 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                        : isDark
                          ? 'text-slate-400 hover:bg-slate-700/50'
                          : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Database className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t.group}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {t.kodeBrowse}
                    </Badge>
                  </button>
                )}
              </Each>
            </Show>
          </div>
        </div>

        {/* Main area: search + results */}
        <div className="md:col-span-3">
          <Show
            when={!!selectedType && !typesLoading}
            fallback={
              typesLoading ? (
                <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl p-6">
                  <Skeleton className="h-8 w-48 mb-6" />
                  <Skeleton className="h-10 w-full rounded-lg mb-4" />
                  <Skeleton className="h-64 w-full rounded-xl" />
                </div>
              ) : (
                <div
                  className={`h-full min-h-[400px] flex items-center justify-center rounded-3xl border border-slate-100 dark:border-white/5 ${isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}
                >
                  <p className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                    Select a browse type from the sidebar to start browsing
                  </p>
                </div>
              )
            }
          >
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 dark:shadow-2xl overflow-hidden p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div>
                  <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <FileText
                      size={20}
                      className={isDark ? 'text-primary-400' : 'text-primary-600'}
                    />
                    {selectedTypeInfo?.group}
                  </h2>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Source: {selectedTypeInfo?.source} &middot; Key:{' '}
                    {selectedTypeInfo?.keyField} &middot; Label:{' '}
                    {selectedTypeInfo?.labelField}
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${selectedTypeInfo?.group}...`}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      onSearchChange(e.target.value)
                    }}
                    className="pl-9 h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Results */}
              <Show
                when={!searchLoading}
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                }
              >
                <Show
                  when={searchResults.length > 0}
                  fallback={
                    <div className="py-12 text-center text-muted-foreground text-sm">
                      {searchTerm ? 'No matching records' : `Select a search term to browse ${selectedTypeInfo?.group}`}
                    </div>
                  }
                >
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      <Each of={searchResults}>
                        {(row: IBrowseRow, i: number) => (
                          <BrowseRowItem
                            key={i}
                            row={row}
                            keyField={selectedTypeInfo!.keyField}
                            labelField={selectedTypeInfo!.labelField}
                            isDark={isDark}
                          />
                        )}
                      </Each>
                    </div>
                  </div>
                </Show>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}

/** Render a single browse row with key and label fields */
function BrowseRowItem({
  row,
  keyField,
  labelField,
  isDark,
}: {
  row: IBrowseRow
  keyField: string
  labelField: string
  isDark: boolean
}) {
  const keyValue = row[keyField] ?? ''
  const labelValue = row[labelField] ?? ''

  // Collect all other fields for display
  const otherFields = Object.entries(row).filter(
    ([k]) => k !== keyField && k !== labelField
  )

  return (
    <div className={`flex items-center gap-4 px-4 py-3 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
      <Badge variant="secondary" className="shrink-0 font-mono text-xs">
        {String(keyValue)}
      </Badge>
      <span className="font-medium truncate">{String(labelValue)}</span>
      {otherFields.length > 0 && (
        <div className="hidden md:flex items-center gap-4 ml-auto text-xs text-muted-foreground">
          {otherFields.slice(0, 3).map(([k, v]) => (
            <span key={k} className="shrink-0">
              <span className="mr-1 opacity-60">{k}:</span>
              {String(v ?? '-')}
            </span>
          ))}
          {otherFields.length > 3 && (
            <span className="shrink-0">
              <ChevronRight className="h-3 w-3 inline" />
              +{otherFields.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
