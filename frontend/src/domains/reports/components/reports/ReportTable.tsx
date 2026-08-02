// ReportTable - Grouped table renderer for dynamic reports

import type React from 'react'
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useFormatColumn } from '../../hooks/useReport'
import type {
  IReportColumn,
  IReportExecutionResult,
} from '../../types'

interface ReportTableProps {
  result: IReportExecutionResult
  isLoading?: boolean
}

interface GroupedRow {
  label: string
  items: Record<string, unknown>[]
  subtotal: Record<string, number>
  subgroups?: Record<string, GroupedRow>
}

export function ReportTable({ result, isLoading }: ReportTableProps) {
  const formatColumn = useFormatColumn()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const { datasets, groupedData, grandTotal, config } = result

  const primaryDataset = useMemo(() => {
    return config.datasets.find((d) => d.visible)?.nama_dataset || 'T1'
  }, [config.datasets])

  const columns = useMemo(() => {
    return config.columns[primaryDataset]?.filter((c) => c.is_visible) || []
  }, [config.columns, primaryDataset])

  const flatData = useMemo(() => {
    if (groupedData) return null
    return datasets[primaryDataset] || []
  }, [datasets, primaryDataset, groupedData])

  const groupedRows = useMemo(() => {
    if (!groupedData) return null
    return groupedData as Record<string, GroupedRow>
  }, [groupedData])

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (isLoading) {
    return <TableSkeleton columns={columns.length} rows={5} />
  }

  if (!flatData && !groupedRows) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No data available. Apply filters and click Generate.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            {groupedRows && <th className="w-8 p-2 border" />}
            {columns.map((col) => (
              <th
                key={col.nama_kolom}
                className={`p-2 border text-left font-medium ${
                  col.alignment === 'center'
                    ? 'text-center'
                    : col.alignment === 'right'
                    ? 'text-right'
                    : 'text-left'
                }`}
              >
                {col.label_tampil || col.nama_kolom}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flatData && renderFlatData(flatData, columns, formatColumn)}
          {groupedRows && renderGroupedData(groupedRows, columns, formatColumn, expanded, toggleExpand, 0)}
          {grandTotal && Object.keys(grandTotal).length > 0 && (
            <tr className="bg-muted font-semibold border-t-2">
              <td className="p-2 border">Grand Total</td>
              {columns.map((col) => (
                <td
                  key={col.nama_kolom}
                  className={`p-2 border ${
                    col.alignment === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {grandTotal[col.nama_kolom] != null
                    ? formatColumn(grandTotal[col.nama_kolom], col.format_type)
                    : ''}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function renderFlatData(
  data: Record<string, unknown>[],
  columns: IReportColumn[],
  formatColumn: ReturnType<typeof useFormatColumn>
) {
  if (!data.length) {
    return (
      <tr>
        <td colSpan={columns.length} className="p-8 text-center text-muted-foreground">
          No data found
        </td>
      </tr>
    )
  }

  return data.map((row, idx) => (
    <tr key={idx} className="hover:bg-muted/50">
      {columns.map((col) => (
        <td
          key={col.nama_kolom}
          className={`p-2 border ${
            col.alignment === 'center'
              ? 'text-center'
              : col.alignment === 'right'
              ? 'text-right'
              : 'text-left'
          }`}
        >
          {formatColumn(row[col.nama_kolom], col.format_type)}
        </td>
      ))}
    </tr>
  ))
}

function renderGroupedData(
  grouped: Record<string, GroupedRow>,
  columns: IReportColumn[],
  formatColumn: ReturnType<typeof useFormatColumn>,
  expanded: Record<string, boolean>,
  toggleExpand: (key: string) => void,
  level: number
): React.ReactNode {
  const rows: React.ReactNode[] = []

  for (const [key, group] of Object.entries(grouped)) {
    const isExpanded = expanded[key] ?? true
    const indent = level * 16

    rows.push(
      <tr
        key={`group-${key}`}
        className="bg-muted/70 font-medium cursor-pointer hover:bg-muted"
        onClick={() => toggleExpand(key)}
      >
        <td className="p-2 border" style={{ paddingLeft: `${indent + 8}px` }}>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 inline" />
          ) : (
            <ChevronRight className="h-4 w-4 inline" />
          )}
        </td>
        <td colSpan={columns.length - 1} className="p-2 border">
          {group.label}
        </td>
        {columns
          .filter((c) => c.is_summable)
          .map((col) => (
            <td
              key={`subtotal-${key}-${col.nama_kolom}`}
              className={`p-2 border ${
                col.alignment === 'right' ? 'text-right' : 'text-left'
              }`}
            >
              {group.subtotal[col.nama_kolom] != null
                ? formatColumn(group.subtotal[col.nama_kolom], col.format_type)
                : ''}
            </td>
          ))}
      </tr>
    )

    if (isExpanded) {
      for (let i = 0; i < group.items.length; i++) {
        const item = group.items[i]
        rows.push(
          <tr key={`row-${key}-${i}`} className="hover:bg-muted/50">
            <td className="p-2 border" style={{ paddingLeft: `${indent + 24}px` }} />
            {columns.map((col) => (
              <td
                key={`${key}-${i}-${col.nama_kolom}`}
                className={`p-2 border ${
                  col.alignment === 'center'
                    ? 'text-center'
                    : col.alignment === 'right'
                    ? 'text-right'
                    : 'text-left'
                }`}
              >
                {formatColumn(item[col.nama_kolom], col.format_type)}
              </td>
            ))}
          </tr>
        )
      }

      if (group.subgroups) {
        rows.push(
          ...renderGroupedData(
            group.subgroups,
            columns,
            formatColumn,
            expanded,
            toggleExpand,
            level + 1
          ) as React.ReactNode[]
        )
      }
    }
  }

  return rows
}

function TableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <div className="animate-pulse">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="w-8 p-2 border" />
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-2 border">
                <div className="h-4 bg-muted-foreground/20 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td className="p-2 border" />
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="p-2 border">
                  <div className="h-4 bg-muted-foreground/10 rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
