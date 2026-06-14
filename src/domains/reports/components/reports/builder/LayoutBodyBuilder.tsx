import React from 'react';
import { Plus, X, Settings2 } from 'lucide-react';
import type { LayoutBody, LayoutTable, TableHeaderCell, TableBodyColumn, ReportDataset } from '@/domains/accounting/report';
import { Button } from '@/shared/ui';

interface Props {
  value: LayoutBody;
  onChange: (value: LayoutBody) => void;
  availableDatasets: ReportDataset[];
}

export function LayoutBodyBuilder({ value, onChange, availableDatasets }: Props) {
  const addTable = () => {
    const newTable: LayoutTable = {
      id: `table-${Date.now()}`,
      datasetName: availableDatasets[0]?.name || '',
      gridSpan: 12,
      headerRows: [[{ label: 'Column 1', rowspan: 1, colspan: 1, width: '100%', className: '' }]],
      bodyColumns: [{ field: '', format: 'text', className: '' }]
    };
    onChange({ ...value, tables: [...value.tables, newTable] });
  };

  const removeTable = (tableId: string) => {
    onChange({ ...value, tables: value.tables.filter(t => t.id !== tableId) });
  };

  const updateTable = (tableId: string, updates: Partial<LayoutTable>) => {
    onChange({
      ...value,
      tables: value.tables.map(t => t.id === tableId ? { ...t, ...updates } : t)
    });
  };

  const addHeaderRow = (table: LayoutTable) => {
    updateTable(table.id, { headerRows: [...table.headerRows, []] });
  };
  const addHeaderCell = (table: LayoutTable, rowIndex: number) => {
    const newRows = [...table.headerRows];
    newRows[rowIndex].push({ label: 'New Col', rowspan: 1, colspan: 1, width: '', className: '' });
    updateTable(table.id, { headerRows: newRows });
  };
  const updateHeaderCell = (table: LayoutTable, rowIndex: number, cellIndex: number, cellUpdates: Partial<TableHeaderCell>) => {
    const newRows = [...table.headerRows];
    newRows[rowIndex][cellIndex] = { ...newRows[rowIndex][cellIndex], ...cellUpdates };
    updateTable(table.id, { headerRows: newRows });
  };

  const addBodyColumn = (table: LayoutTable) => {
    updateTable(table.id, { bodyColumns: [...table.bodyColumns, { field: '', format: 'text', className: '' }] });
  };
  const updateBodyColumn = (table: LayoutTable, colIndex: number, colUpdates: Partial<TableBodyColumn>) => {
    const newCols = [...table.bodyColumns];
    newCols[colIndex] = { ...newCols[colIndex], ...colUpdates };
    updateTable(table.id, { bodyColumns: newCols });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Body Configuration (Grid)</h3>
        <Button variant="outline" size="sm" onClick={addTable} type="button">
          <Plus className="h-4 w-4 mr-1" /> Add Table
        </Button>
      </div>

      {(!value.tables || value.tables.length === 0) && (
        <div className="p-8 text-center border-2 border-dashed rounded-lg bg-muted/50">
          <p className="text-muted-foreground text-sm">No tables added to body.</p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {value.tables.map(table => (
          <div 
            key={table.id} 
            className="border rounded-xl bg-card shadow-sm overflow-hidden flex flex-col"
            style={{ gridColumn: `span ${table.gridSpan} / span ${table.gridSpan}` }}
          >
            {/* Table Settings Toolbar */}
            <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <select 
                  value={table.datasetName} 
                  onChange={(e) => updateTable(table.id, { datasetName: e.target.value })}
                  className="border rounded px-2 py-1 text-xs bg-background"
                >
                  <option value="">Select Dataset...</option>
                  {availableDatasets.map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.spName})</option>
                  ))}
                </select>
                <select 
                  value={table.gridSpan} 
                  onChange={(e) => updateTable(table.id, { gridSpan: parseInt(e.target.value) })}
                  className="border rounded px-2 py-1 text-xs bg-background"
                >
                  <option value={12}>Full Width (12/12)</option>
                  <option value={8}>2/3 Width (8/12)</option>
                  <option value={6}>Half Width (6/12)</option>
                  <option value={4}>1/3 Width (4/12)</option>
                  <option value={3}>1/4 Width (3/12)</option>
                </select>
              </div>
              <button onClick={() => removeTable(table.id)} type="button" className="text-destructive hover:opacity-80 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-x-auto">
              <div className="min-w-max space-y-4">
                {/* Headers Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Header Rows</span>
                    <button onClick={() => addHeaderRow(table)} type="button" className="text-xs text-primary hover:underline">+ Add Row</button>
                  </div>
                  
                  <div className="space-y-2">
                    {table.headerRows.map((row, rIdx) => (
                      <div key={rIdx} className="flex gap-2">
                        <div className="bg-accent/30 rounded p-1 flex-1 flex gap-2 overflow-x-auto items-center">
                          <span className="text-xs text-muted-foreground pl-1">R{rIdx + 1}</span>
                          {row.map((cell, cIdx) => (
                            <div key={cIdx} className="border bg-background p-2 rounded min-w-[150px]">
                              <input 
                                value={cell.label} onChange={(e) => updateHeaderCell(table, rIdx, cIdx, { label: e.target.value })}
                                className="w-full border-b mb-2 text-sm font-semibold" placeholder="Header label..."
                              />
                              <div className="flex gap-1">
                                <input value={cell.colspan} onChange={(e) => updateHeaderCell(table, rIdx, cIdx, { colspan: parseInt(e.target.value) || 1 })} type="number" className="w-1/3 border rounded p-1 text-[10px]" title="Colspan" />
                                <input value={cell.rowspan} onChange={(e) => updateHeaderCell(table, rIdx, cIdx, { rowspan: parseInt(e.target.value) || 1 })} type="number" className="w-1/3 border rounded p-1 text-[10px]" title="Rowspan" />
                                <input value={cell.width} onChange={(e) => updateHeaderCell(table, rIdx, cIdx, { width: e.target.value })} type="text" className="w-1/3 border rounded p-1 text-[10px]" placeholder="Width" />
                              </div>
                            </div>
                          ))}
                          <button onClick={() => addHeaderCell(table, rIdx)} type="button" className="p-2 border border-dashed rounded text-muted-foreground hover:bg-accent">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body Mapping Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Body Columns Mapping</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="bg-accent/10 border border-accent rounded p-2 flex-1 flex gap-2 overflow-x-auto items-center">
                      {table.bodyColumns.map((col, cIdx) => (
                        <div key={cIdx} className="border bg-background p-2 rounded min-w-[150px]">
                          <input 
                            value={col.field} onChange={(e) => updateBodyColumn(table, cIdx, { field: e.target.value })}
                            className="w-full border rounded p-1 mb-2 text-xs font-mono" placeholder="db_field_name"
                          />
                          <select 
                            value={col.format} onChange={(e) => updateBodyColumn(table, cIdx, { format: e.target.value as any })}
                            className="w-full border rounded p-1 text-xs mb-1"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="currency">Currency</option>
                            <option value="date">Date</option>
                          </select>
                          <input 
                            value={col.className || ''} onChange={(e) => updateBodyColumn(table, cIdx, { className: e.target.value })}
                            className="w-full border rounded p-1 text-[10px]" placeholder="CSS classes (text-center, etc)"
                          />
                        </div>
                      ))}
                      <button onClick={() => addBodyColumn(table)} type="button" className="p-2 border border-dashed rounded text-muted-foreground hover:bg-accent">+</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
