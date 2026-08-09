import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Each } from '@/shared/ui';
import type { ILayoutFooter } from '@/domains/reports/types';

export function FooterEditor({ config, onChange, isDark }: { config: ILayoutFooter, onChange: any, isDark: boolean }) {
  const rows = config.rows || [];
  const cardClass = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200';
  const headingClass = isDark ? 'text-slate-200' : 'text-slate-800';

  const addRow = () => onChange({ ...config, type: 'footer', rows: [...rows, { justifyContent: 'space-between', columns: [{ title: 'Mengetahui', name: 'John Doe', role: 'Manager' }] }] });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-medium ${headingClass}`}>Footer Signatures</h3>
        <Button variant="ghost" size="sm" onClick={addRow}>
          <Plus className="w-4 h-4 mr-1" /> Add Row
        </Button>
      </div>

      <div className="space-y-4">
        <Each of={rows}>
          {(row, rIdx) => (
            <div key={rIdx} className={`border rounded-xl p-4 ${cardClass}`}>
               <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Row {rIdx + 1}</span>
                  <Select 
                    value={row.justifyContent || 'space-between'}
                    onValueChange={(val) => {
                      const newRows = [...rows];
                      newRows[rIdx].justifyContent = val as any;
                      onChange({ ...config, rows: newRows });
                    }}
                  >
                    <SelectTrigger className="h-8 rounded-lg text-xs w-40">
                      <SelectValue placeholder="Alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flex-start">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="flex-end">Right</SelectItem>
                      <SelectItem value="space-between">Space Between</SelectItem>
                      <SelectItem value="space-around">Space Around</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onChange({ ...config, rows: rows.filter((_, i) => i !== rIdx) })} className="text-red-500 hover:text-red-600 h-6 w-6 p-0 rounded-full">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Each of={row.columns}>
                  {(col, cIdx) => (
                    <div key={cIdx} className={`border rounded-xl p-4 relative ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <Button 
                          variant="ghost" size="sm" 
                          onClick={() => {
                            const newRows = [...rows];
                            newRows[rIdx].columns.splice(cIdx, 1);
                            onChange({ ...config, rows: newRows });
                          }}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 h-7 w-7 p-0 rounded-full"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <h4 className={`text-xs font-bold uppercase mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Kolom {cIdx + 1}</h4>
                       
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Title (Teks atas)</label>
                          <Input 
                            placeholder="e.g. Mengetahui" className={`h-9 rounded-xl text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
                            value={col.title || ''}
                            onChange={e => {
                              const newRows = [...rows];
                              newRows[rIdx].columns[cIdx].title = e.target.value;
                              onChange({ ...config, rows: newRows });
                            }}
                          />
                          <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Judul tanda tangan.</span>
                        </div>
                        <div className="space-y-1">
                          <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Name (Nama)</label>
                          <Input 
                            placeholder="Name" className={`h-9 rounded-xl font-bold text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
                            value={col.name || ''}
                            onChange={e => {
                              const newRows = [...rows];
                              newRows[rIdx].columns[cIdx].name = e.target.value;
                              onChange({ ...config, rows: newRows });
                            }}
                          />
                          <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nama orang yang menandatangani.</span>
                        </div>
                        <div className="space-y-1">
                          <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Role (Opsional)</label>
                          <Input 
                            placeholder="Role (optional)" className={`h-9 rounded-xl text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
                            value={col.role || ''}
                            onChange={e => {
                              const newRows = [...rows];
                              newRows[rIdx].columns[cIdx].role = e.target.value;
                              onChange({ ...config, rows: newRows });
                            }}
                          />
                          <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Jabatan atau peran.</span>
                        </div>
                        </div>
                    </div>
                  )}
                </Each>
              </div>
              <Button 
                variant="ghost" size="sm"
                onClick={() => {
                  const newRows = [...rows];
                  newRows[rIdx].columns.push({ title: 'Title', name: 'Name', role: '' });
                  onChange({ ...config, rows: newRows });
                }}
                className="mt-3 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Signature
              </Button>
            </div>
          )}
        </Each>
      </div>
    </div>
  );
}
