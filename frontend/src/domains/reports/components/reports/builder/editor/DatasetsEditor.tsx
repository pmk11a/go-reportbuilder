import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Each } from '@/shared/ui';
import type { IReportConfig } from '@/domains/reports/types';

export function DatasetsEditor({ config, onChange, isDark }: { config: Partial<IReportConfig>, onChange: any, isDark: boolean }) {
  const datasets = config.datasets || [];
  const cardClass = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200';
  const headingClass = isDark ? 'text-slate-200' : 'text-slate-800';
  
  const addDs = () => {
    onChange({ ...config, datasets: [...datasets, { id_query: Date.now(), nama_dataset: 'T' + (datasets.length + 1), query_sumber_data: 'EXEC Sp_Lap' }] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={`font-medium ${headingClass}`}>Daftar Datasets (Stored Procedure)</h3>
        <Button variant="ghost" size="sm" onClick={addDs}>
          <Plus className="w-4 h-4 mr-1" /> Tambah Dataset
        </Button>
      </div>
      <Each of={datasets}>
        {(d, i) => (
          <div key={i} className={`border rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center relative pr-10 sm:pr-4 ${cardClass}`}>
            <div className="w-full flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/4">
                  <Input 
                    className={`h-9 rounded-xl ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
                    placeholder="Alias (T1)"
                    value={d.nama_dataset} onChange={e => {
                      const newDs = [...datasets]; newDs[i].nama_dataset = e.target.value; onChange({...config, datasets: newDs});
                    }}
                  />
                </div>
                <div className="w-full sm:flex-1">
                  <Input 
                    className={`h-9 rounded-xl font-mono text-sm w-full ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
                    placeholder="Query / EXEC Sp_..." 
                    value={d.query_sumber_data} onChange={e => {
                      const newDs = [...datasets]; newDs[i].query_sumber_data = e.target.value; onChange({...config, datasets: newDs});
                    }}
                  />
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onChange({ ...config, datasets: datasets.filter((_, idx) => idx !== i) })} className="absolute top-2 right-2 sm:static sm:top-auto sm:right-auto text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 shrink-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Each>
    </div>
  );
}
