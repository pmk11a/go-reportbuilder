import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea, Each, Show } from '@/shared/ui';
import type { ILayoutHeader, IReportConfig } from '@/domains/reports/types';

export function HeaderEditor({ config, onChange, reportConfig, setReportConfig, isDark }: { config: ILayoutHeader, onChange: any, reportConfig: Partial<IReportConfig>, setReportConfig: any, isDark: boolean }) {
  const rows = config.rows || [];
  const datasets = reportConfig.datasets || [];
  const headerDatasets = datasets.filter((d:any) => d.tipe_dataset === 'header');
  const availableDataSources = [
    ...(reportConfig.preFetchQueries || []).map(q => ({ id: q.id, name: `${q.name} (Pre-Fetch)` })),
    ...headerDatasets.map(d => ({ id: d.nama_dataset, name: `${d.nama_dataset} (Header DS)` }))
  ];
  const cardClass = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200';
  const headingClass = isDark ? 'text-slate-200' : 'text-slate-800';

  const addRow = () => onChange({ ...config, type: 'header', rows: [...rows, { columns: [{ text: 'New Text', align: 'center', colSpan: 1, sourceType: 'static' }] }] });

  const updateDatasets = (newHeaderDs: any[]) => {
    const otherDs = datasets.filter((d:any) => d.tipe_dataset !== 'header');
    setReportConfig({ ...reportConfig, datasets: [...otherDs, ...newHeaderDs] });
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Data Sources */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`font-medium ${headingClass}`}>Data Sources (Header)</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Query untuk mengambil data dinamis yang akan ditampilkan di header.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            updateDatasets([...headerDatasets, { id_query: Date.now(), nama_dataset: 'H_' + (headerDatasets.length + 1), query_sumber_data: 'SELECT ...', tipe_dataset: 'header' }]);
          }}>
            <Plus className="w-4 h-4 mr-1" /> Add Source
          </Button>
        </div>
        
        <Show when={headerDatasets.length > 0}>
          <div className="space-y-3">
            <Each of={headerDatasets}>
              {(ds, i) => (
                <div key={i} className={`p-4 border rounded-xl relative ${cardClass}`}>
                  <Button variant="ghost" size="icon" onClick={() => {
                      updateDatasets(headerDatasets.filter((_, idx) => idx !== i));
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
                        const nf = [...headerDatasets]; nf[i].nama_dataset = e.target.value; updateDatasets(nf);
                      }} placeholder="Misal: InfoCabang" className={`h-9 rounded-xl text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Query (SQL / SP)</label>
                    <Textarea value={ds.query_sumber_data} onChange={e => {
                      const nf = [...headerDatasets]; nf[i].query_sumber_data = e.target.value; updateDatasets(nf);
                    }} rows={3} placeholder="SELECT nama_cabang FROM cabang WHERE id = @CabangID" className={`rounded-xl font-mono text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`} />
                  </div>
                </div>
              )}
            </Each>
          </div>
        </Show>
      </div>

      <div className={`h-px w-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

      {/* 2. Header Layout */}
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-medium ${headingClass}`}>Header Rows</h3>
        <Button variant="ghost" size="sm" onClick={addRow}>
          <Plus className="w-4 h-4 mr-1" /> Add Row
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
              
              <div className="space-y-3">
                <Each of={row.columns}>
                  {(col, cIdx) => (
                    <div key={cIdx} className={`border rounded-xl p-4 relative ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const newRows = [...rows];
                        newRows[rIdx].columns.splice(cIdx, 1);
                        onChange({ ...config, rows: newRows });
                      }} className="absolute top-2 right-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 h-7 w-7 p-0 rounded-full">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <h4 className={`text-xs font-bold uppercase mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Kolom {cIdx + 1}</h4>
                      
                      <div className="space-y-4">
                        {/* Source Type */}
                        <div className="space-y-1">
                          <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Jenis Konten</label>
                          <Select 
                            value={col.sourceType || 'static'}
                            onValueChange={(val) => {
                              const newRows = [...rows];
                              newRows[rIdx].columns[cIdx].sourceType = val as any;
                              if(val === 'system') newRows[rIdx].columns[cIdx].text = '{current_date}';
                              if(val === 'static') newRows[rIdx].columns[cIdx].text = '';
                              onChange({ ...config, rows: newRows });
                            }}
                          >
                            <SelectTrigger className={`h-9 rounded-xl text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
                              <SelectValue placeholder="Data" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="static">Statis (Manual)</SelectItem>
                              <SelectItem value="system">Sistem (Otomatis)</SelectItem>
                              <SelectItem value="database">Database / Dinamis</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tipe data kolom.</span>
                        </div>

                        {/* Konten Berdasarkan Source Type */}
                        <div>
                          <Show when={col.sourceType === 'static'}>
                            <div className="space-y-1">
                              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Teks Statis</label>
                              <Input 
                                type="text" 
                                className={`h-9 rounded-xl text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
                                value={col.text || ''}
                                placeholder="Masukkan teks..."
                                onChange={e => {
                                  const newRows = [...rows];
                                  newRows[rIdx].columns[cIdx].text = e.target.value;
                                  onChange({ ...config, rows: newRows });
                                }}
                              />
                              <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Teks pasti yang akan dicetak.</span>
                            </div>
                          </Show>

                          <Show when={col.sourceType === 'system'}>
                            <div className="space-y-1">
                              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Variabel Sistem</label>
                              <Select 
                                value={col.text || '{current_date}'}
                                onValueChange={(val) => {
                                  const newRows = [...rows];
                                  newRows[rIdx].columns[cIdx].text = val;
                                  onChange({ ...config, rows: newRows });
                                }}
                              >
                                <SelectTrigger className={`h-9 rounded-xl text-xs font-mono ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
                                  <SelectValue placeholder="Pilih Variabel" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="{current_date}">Tanggal Cetak (Hari ini)</SelectItem>
                                  <SelectItem value="{current_time}">Waktu Cetak (Jam)</SelectItem>
                                  <SelectItem value="{page_number}">Halaman Ke-N</SelectItem>
                                  <SelectItem value="{total_pages}">Total Halaman</SelectItem>
                                  <SelectItem value="{user_name}">Nama User Pencetak</SelectItem>
                                  <SelectItem value="{report_name}">Judul Laporan</SelectItem>
                                </SelectContent>
                              </Select>
                              <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Di-generate otomatis oleh sistem saat cetak.</span>
                            </div>
                          </Show>

                          <Show when={col.sourceType === 'database'}>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                              <div className="md:col-span-6 space-y-1">
                                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Sumber Data</label>
                                <Select 
                                  value={col.dataset || ''}
                                  onValueChange={(val) => {
                                    const newRows = [...rows];
                                    newRows[rIdx].columns[cIdx].dataset = val;
                                    onChange({ ...config, rows: newRows });
                                  }}
                                >
                                  <SelectTrigger className={`h-9 rounded-xl text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
                                    <SelectValue placeholder="Pilih Source" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <Show when={availableDataSources.length === 0}>
                                      <SelectItem value="none" disabled>Belum ada Data Source</SelectItem>
                                    </Show>
                                    <Each of={availableDataSources}>
                                      {(ds) => <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>}
                                    </Each>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="md:col-span-6 space-y-1">
                                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Nama Field</label>
                                <Input 
                                  type="text" 
                                  className={`h-9 rounded-xl text-xs font-mono ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
                                  value={col.field || ''}
                                  placeholder="e.g. nama_cabang"
                                  onChange={e => {
                                    const newRows = [...rows];
                                    newRows[rIdx].columns[cIdx].field = e.target.value;
                                    onChange({ ...config, rows: newRows });
                                  }}
                                />
                              </div>
                            </div>
                            <span className={`text-[10px] mt-1 block leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ambil nilai (value) dari hasil eksekusi Query/SP.</span>
                          </Show>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          {/* Alignment */}
                          <div className="md:col-span-6 space-y-1">
                            <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Perataan Teks</label>
                            <Select 
                              value={col.align || 'center'}
                              onValueChange={(val) => {
                                const newRows = [...rows];
                                newRows[rIdx].columns[cIdx].align = val as any;
                                onChange({ ...config, rows: newRows });
                              }}
                            >
                              <SelectTrigger className={`h-9 rounded-xl text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
                                <SelectValue placeholder="Align" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Rata Kiri</SelectItem>
                                <SelectItem value="center">Rata Tengah</SelectItem>
                                <SelectItem value="right">Rata Kanan</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Posisi teks.</span>
                          </div>

                          {/* Colspan */}
                          <div className="md:col-span-6 space-y-1">
                            <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>ColSpan (1-12)</label>
                            <Input 
                              type="number" min="1" max="12"
                              className={`h-9 rounded-xl text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
                              value={col.colSpan || 1}
                              onChange={e => {
                                let val = parseInt(e.target.value) || 1;
                                if(val < 1) val = 1;
                                if(val > 12) val = 12;
                                const newRows = [...rows];
                                newRows[rIdx].columns[cIdx].colSpan = val;
                                onChange({ ...config, rows: newRows });
                              }}
                            />
                            <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Maks 12 grid.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Each>
                <Button 
                  variant="ghost" size="sm"
                  onClick={() => {
                    const newRows = [...rows];
                    newRows[rIdx].columns.push({ text: 'New Column', align: 'center', colSpan: 1, sourceType: 'static' });
                    onChange({ ...config, rows: newRows });
                  }}
                  className="mt-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Column to Row
                </Button>
              </div>
            </div>
          )}
        </Each>
      </div>
    </div>
  );
}
