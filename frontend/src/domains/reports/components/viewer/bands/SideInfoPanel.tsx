interface SideInfoPanelProps {
  config: {
    enabled?: boolean
    rows?: Array<{
      label: string
      field?: string
      value?: any
    }>
  }
  summaryData: Record<string, any>
  formatCurrency: (val: number) => string
}

export function SideInfoPanel({ config, summaryData, formatCurrency }: SideInfoPanelProps) {
  if (!config?.enabled || !config?.rows?.length) return null

  return (
    <div className="w-full h-full">
      <table className="w-full text-sm">
        <tbody>
          {config.rows.map((row) => {
            const val = row.field ? (summaryData[row.field] || 0) : (row.value || 0)
            return (
              <tr key={row.label}>
                <td className="py-0.5 pr-4 text-slate-600 dark:text-slate-400 w-1/2">{row.label}</td>
                <td className="py-0.5 text-slate-900 dark:text-slate-200 font-medium text-right">
                  {formatCurrency(parseFloat(val))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
