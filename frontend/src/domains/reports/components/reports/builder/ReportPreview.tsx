import type { ILayoutConfig, ILayoutHeader, ILayoutBody, ILayoutFooter, ILayoutColumn } from '@/domains/reports/types';
import { Each, Show } from '@/shared/ui';
import { formatCell } from '@/domains/reports/utils/exportHelpers';

interface ReportPreviewProps {
  config: ILayoutConfig[];
  zoom: number;
  orientation?: 'portrait' | 'landscape';
  datasets?: Record<string, any[]>;
  mode?: 'preview' | 'print';
}

export function ReportPreview({ config, zoom, orientation = 'portrait', datasets, mode = 'preview' }: ReportPreviewProps) {
  const header = config.find(c => c.type === 'header') as ILayoutHeader;
  const body = config.find(c => c.type === 'body') as ILayoutBody;
  const footer = config.find(c => c.type === 'footer') as ILayoutFooter;

  const renderText = (col: ILayoutColumn) => {
    if (col.sourceType === 'system') {
      let txt = col.text || '';
      txt = txt.replace('{current_date}', new Date().toLocaleDateString('id-ID'));
      txt = txt.replace('{current_time}', new Date().toLocaleTimeString('id-ID'));
      txt = txt.replace('{user_name}', 'Superadmin');
      return txt;
    }
    if (col.sourceType === 'database') return <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded py-0.5 text-xs">[{col.dataset || '?'}.{col.field || '?'}]</span>;
    if (col.sourceType === 'filter') return <span className="text-emerald-600 font-mono bg-emerald-50 px-1 rounded py-0.5 text-xs">[Filter: {col.filter || '?'}]</span>;
    return col.text;
  };

  const renderSignatureText = (text?: string) => {
    if (!text) return null;
    if (text.startsWith('{') && text.endsWith('}')) {
      return <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded text-xs">{text}</span>;
    }
    return text;
  };

  const width = orientation === 'portrait' ? 210 : 297;
  const height = orientation === 'portrait' ? 297 : 210;

  const styleOverrides = mode === 'print' ? {
    width: `${width}mm`,
    minHeight: `${height}mm`,
    transform: `scale(${zoom})`, 
    marginBottom: `-${height * (1 - zoom)}mm`,
    marginRight: `-${width * (1 - zoom) / 2}mm`,
    marginLeft: `-${width * (1 - zoom) / 2}mm`
  } : {
    width: '100%',
    minHeight: 'auto',
    transform: `scale(${zoom})`,
    transformOrigin: 'top center',
  };

  return (
    <div className={`relative w-full flex justify-center ${mode === 'print' ? '' : 'flex-1'}`}>
      <div 
        className={`bg-white shadow-xl flex flex-col gap-8 text-gray-800 origin-top transition-all duration-300 ${mode === 'print' ? 'p-6 sm:p-10' : 'p-4 sm:p-8'}`}
        style={styleOverrides}
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
        <div className="flex-1 flex flex-col">
          <Each of={body?.rows || []}>
            {(row, rIdx) => (
              <div key={rIdx} className="flex flex-row flex-wrap items-start w-full -mx-2">
                <Each of={row.columns || []}>
                  {(col, cIdx) => {
                    let mx = '';
                    if (col.align === 'center') mx = 'mx-auto';
                    else if (col.align === 'right') mx = 'ml-auto';
                    else if (col.align === 'left') mx = 'mr-auto';
                    
                    return (
                    <div 
                      key={cIdx} 
                      className={`px-2 ${mx} ${col.colSpan ? `col-span-${col.colSpan}` : ''}`} 
                      style={{ 
                        width: col.width || '100%',
                        marginTop: col.marginTop || '0px'
                      }}
                    >
                      <div className="w-full overflow-hidden">
                        <table 
                          className="w-full border-collapse border border-gray-300 text-xs text-gray-700 bg-white"
                          style={{ tableLayout: col.table.tableLayout || 'auto' }}
                        >
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
                            {(() => {
                              const dsName = col.table.dataset || 'default';
                              const realData = datasets ? (datasets[dsName] || []) : null;

                              if (realData && realData.length > 0) {
                                return (
                                  <>
                                    <Each of={realData}>
                                      {(row, rowIdx) => (
                                        <tr key={rowIdx}>
                                          <Each of={col.table.dataColumns || []}>
                                            {(dCol, dCIdx) => {
                                              let cellValue = row[dCol.field];
                                              if (dCol.type === 'row_number') {
                                                cellValue = rowIdx + 1;
                                              } else {
                                                cellValue = formatCell(cellValue, dCol.format as any);
                                              }
                                              return (
                                                <td 
                                                  key={dCIdx} 
                                                  className="border border-gray-300 p-2"
                                                  style={{ textAlign: dCol.align || 'left', width: dCol.width }}
                                                >
                                                  {cellValue}
                                                </td>
                                              )
                                            }}
                                          </Each>
                                        </tr>
                                      )}
                                    </Each>
                                    {col.table.grouping?.showSubtotal && (() => {
                                      const firstSumColIdx = (col.table.dataColumns || []).findIndex(dCol => col.table.grouping?.subtotalColumns?.includes(dCol.field));
                                      const labelColspan = firstSumColIdx > 0 ? firstSumColIdx : 1;
                                      return (
                                        <>
                                          <tr className="bg-slate-100 font-bold text-slate-800">
                                            <Each of={col.table.dataColumns || []}>
                                              {(dCol, dCIdx) => {
                                                if (dCIdx > 0 && dCIdx < firstSumColIdx) return null;
                                                const isSummed = col.table.grouping?.subtotalColumns?.includes(dCol.field);
                                                const isLabelCell = dCIdx === 0;
                                                return (
                                                  <td 
                                                    key={`sub-${dCIdx}`} 
                                                    className="border border-gray-300 p-2 bg-gray-100 text-xs"
                                                    colSpan={isLabelCell ? labelColspan : 1}
                                                    style={{ textAlign: isSummed ? 'right' : (isLabelCell && labelColspan > 1 ? 'right' : dCol.align || 'left') }}
                                                  >
                                                    {isSummed ? "999,999" : (isLabelCell ? (col.table.grouping?.subtotalLabel || 'Sub Total') : "")}
                                                  </td>
                                                );
                                              }}
                                            </Each>
                                          </tr>
                                          <tr className="bg-slate-200 font-bold text-slate-900 border-t-2 border-slate-400">
                                            <Each of={col.table.dataColumns || []}>
                                              {(dCol, dCIdx) => {
                                                if (dCIdx > 0 && dCIdx < firstSumColIdx) return null;
                                                const isSummed = col.table.grouping?.subtotalColumns?.includes(dCol.field);
                                                const isLabelCell = dCIdx === 0;
                                                return (
                                                  <td 
                                                    key={`grand-${dCIdx}`} 
                                                    className="border border-gray-300 p-2 text-xs"
                                                    colSpan={isLabelCell ? labelColspan : 1}
                                                    style={{ textAlign: isSummed ? 'right' : (isLabelCell && labelColspan > 1 ? 'right' : dCol.align || 'left') }}
                                                  >
                                                    {isSummed ? "9,999,999" : (isLabelCell ? "Grand Total" : "")}
                                                  </td>
                                                );
                                              }}
                                            </Each>
                                          </tr>
                                        </>
                                      );
                                    })()}
                                  </>
                                );
                              }

                              // If datasets is provided but empty, show empty state instead of shimmer
                              if (datasets !== undefined) {
                                return (
                                  <tr>
                                    <td colSpan={col.table.dataColumns?.length || 1} className="border border-gray-300 p-4 text-center text-slate-500 italic">
                                      Tidak ada data
                                    </td>
                                  </tr>
                                );
                              }

                              // Fallback to shimmer if no real data and no datasets provided (builder mode)
                              return (
                                <>
                                  {col.table.grouping?.groupBy ? (
                                    <>
                                      <tr className="bg-slate-50 text-slate-700">
                                        <td colSpan={col.table.dataColumns?.length || 1} className="border border-gray-300 p-2 text-left text-xs font-bold bg-gray-50">
                                          [Group: {col.table.grouping.groupBy}]
                                        </td>
                                      </tr>
                                      {/* Shimmer/Skeleton rows simulating grouped data */}
                                      <Each of={[1, 2]}>
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
                                      {col.table.grouping?.showSubtotal && (() => {
                                        const firstSumColIdx = (col.table.dataColumns || []).findIndex(dCol => col.table.grouping?.subtotalColumns?.includes(dCol.field));
                                        const labelColspan = firstSumColIdx > 0 ? firstSumColIdx : 1;
                                        return (
                                          <>
                                            <tr className="bg-slate-100 font-bold text-slate-800">
                                              <Each of={col.table.dataColumns || []}>
                                                {(dCol, dCIdx) => {
                                                  if (dCIdx > 0 && dCIdx < firstSumColIdx) return null;
                                                  const isSummed = col.table.grouping?.subtotalColumns?.includes(dCol.field);
                                                  const isLabelCell = dCIdx === 0;
                                                  return (
                                                    <td 
                                                      key={`sub-${dCIdx}`} 
                                                      className="border border-gray-300 p-2 bg-gray-100 text-xs"
                                                      colSpan={isLabelCell ? labelColspan : 1}
                                                      style={{ textAlign: isSummed ? 'right' : (isLabelCell && labelColspan > 1 ? 'right' : dCol.align || 'left') }}
                                                    >
                                                      {isSummed ? "999,999" : (isLabelCell ? (col.table.grouping?.subtotalLabel || 'Sub Total') : "")}
                                                    </td>
                                                  );
                                                }}
                                              </Each>
                                            </tr>
                                            <tr className="bg-slate-200 font-bold text-slate-900 border-t-2 border-slate-400">
                                              <Each of={col.table.dataColumns || []}>
                                                {(dCol, dCIdx) => {
                                                  if (dCIdx > 0 && dCIdx < firstSumColIdx) return null;
                                                  const isSummed = col.table.grouping?.subtotalColumns?.includes(dCol.field);
                                                  const isLabelCell = dCIdx === 0;
                                                  return (
                                                    <td 
                                                      key={`grand-${dCIdx}`} 
                                                      className="border border-gray-300 p-2 text-xs"
                                                      colSpan={isLabelCell ? labelColspan : 1}
                                                      style={{ textAlign: isSummed ? 'right' : (isLabelCell && labelColspan > 1 ? 'right' : dCol.align || 'left') }}
                                                    >
                                                      {isSummed ? "9,999,999" : (isLabelCell ? "Grand Total" : "")}
                                                    </td>
                                                  );
                                                }}
                                              </Each>
                                            </tr>
                                          </>
                                        );
                                      })()}
                                    </>
                                  ) : (
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
                                                {dCol.type === 'formula' ? (
                                                  <span className="text-[10px] font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                                                    [Formula]
                                                  </span>
                                                ) : (
                                                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4 mx-auto" 
                                                      style={{ marginLeft: dCol.align === 'left' ? '0' : dCol.align === 'right' ? 'auto' : 'auto', marginRight: dCol.align === 'right' ? '0' : 'auto' }} />
                                                )}
                                              </td>
                                            )}
                                          </Each>
                                        </tr>
                                      )}
                                    </Each>
                                  )}
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    );
                  }}
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
                    <div key={cIdx} className="flex flex-col items-center w-40 text-sm text-center">
                      <Show when={!!col.title}>
                        <span>{renderSignatureText(col.title)}</span>
                      </Show>
                      <Show when={!!col.title2}>
                        <span>{renderSignatureText(col.title2)}</span>
                      </Show>
                      
                      <div className="h-16" /> {/* Spacer untuk Tanda Tangan */}
                      
                      <Show when={!!col.name}>
                        <span className="font-bold text-gray-800 underline underline-offset-4">{renderSignatureText(col.name)}</span>
                      </Show>
                      <Show when={!!col.role}>
                        <span className="text-xs text-gray-800 mt-1">{renderSignatureText(col.role)}</span>
                      </Show>
                      <Show when={!!col.role2}>
                        <span className="text-xs text-gray-500">{renderSignatureText(col.role2)}</span>
                      </Show>
                    </div>
                  )}
                </Each>
              </div>
            )}
          </Each>
        </div>
      </Show>

      {/* Print Info Footer (Always printed at the bottom of the report) */}
      <div className="mt-8 pt-2 border-t border-slate-300 w-full flex justify-between text-[10px] text-gray-500 font-mono">
        <div>Dicetak oleh: Superadmin pada {new Date().toLocaleString('id-ID')}</div>
        <div>Halaman 1 dari 1</div>
      </div>
      </div>
    </div>
  );
}
