import { useState } from 'react';
import { Plus, Trash2, X, Settings2 } from 'lucide-react';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Each } from '@/shared/ui';
import { Checkbox } from '@/shared/ui/form/checkbox';
import type { ILayoutTable } from '@/domains/reports/types';

export function TableHeaderModal({ table, isDark, onClose, onSave }: { table: ILayoutTable, isDark: boolean, onClose: () => void, onSave: (t: ILayoutTable) => void }) {
  const [localTable, setLocalTable] = useState<ILayoutTable>(JSON.parse(JSON.stringify(table)));

  // Ensure grouping is initialized
  if (!localTable.grouping) {
    localTable.grouping = { groupBy: '', showSubtotal: false, subtotalLabel: '', subtotalColumns: [] };
  }

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
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-semibold text-sm">Table Headers (Thead)</h4>
                <p className="text-xs text-slate-500">Desain judul kolom tabel, dukung multi-baris (RowSpan/ColSpan).</p>
              </div>
              <Button variant="outline" size="sm" onClick={addHeaderRow}><Plus className="w-4 h-4 mr-1"/> Add Row</Button>
            </div>
            
            <div className="space-y-6">
              <Each of={localTable.headerRows || []}>
                {(hRow, rIdx) => (
                  <div key={rIdx} className={`p-4 border rounded-xl shadow-sm ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between mb-4 border-b pb-2 dark:border-slate-700">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Baris Header {rIdx + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const newRows = [...localTable.headerRows]; newRows.splice(rIdx, 1); setLocalTable({...localTable, headerRows: newRows});
                      }} className="h-6 text-red-500"><Trash2 className="w-3.5 h-3.5"/></Button>
                    </div>
                    
                    <div className="space-y-4">
                      <Each of={hRow}>
                        {(hCol, cIdx) => (
                          <div key={cIdx} className={`relative p-3 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <Button variant="ghost" size="icon" onClick={() => {
                              const newRows = [...localTable.headerRows];
                              newRows[rIdx].splice(cIdx, 1);
                              setLocalTable({...localTable, headerRows: newRows});
                            }} className="absolute top-2 right-2 text-red-500 h-6 w-6 rounded-full bg-white dark:bg-slate-800 shadow-sm"><Trash2 className="w-3 h-3"/></Button>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                              <div className="md:col-span-5 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">Label Kolom</label>
                                <Input 
                                  placeholder="Contoh: No. Bukti" className="text-sm h-9"
                                  value={hCol.text}
                                  onChange={e => {
                                    const newRows = [...localTable.headerRows];
                                    newRows[rIdx][cIdx].text = e.target.value;
                                    setLocalTable({...localTable, headerRows: newRows});
                                  }}
                                />
                              </div>
                              <div className="md:col-span-3 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">Perataan (Align)</label>
                                <Select 
                                  value={hCol.align || 'center'}
                                  onValueChange={(val) => {
                                    const newRows = [...localTable.headerRows];
                                    newRows[rIdx][cIdx].align = val as any;
                                    setLocalTable({...localTable, headerRows: newRows});
                                  }}
                                >
                                  <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Align" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="left">Kiri (Left)</SelectItem>
                                    <SelectItem value="center">Tengah (Center)</SelectItem>
                                    <SelectItem value="right">Kanan (Right)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">ColSpan</label>
                                <Input 
                                  type="number" placeholder="1" className="h-9 text-sm"
                                  value={hCol.colSpan || 1}
                                  onChange={e => {
                                    const newRows = [...localTable.headerRows];
                                    newRows[rIdx][cIdx].colSpan = parseInt(e.target.value) || 1;
                                    setLocalTable({...localTable, headerRows: newRows});
                                  }}
                                />
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">RowSpan</label>
                                <Input 
                                  type="number" placeholder="1" className="h-9 text-sm"
                                  value={hCol.rowSpan || 1}
                                  onChange={e => {
                                    const newRows = [...localTable.headerRows];
                                    newRows[rIdx][cIdx].rowSpan = parseInt(e.target.value) || 1;
                                    setLocalTable({...localTable, headerRows: newRows});
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </Each>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => addHeaderCol(rIdx)} className="mt-3 text-xs font-medium text-indigo-500 hover:text-indigo-600"><Plus className="w-3.5 h-3.5 mr-1"/> Tambah Kolom ke Baris Ini</Button>
                  </div>
                )}
              </Each>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700 w-full" />

          {/* Data Columns */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-semibold text-sm">Data Columns (Tbody)</h4>
                <p className="text-xs text-slate-500">Pemetaan field dari Data Source (Database) ke tabel ini.</p>
              </div>
              <Button variant="outline" size="sm" onClick={addDataCol}><Plus className="w-4 h-4 mr-1"/> Add Field</Button>
            </div>
            
            <div className="space-y-3">
              <Each of={localTable.dataColumns || []}>
                {(dCol, cIdx) => (
                  <div key={cIdx} className={`relative p-4 rounded-xl border shadow-sm ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <Button variant="ghost" size="icon" onClick={() => {
                      const newCols = [...localTable.dataColumns];
                      newCols.splice(cIdx, 1);
                      setLocalTable({...localTable, dataColumns: newCols});
                    }} className="absolute top-2 right-2 text-red-500 h-6 w-6"><Trash2 className="w-3.5 h-3.5"/></Button>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 pr-6">
                      <div className="md:col-span-5 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Field Database</label>
                        <Input 
                          placeholder="Contoh: no_rekening" className="font-mono text-sm h-9"
                          value={dCol.field}
                          onChange={e => {
                            const newCols = [...localTable.dataColumns];
                            newCols[cIdx].field = e.target.value;
                            setLocalTable({...localTable, dataColumns: newCols});
                          }}
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Perataan (Align)</label>
                        <Select 
                          value={dCol.align || 'left'}
                          onValueChange={(val) => {
                            const newCols = [...localTable.dataColumns];
                            newCols[cIdx].align = val as any;
                            setLocalTable({...localTable, dataColumns: newCols});
                          }}
                        >
                          <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Align" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Kiri (Left)</SelectItem>
                            <SelectItem value="center">Tengah (Center)</SelectItem>
                            <SelectItem value="right">Kanan (Right)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-4 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Format Data</label>
                        <Select 
                          value={dCol.format || 'text'}
                          onValueChange={(val) => {
                            const newCols = [...localTable.dataColumns];
                            newCols[cIdx].format = val;
                            setLocalTable({...localTable, dataColumns: newCols});
                          }}
                        >
                          <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Format" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Teks (Default)</SelectItem>
                            <SelectItem value="number">Angka (Number)</SelectItem>
                            <SelectItem value="currency">Mata Uang (Currency)</SelectItem>
                            <SelectItem value="date">Tanggal (Date)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </Each>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700 w-full" />

          {/* Grouping & Sub-totals */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5 text-indigo-500" />
              <h4 className="font-semibold text-sm">Table Settings (Grouping & Sub-totals)</h4>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'} space-y-4`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Group By Field (Opsional)</label>
                  <Input 
                    placeholder="Contoh: kode_cabang" className="text-sm"
                    value={localTable.grouping?.groupBy || ''}
                    onChange={e => setLocalTable({...localTable, grouping: {...localTable.grouping!, groupBy: e.target.value}})}
                  />
                  <p className="text-[10px] text-slate-400">Field dari database untuk grouping baris.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Label Sub-Total</label>
                  <Input 
                    placeholder="Contoh: Sub Total" className="text-sm"
                    value={localTable.grouping?.subtotalLabel || ''}
                    onChange={e => setLocalTable({...localTable, grouping: {...localTable.grouping!, subtotalLabel: e.target.value}})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Checkbox 
                  checked={localTable.grouping?.showSubtotal}
                  onChange={e => setLocalTable({...localTable, grouping: {...localTable.grouping!, showSubtotal: e.target.checked}})}
                />
                <label className="text-sm font-medium">Tampilkan Sub-Total (Sum)</label>
              </div>

              {localTable.grouping?.showSubtotal && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-500">Pilih Kolom untuk Dijumlahkan (Sum)</label>
                  {(!localTable.dataColumns || localTable.dataColumns.length === 0) ? (
                    <p className="text-xs text-red-500 italic">Silakan tambahkan Data Columns (Tbody) terlebih dahulu di atas.</p>
                  ) : (
                    <div className="flex flex-wrap gap-3 p-3 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800">
                      <Each of={localTable.dataColumns}>
                        {(dCol, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-2">
                            <Checkbox 
                              checked={localTable.grouping?.subtotalColumns?.includes(dCol.field)}
                              onChange={e => {
                                const currentCols = [...(localTable.grouping?.subtotalColumns || [])];
                                if (e.target.checked) {
                                  if (!currentCols.includes(dCol.field)) currentCols.push(dCol.field);
                                } else {
                                  const idx = currentCols.indexOf(dCol.field);
                                  if (idx > -1) currentCols.splice(idx, 1);
                                }
                                setLocalTable({...localTable, grouping: {...localTable.grouping!, subtotalColumns: currentCols}});
                              }}
                            />
                            <label className="text-xs font-medium cursor-pointer" onClick={() => {
                                const currentCols = [...(localTable.grouping?.subtotalColumns || [])];
                                if (!currentCols.includes(dCol.field)) currentCols.push(dCol.field);
                                else currentCols.splice(currentCols.indexOf(dCol.field), 1);
                                setLocalTable({...localTable, grouping: {...localTable.grouping!, subtotalColumns: currentCols}});
                            }}>{dCol.field || `Kolom ${cIdx+1}`}</label>
                          </div>
                        )}
                      </Each>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400">Pilih field (dari Tbody) yang akan dijumlahkan pada baris Sub-Total.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className={`p-4 border-t flex justify-end gap-3 rounded-b-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => onSave(localTable)}>Simpan Konfigurasi</Button>
        </div>
      </div>
    </div>
  );
}
