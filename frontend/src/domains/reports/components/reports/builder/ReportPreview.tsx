import type { ILayoutConfig, ILayoutHeader, ILayoutBody, ILayoutFooter, ILayoutColumn } from '@/domains/reports/types';
import { Each, Show } from '@/shared/ui';

interface ReportPreviewProps {
  config: ILayoutConfig[];
  zoom: number;
}

export function ReportPreview({ config, zoom }: ReportPreviewProps) {
  const header = config.find(c => c.type === 'header') as ILayoutHeader;
  const body = config.find(c => c.type === 'body') as ILayoutBody;
  const footer = config.find(c => c.type === 'footer') as ILayoutFooter;

  const renderText = (col: ILayoutColumn) => {
    if (col.sourceType === 'system') return col.text?.replace('{current_date}', new Date().toLocaleDateString('id-ID'));
    if (col.sourceType === 'database') return <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">{col.text}</span>;
    return col.text;
  };

  return (
    <div className="relative w-full flex justify-center">
      <div 
        className="bg-white shadow-xl w-[210mm] min-h-[297mm] p-6 sm:p-10 flex flex-col gap-8 text-gray-800 origin-top transition-transform duration-200"
        style={{ 
          transform: `scale(${zoom})`, 
          marginBottom: `-${297 * (1 - zoom)}mm`,
          marginRight: `-${210 * (1 - zoom) / 2}mm`, // To prevent horizontal layout shift if needed, though w-full centering handles it.
          marginLeft: `-${210 * (1 - zoom) / 2}mm`
        }}
      >
      {/* Header Preview */}
      <Show when={!!(header && header.rows && header.rows.length > 0)}>
        <div className="w-full">
          <table className="w-full text-sm border-b-2 border-black pb-4">
            <tbody>
              <Each of={header?.rows || []}>
                {(row, rIdx) => (
                  <tr key={rIdx}>
                    <Each of={row.columns || []}>
                      {(col, cIdx) => (
                        <td 
                          key={cIdx} 
                          colSpan={col.colSpan || 1} 
                          className="py-1"
                          style={{ textAlign: col.align || 'left', width: col.width }}
                        >
                          {renderText(col)}
                        </td>
                      )}
                    </Each>
                  </tr>
                )}
              </Each>
            </tbody>
          </table>
        </div>
      </Show>

      {/* Body Preview (Row-based Layout) */}
      <Show when={!!(body && body.rows && body.rows.length > 0)}>
        <div className="flex-1 flex flex-col gap-6">
          <Each of={body?.rows || []}>
            {(row, rIdx) => (
              <div key={rIdx} className="flex flex-row flex-wrap items-start w-full gap-4">
                <Each of={row.columns || []}>
                  {(col, cIdx) => (
                    <div key={cIdx} style={{ flexBasis: col.width || '100%', flexGrow: 1, minWidth: 0 }}>
                      <div className="w-full overflow-hidden">
                        <table className="w-full border-collapse border border-gray-300 text-xs text-gray-700 bg-white">
                          <thead className="bg-gray-100">
                            <Each of={col.table.headerRows || []}>
                              {(hRow, hRIdx) => (
                                <tr key={hRIdx}>
                                  <Each of={hRow || []}>
                                    {(hCol, hCIdx) => (
                                      <th 
                                        key={hCIdx} 
                                        className="border border-gray-300 p-2 font-semibold"
                                        style={{ textAlign: hCol.align || 'center', width: hCol.width }}
                                        colSpan={hCol.colSpan || 1}
                                        rowSpan={hCol.rowSpan || 1}
                                      >
                                        {hCol.text}
                                      </th>
                                    )}
                                  </Each>
                                </tr>
                              )}
                            </Each>
                          </thead>
                          <tbody>
                            {/* Shimmer/Skeleton rows simulating data */}
                            <Each of={[1, 2, 3, 4, 5]}>
                              {(_, rowIdx) => (
                                <tr key={rowIdx}>
                                  <Each of={col.table.dataColumns || []} fallback={
                                    <td className="border border-gray-300 p-2">
                                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
                                    </td>
                                  }>
                                    {(dCol, dCIdx) => (
                                      <td 
                                        key={dCIdx} 
                                        className="border border-gray-300 p-2"
                                        style={{ textAlign: dCol.align || 'left' }}
                                      >
                                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" 
                                             style={{ marginLeft: dCol.align === 'left' ? '0' : dCol.align === 'right' ? 'auto' : 'auto', marginRight: dCol.align === 'right' ? '0' : 'auto' }} />
                                      </td>
                                    )}
                                  </Each>
                                </tr>
                              )}
                            </Each>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Each>
              </div>
            )}
          </Each>
        </div>
      </Show>

      {/* Footer Preview */}
      <Show when={!!(footer && footer.rows && footer.rows.length > 0)}>
        <div className="w-full mt-auto flex flex-col gap-8 pt-8">
          <Each of={footer?.rows || []}>
            {(row, rIdx) => (
              <div 
                key={rIdx} 
                className="flex w-full"
                style={{ justifyContent: row.justifyContent || 'space-between' }}
              >
                <Each of={row.columns || []}>
                  {(col, cIdx) => (
                    <div key={cIdx} className="flex flex-col items-center w-40 text-sm">
                      <span className="mb-12">{col.title}</span>
                      <span className="font-bold text-gray-800 underline underline-offset-4">{col.name}</span>
                      <Show when={!!col.role}>
                        <span className="text-xs text-gray-500 mt-1">{col.role}</span>
                      </Show>
                    </div>
                  )}
                </Each>
              </div>
            )}
          </Each>
        </div>
      </Show>
      </div>
    </div>
  );
}
