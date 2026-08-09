import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Input, Textarea, Each, Show } from '@/shared/ui';
import type { ILayoutBody, IReportConfig } from '@/domains/reports/types';

export function BodyEditor({ config, onChange, reportConfig, setReportConfig, onOpenHeaderModal, isDark }: { config: ILayoutBody, onChange: any, reportConfig: Partial<IReportConfig>, setReportConfig: any, onOpenHeaderModal: (rIdx: number, cIdx: number, table: any) => void, isDark: boolean }) {
  const rows = config.rows || [];
  const datasets = reportConfig.datasets || [];
  const bodyDatasets = datasets.filter((d:any) => d.tipe_dataset === 'body');
  const cardClass = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200';
  const headingClass = isDark ? 'text-slate-200' : 'text-slate-800';

  const addRow = () => onChange({ ...config, type: 'body', rows: [...rows, { columns: [{ width: '100%', table: { dataset: '', headerRows: [], dataColumns: [] } }] }] });

  const updateDatasets = (newBodyDs: any[]) => {
    const otherDs = datasets.filter((d:any) => d.tipe_dataset !== 'body');
    setReportConfig({ ...reportConfig, datasets: [...otherDs, ...newBodyDs] });
  };

  return (
    <div className="space-y-8">
      {/* 1. Body Data Sources */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`font-medium ${headingClass}`}>Data Sources (Body / Tables)</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Query untuk mengambil data utama yang akan dirender dalam bentuk tabel.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            updateDatasets([...bodyDatasets, { id_query: Date.now(), nama_dataset: 'T' + (bodyDatasets.length + 1), query_sumber_data: 'EXEC Sp_...', tipe_dataset: 'body' }]);
          }}>
            <Plus className="w-4 h-4 mr-1" /> Add Source
          </Button>
        </div>
        
        <Show when={bodyDatasets.length > 0}>
          <div className="space-y-3">
            <Each of={bodyDatasets}>
              {(ds, i) => (
                <div key={i} className={`p-4 border rounded-xl relative ${cardClass}`}>
                  <Button variant="ghost" size="icon" onClick={() => {
                      updateDatasets(bodyDatasets.filter((_, idx) => idx !== i));
                    }} className="absolute top-2 right-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 pr-0 sm:pr-8">
                    <div className="space-y-1">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>ID Dataset (Unik)</label>
                      <Input value={ds.id_query || ''} readOnly className={`h-9 rounded-xl text-xs ${isDark ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'}`} />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Alias (Dataset Name)</label>
                      <Input value={ds.nama_dataset} onChange={e => {
                        const nf = [...bodyDatasets]; nf[i].nama_dataset = e.target.value; updateDatasets(nf);
                      }} placeholder="Misal: T1" className={`h-9 rounded-xl text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Query (SQL / SP)</label>
                    <Textarea value={ds.query_sumber_data} onChange={e => {
                      const nf = [...bodyDatasets]; nf[i].query_sumber_data = e.target.value; updateDatasets(nf);
                    }} rows={3} placeholder="EXEC Sp_LapKasHarian" className={`rounded-xl font-mono text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`} />
                  </div>
                </div>
              )}
            </Each>
          </div>
        </Show>
      </div>

      <div className={`h-px w-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

      {/* 2. Body Layout */}
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-medium ${headingClass}`}>Body Layout (Tables)</h3>
        <Button variant="ghost" size="sm" onClick={addRow}>
          <Plus className="w-4 h-4 mr-1" /> Add Body Row
        </Button>
      </div>

      <div className="space-y-4">
        <Each of={rows}>
          {(row, rIdx) => (
            <div key={rIdx} className={`border rounded-xl p-4 ${cardClass}`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Row {rIdx + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => onChange({ ...config, rows: rows.filter((_, i) => i !== rIdx) })} className="text-red-500 hover:text-red-600 h-6 w-6 p-0 rounded-full">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Each of={row.columns}>
                  {(col, cIdx) => (
                    <div key={cIdx} className={`border rounded-xl p-4 relative flex-1 min-w-0 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const newRows = [...rows];
                        newRows[rIdx].columns.splice(cIdx, 1);
                        onChange({ ...config, rows: newRows });
                      }} className="absolute top-2 right-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 h-7 w-7 p-0 rounded-full">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <h4 className={`text-xs font-bold uppercase mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tabel {cIdx + 1}</h4>
                      
                      <div className="space-y-4 mb-4">

                        <div className="space-y-1">
                          <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Lebar (Width)</label>
                          <Select 
                            value={col.width || '100%'}
                            onValueChange={(val) => {
                              const newRows = [...rows];
                              newRows[rIdx].columns[cIdx].width = val;
                              onChange({ ...config, rows: newRows });
                            }}
                          >
                            <SelectTrigger className={`h-9 w-full rounded-xl text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
                              <SelectValue placeholder="Width" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="100%">100% (Penuh)</SelectItem>
                              <SelectItem value="50%">50% (Setengah)</SelectItem>
                              <SelectItem value="33%">33% (Sepertiga)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Pilih Data Source (Tabel)</label>
                          <Select 
                            value={col.table.dataset || ''}
                            onValueChange={(val) => {
                              const newRows = [...rows];
                              newRows[rIdx].columns[cIdx].table.dataset = val;
                              onChange({ ...config, rows: newRows });
                            }}
                          >
                            <SelectTrigger className={`h-9 w-full rounded-xl text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
                              <SelectValue placeholder="Pilih Dataset untuk Tabel ini" />
                            </SelectTrigger>
                            <SelectContent>
                              <Show when={bodyDatasets.length === 0}>
                                <SelectItem value="none" disabled>Belum ada Data Source</SelectItem>
                              </Show>
                              <Each of={bodyDatasets}>
                                {(ds) => <SelectItem key={ds.nama_dataset} value={ds.nama_dataset}>{ds.nama_dataset}</SelectItem>}
                              </Each>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded">
                        <span className="text-xs font-medium">Table Configuration</span>
                        <Button 
                          variant="secondary" size="sm" className="h-7 text-xs"
                          onClick={() => onOpenHeaderModal(rIdx, cIdx, col.table)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" /> Edit Headers & Columns
                        </Button>
                      </div>
                    </div>
                  )}
                </Each>
              </div>

              <Button 
                variant="ghost" size="sm"
                onClick={() => {
                  const newRows = [...rows];
                  newRows[rIdx].columns.push({ width: '50%', table: { dataset: '', headerRows: [], dataColumns: [] } });
                  onChange({ ...config, rows: newRows });
                }}
                className="mt-2 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Table to Row
              </Button>
            </div>
          )}
        </Each>
      </div>
    </div>
  );
}
