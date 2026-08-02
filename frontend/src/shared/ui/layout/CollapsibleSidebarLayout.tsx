import React, { useState, useRef, useCallback } from 'react'
import { Menu, Search, Loader2 } from 'lucide-react'
import { Input } from '@/shared/ui/form/input'
import { useThemeStore } from '@/shared/stores/themeStore'
import { Skeleton } from '@/shared/ui/feedback/skeleton'
import { Show } from './Render'

interface CollapsibleSidebarLayoutProps<T = any> {
  sidebarTitle: string
  sidebarHeaderActions?: React.ReactNode
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (val: string) => void
  
  // Custom Content (e.g., Tree) - if provided, items/infinite scroll is ignored
  sidebarCustomContent?: React.ReactNode
  
  // Infinite Scroll / List mode props
  items?: T[]
  renderItem?: (item: T, index: number, isLast: boolean) => React.ReactNode
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  emptyMessage?: string
  
  mainContent: React.ReactNode
}

export function CollapsibleSidebarLayout<T = any>({
  sidebarTitle,
  sidebarHeaderActions,
  searchPlaceholder = 'Cari...',
  searchValue,
  onSearchChange,
  
  sidebarCustomContent,
  
  items,
  renderItem,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  emptyMessage = 'Tidak ada data',
  
  mainContent,
}: CollapsibleSidebarLayoutProps<T>) {
  const theme = useThemeStore((s: any) => s.theme)
  const isDarkState = useThemeStore((s: any) => s.isDark)
  const isDark = isDarkState || theme === 'dark'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Intersection Observer for infinite scrolling
  const observer = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingNextPage) return
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && fetchNextPage) {
        fetchNextPage()
      }
    })
    
    if (node) observer.current.observe(node)
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage])

  const renderList = () => {
    if (sidebarCustomContent) {
      return <div className="flex flex-col gap-2 overflow-y-auto pr-2 no-scrollbar flex-1">{sidebarCustomContent}</div>
    }

    return (
      <div className="flex flex-col gap-2 overflow-y-auto pr-2 no-scrollbar flex-1">
        <Show
          when={!isLoading}
          fallback={
            <div className="flex flex-col gap-2 px-2 py-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <Skeleton className="h-6 w-6 rounded-md shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <Show
            when={(items || []).length > 0}
            fallback={
              <div className="p-4 text-center text-slate-400 text-sm">
                {emptyMessage}
              </div>
            }
          >
            {items?.map((item, index) => {
              const isLast = index === items.length - 1
              return (
                <div ref={isLast ? lastElementRef : null} key={`item-${index}`}>
                  {renderItem && renderItem(item, index, isLast)}
                </div>
              )
            })}
            {isFetchingNextPage && (
              <div className="py-4 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}
          </Show>
        </Show>
      </div>
    )
  }

  return (
    <div className="flex gap-6 flex-1 min-h-0 relative h-full">
      {/* Sidebar */}
      <div 
        className={`transition-all duration-300 shrink-0 flex flex-col h-full overflow-hidden ${
          isSidebarOpen ? 'w-full md:w-[320px] opacity-100' : 'w-0 opacity-0 md:!p-0 md:!border-0'
        } rounded-3xl border shadow-xl ${
          isDark 
            ? 'bg-[#0f172a] border-white/5 shadow-2xl' 
            : 'bg-white border-slate-100 shadow-blue-500/5'
        }`}
      >
        <div className="p-4 flex flex-col h-full min-w-[280px]">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className={`font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
              {sidebarTitle}
            </h3>
            <div className="flex items-center gap-2">
              {sidebarHeaderActions}
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                title="Sembunyikan Sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          {onSearchChange && (
            <div className="relative mb-4 px-2 shrink-0">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                className={`pl-9 h-9 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} 
                placeholder={searchPlaceholder} 
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}

          {/* List Content */}
          {renderList()}
        </div>
      </div>

      {/* Expand Button (Moved outside overflow container to prevent clipping) */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute -left-4 top-2.5 z-50 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg text-slate-500 hover:text-primary-500 transition-all hover:scale-105 flex items-center justify-center"
          title="Tampilkan Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 relative w-full overflow-y-auto no-scrollbar">
        {mainContent}
      </div>
    </div>
  )
}
