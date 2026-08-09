import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Each } from '@/shared/ui';
import type { ILayoutTable } from '@/domains/reports/types';

export function TableHeaderModal({ table, isDark, onClose, onSave }: { table: ILayoutTable, isDark: boolean, onClose: () => void, onSave: (t: ILayoutTable) => void }) {
  const [localTable, setLocalTable] = useState<ILayoutTable>(JSON.parse(JSON.stringify(table)));

  const addHeaderRow = () => {
    setLocalTable({ ...localTable, headerRows: [...(localTable.headerRows || []), []] });
  };

  const addHeaderCol = (rIdx: number) => {
    const newRows = [...(localTable.headerRows || [])];
    newRows[rIdx].push({ text: 'New Header', align: 'center', colSpan: 1, rowSpan: 1 });
    setLocalTable({ ...localTable, headerRows: newRows });
  };

  const addDataCol = () => {
    setLocalTable({ ...localTable, dataColumns: [...(localTable.dataColumns || []), { field: 'field_name', align: 'left' }] });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
        <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className="font-semibold">Table Configuration</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5"/></Button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-8">
          {/* Header Rows */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-sm">Table Headers (Thead)</h4>
              <Button variant="outline" size="sm" onClick={addHeaderRow}><Plus className="w-4 h-4 mr-1"/> Add Header Row</Button>
            </div>
            
            <div className="space-y-4">
              <Each of={localTable.headerRows || []}>
                {(hRow, rIdx) => (
                  <div key={rIdx} className={`p-3 border rounded-lg ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-slate-500">Row {rIdx + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const newRows = [...localTable.headerRows]; newRows.splice(rIdx, 1); setLocalTable({...localTable, headerRows: newRows});
                      }} className="h-6 text-red-500"><Trash2 className="w-3 h-3"/></Button>
                    </div>
                    <div className="space-y-2">
                      <Each of={hRow}>
                        {(hCol, cIdx) => (
                          <div key={cIdx} className="flex gap-2 items-center">
                            <Input 
                              placeholder="Header Text" className="flex-1 text-sm"
                              value={hCol.text}
                              onChange={e => {
                                const newRows = [...localTable.headerRows];
                                newRows[rIdx][cIdx].text = e.target.value;
                                setLocalTable({...localTable, headerRows: newRows});
                              }}
                            />
                            <Select 
                              value={hCol.align || 'center'}
                              onValueChange={(val) => {
                                const newRows = [...localTable.headerRows];
                                newRows[rIdx][cIdx].align = val as any;
                                setLocalTable({...localTable, headerRows: newRows});
                              }}
                            >
                              <SelectTrigger className="h-9 w-24"><SelectValue placeholder="Align" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input 
                              type="number" title="ColSpan" placeholder="CS" className="w-16"
                              value={hCol.colSpan || 1}
                              onChange={e => {
                                const newRows = [...localTable.headerRows];
                                newRows[rIdx][cIdx].colSpan = parseInt(e.target.value) || 1;
                                setLocalTable({...localTable, headerRows: newRows});
                              }}
                            />
                            <Input 
                              type="number" title="RowSpan" placeholder="RS" className="w-16"
                              value={hCol.rowSpan || 1}
                              onChange={e => {
                                const newRows = [...localTable.headerRows];
                                newRows[rIdx][cIdx].rowSpan = parseInt(e.target.value) || 1;
                                setLocalTable({...localTable, headerRows: newRows});
                              }}
                            />
                            <Button variant="ghost" size="icon" onClick={() => {
                              const newRows = [...localTable.headerRows];
                              newRows[rIdx].splice(cIdx, 1);
                              setLocalTable({...localTable, headerRows: newRows});
                            }} className="text-red-500"><Trash2 className="w-4 h-4"/></Button>
                          </div>
                        )}
                      </Each>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => addHeaderCol(rIdx)} className="mt-2 text-xs"><Plus className="w-3 h-3 mr-1"/> Add Column</Button>
                  </div>
                )}
              </Each>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700 w-full" />

          {/* Data Columns */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-sm">Data Columns (Tbody)</h4>
              <Button variant="outline" size="sm" onClick={addDataCol}><Plus className="w-4 h-4 mr-1"/> Add Data Column</Button>
            </div>
            
            <div className="space-y-2">
              <Each of={localTable.dataColumns || []}>
                {(dCol, cIdx) => (
                  <div key={cIdx} className={`flex gap-2 items-center p-2 border rounded-lg ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <Input 
                      placeholder="Field Database (e.g. no_rekening)" className="flex-1 font-mono text-sm"
                      value={dCol.field}
                      onChange={e => {
                        const newCols = [...localTable.dataColumns];
                        newCols[cIdx].field = e.target.value;
                        setLocalTable({...localTable, dataColumns: newCols});
                      }}
                    />
                    <Select 
                      value={dCol.align || 'left'}
                      onValueChange={(val) => {
                        const newCols = [...localTable.dataColumns];
                        newCols[cIdx].align = val as any;
                        setLocalTable({...localTable, dataColumns: newCols});
                      }}
                    >
                      <SelectTrigger className="h-9 w-28"><SelectValue placeholder="Align" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select 
                      value={dCol.format || 'text'}
                      onValueChange={(val) => {
                        const newCols = [...localTable.dataColumns];
                        newCols[cIdx].format = val;
                        setLocalTable({...localTable, dataColumns: newCols});
                      }}
                    >
                      <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Format" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => {
                      const newCols = [...localTable.dataColumns];
                      newCols.splice(cIdx, 1);
                      setLocalTable({...localTable, dataColumns: newCols});
                    }} className="text-red-500"><Trash2 className="w-4 h-4"/></Button>
                  </div>
                )}
              </Each>
            </div>
          </div>

        </div>

        <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(localTable)}>Save Configuration</Button>
        </div>
      </div>
    </div>
  );
}
