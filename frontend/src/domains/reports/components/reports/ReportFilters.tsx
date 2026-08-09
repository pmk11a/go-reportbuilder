// ReportFilters - Dynamic filter form for reports

import type React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { Search } from 'lucide-react'
import type { IReportFilter, IReportFilterValues } from '../../types'

interface ReportFiltersProps {
  filters: IReportFilter[]
  values: IReportFilterValues
  onChange: (name: string, value: string | string[] | null) => void
  onReset: () => void
  onSubmit: () => void
  isSubmitting?: boolean
}

export function ReportFilters({
  filters,
  values,
  onChange,
  onReset,
  onSubmit,
  isSubmitting,
}: ReportFiltersProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}
    for (const filter of filters) {
      if (filter.wajib_isi) {
        const value = values[filter.nama_filter]
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[filter.nama_filter] = `${filter.label} wajib diisi`
        }
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [filters, values])

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit()
    }
  }

  const handleReset = () => {
    setErrors({})
    onReset()
  }

  if (!filters.length) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        No filters configured for this report.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filters
          .sort((a, b) => a.posisi - b.posisi)
          .map((filter) => (
            <FilterField
              key={filter.nama_filter}
              filter={filter}
              value={values[filter.nama_filter]}
              onChange={(value) => onChange(filter.nama_filter, value)}
              error={errors[filter.nama_filter]}
            />
          ))}
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Generate
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border rounded-md hover:bg-muted"
        >
          Reset
        </button>
      </div>
    </form>
  )
}

interface FilterFieldProps {
  filter: IReportFilter
  value: string | string[] | null | undefined
  onChange: (value: string | string[] | null) => void
  error?: string
}

function FilterField({ filter, value, onChange, error }: FilterFieldProps) {
  const id = `filter-${filter.nama_filter}`

  switch (filter.tipe_input) {
    case 'date':
      return (
        <div className="space-y-1">
          <label htmlFor={id} className="block text-sm font-medium">
            {filter.label}
            {filter.wajib_isi && <span className="text-destructive ml-1">*</span>}
          </label>
          <input
            type="date"
            id={id}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full px-3 py-2 border rounded-md bg-background"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )

    case 'number':
      return (
        <div className="space-y-1">
          <label htmlFor={id} className="block text-sm font-medium">
            {filter.label}
            {filter.wajib_isi && <span className="text-destructive ml-1">*</span>}
          </label>
          <input
            type="number"
            id={id}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full px-3 py-2 border rounded-md bg-background"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )

    case 'checkbox':
      return (
        <div className="space-y-1 pt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value === '1' || String(value) === 'true'}
              onChange={(e) => onChange(e.target.checked ? '1' : null)}
              className="h-4 w-4"
            />
            <span className="text-sm">{filter.label}</span>
          </label>
        </div>
      )

    case 'combobox':
    case 'dropdown':
      return (
        <div className="space-y-1">
          <label htmlFor={id} className="block text-sm font-medium">
            {filter.label}
            {filter.wajib_isi && <span className="text-destructive ml-1">*</span>}
          </label>
          <select
            id={id}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full px-3 py-2 border rounded-md bg-background"
          >
            <option value="">-- Pilih --</option>
          </select>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )

    case 'browse':
      return (
        <BrowseInput
          id={id}
          value={(value as string) || ''}
          onChange={onChange}
          label={filter.label}
          wajib={filter.wajib_isi}
          error={error}
        />
      )



    case 'text':
    default:
      return (
        <div className="space-y-1">
          <label htmlFor={id} className="block text-sm font-medium">
            {filter.label}
            {filter.wajib_isi && <span className="text-destructive ml-1">*</span>}
          </label>
          <input
            type="text"
            id={id}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full px-3 py-2 border rounded-md bg-background"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )
  }
}

interface BrowseInputProps {
  id: string
  value: string
  onChange: (value: string | null) => void
  label: string
  wajib: boolean
  error?: string
}

function BrowseInput({ id, value, onChange, label, wajib, error }: BrowseInputProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Array<{ key: string; label: string }>>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      // TODO: Call browse search API
      void q
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search, handleSearch])

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {wajib && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value || null)}
            className="flex-1 px-3 py-2 border rounded-md bg-background"
            placeholder="Kode atau cari..."
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-2 border rounded-md hover:bg-muted"
            title="Browse"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik untuk mencari..."
              className="w-full px-3 py-2 border-b"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto">
              {isLoading && (
                <div className="p-2 text-sm text-muted-foreground">Memuat...</div>
              )}
              {!isLoading && results.length === 0 && search.length >= 2 && (
                <div className="p-2 text-sm text-muted-foreground">
                  Tidak ada hasil
                </div>
              )}
              {results.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onChange(item.key)
                    setSearch('')
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    {item.key}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

