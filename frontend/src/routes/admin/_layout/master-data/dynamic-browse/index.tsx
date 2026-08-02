import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { Search, Loader2, ChevronRight, Database, FileText } from 'lucide-react'
import { Input } from '@/shared/ui/form/input'
import { Badge } from '@/shared/ui/overlay/badge'
import { Each, Show, CollapsibleSidebarLayout } from '@/shared/ui/layout'
import { Skeleton } from '@/shared/ui/feedback/skeleton'
import { browseService } from '@/domains/browse/services/browseService'
import { useBrowseTypesInfinite } from '@/domains/browse/hooks/useBrowse'
import { useBrowseSearch } from '@/domains/browse/hooks/useBrowseSearch'
import { useDebounce } from '@/shared/hooks'
import { useThemeStore } from '@/shared/stores/themeStore'
import type { IBrowseType, IBrowseRow } from '@/domains/browse/types/browse'
import { BrowseConfigModal } from './-components/browse-config-modal'
import { Button } from '@/shared/ui/overlay/button'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useToast } from '@/shared/hooks/use-toast'

export const Route = createFileRoute('/admin/_layout/master-data/dynamic-browse/')({
  component: DynamicBrowsePage,
})

function DynamicBrowsePage() {
  const isDark = useThemeStore((state) => state.isDark)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [previewSearchTerm, setPreviewSearchTerm] = useState('')
  
  // CRUD state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedConfigData, setSelectedConfigData] = useState<any>()
  const { toast } = useToast()

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { 
    data: infiniteData, 
    isLoading: typesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useBrowseTypesInfinite(debouncedSearchTerm, 20)

  // Flatten the pages into a single array
  const types = infiniteData?.pages.flatMap(page => page.items) || []

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
    // Don't reset sidebar searchTerm, so they don't lose their search!
    setPreviewSearchTerm('')
    onSearchChange('')
  }, [onSearchChange])

  const selectedTypeInfo = types?.find((t) => t.kodeBrowse === selectedType)
  const canEdit = selectedTypeInfo?.source === 'database'

  const handleCreate = () => {
    setModalMode('create')
    setSelectedConfigData(undefined)
    setIsModalOpen(true)
  }

  const handleEditConfig = async () => {
    if (!selectedTypeInfo || selectedTypeInfo.source !== 'database') return
    
    try {
      // Fetch full config detail if necessary. Since types list might only have basic metadata.
      // But actually we can just pass selectedTypeInfo if it has everything, or fetch from API.
      // Wait, listBrowseConfigsFn isn't called here, we use useBrowseTypesInfinite which returns BrowseType.
      // BrowseType doesn't have `additionalfields`, `joins`, etc.
      // Let's just fetch it dynamically or redirect to a page. For now, since it's a modal, we can fetch it when edit is clicked.
      // Actually, we can fetch `/api/browse/configs` with a search for `kodebrowse = selectedTypeInfo.kodeBrowse`
      const res = await browseService.listConfigs({ search: selectedTypeInfo.kodeBrowse })
      const fullConfig = res.data?.find((item: any) => item.kodebrowse === selectedTypeInfo.kodeBrowse)
      if (!fullConfig) throw new Error('Detail konfigurasi tidak ditemukan')
      
      setModalMode('edit')
      setSelectedConfigData(fullConfig)
      setIsModalOpen(true)
    } catch (error: any) {
      toast({ title: 'Gagal', description: error.message || 'Gagal memuat konfigurasi', variant: 'destructive' })
    }
  }

  const handleDeleteConfig = async () => {
    if (!selectedTypeInfo || !confirm('Apakah Anda yakin ingin menghapus konfigurasi ini?')) return
    
    try {
      // We need the database ID to delete.
      const res = await browseService.listConfigs({ search: selectedTypeInfo.kodeBrowse })
      const fullConfig = res.items?.find((item: any) => item.kodebrowse === selectedTypeInfo.kodeBrowse)
      if (!fullConfig?.id) throw new Error('ID Konfigurasi tidak ditemukan')
      
      // Use config delete
      // We need to import useBrowseConfigDelete but for now we can just call browseService directly
      await browseService.deleteConfig(fullConfig.id)
      
      toast({ title: 'Berhasil', description: 'Konfigurasi berhasil dihapus' })
      setSelectedType(null)
      // Invalidate types query
      // queryClient.invalidateQueries({ queryKey: browseKeys.all })
    } catch (error: any) {
      toast({ title: 'Gagal', description: error.message || 'Gagal menghapus konfigurasi', variant: 'destructive' })
    }
  }

  const mainContent = (
    <>
      <div className="w-full">
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
                className={`h-full min-h-[400px] flex flex-col items-center justify-center rounded-3xl border border-slate-100 dark:border-white/5 space-y-4 ${isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}
              >
                <Database className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-2" />
                <p className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                  Pilih tipe browse dari sidebar untuk melihat data
                </p>
                <Button onClick={handleCreate} className="flex items-center gap-2 mt-4" variant="outline">
                  <Plus size={16} />
                  Buat Konfigurasi Baru
                </Button>
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
                  <div className="flex gap-2">
                    <Button onClick={handleCreate} className="flex items-center gap-2" variant="outline">
                      <Plus size={16} />
                      Baru
                    </Button>
                    {canEdit && (
                      <>
                        <Button onClick={handleEditConfig} variant="outline" className="flex items-center gap-2 text-blue-500">
                          <Edit2 size={16} />
                          Edit
                        </Button>
                        <Button onClick={handleDeleteConfig} variant="outline" className="flex items-center gap-2 text-red-500">
                          <Trash2 size={16} />
                          Hapus
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${selectedTypeInfo?.group}...`}
                      value={previewSearchTerm}
                      onChange={(e) => {
                        setPreviewSearchTerm(e.target.value)
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
                        {previewSearchTerm ? 'No matching records' : `Select a search term to browse ${selectedTypeInfo?.group}`}
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
          
        <BrowseConfigModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          initialData={selectedConfigData}
          onSuccess={() => {
            // Optional: refetch list or types
          }}
        />
    </>
  )

  return (
    <div className="space-y-4 h-[calc(100vh-120px)]">
      <CollapsibleSidebarLayout
        sidebarTitle="Browse Types"
        searchPlaceholder="Search browse types..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        items={types}
        isLoading={typesLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        emptyMessage="Tidak ada tipe browse"
        renderItem={(t: IBrowseType) => (
          <button
            key={t.kodeBrowse}
            onClick={() => handleTypeSelect(t.kodeBrowse)}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 mb-1 ${
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
            <span className="truncate flex-1">{t.group}</span>
            <Badge variant="outline" className="shrink-0 text-xs">
              {t.kodeBrowse}
            </Badge>
          </button>
        )}
        mainContent={mainContent}
      />
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
