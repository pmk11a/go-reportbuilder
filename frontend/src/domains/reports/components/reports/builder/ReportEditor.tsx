import { useState } from 'react';
import { useThemeStore } from '@/shared/stores/themeStore';
import { Show, Tabs } from '@/shared/ui';
import type { 
  ILayoutConfig, IReportConfig, ILayoutHeader, ILayoutBody, ILayoutFooter, 
  ILayoutTable 
} from '@/domains/reports/types';

import { 
  GeneralEditor, 
  FiltersEditor, 
  HeaderEditor, 
  BodyEditor, 
  FooterEditor, 
  TableHeaderModal 
} from './editor';

interface ReportEditorProps {
  activeTab: string;
  setActiveTab: (val: string) => void;
  reportConfig: Partial<IReportConfig>;
  setReportConfig: (val: Partial<IReportConfig>) => void;
  layoutConfig: ILayoutConfig[];
  setLayoutConfig: (val: ILayoutConfig[]) => void;
  onDeleteReport?: () => void;
}

export function ReportEditor({ activeTab, setActiveTab, reportConfig, setReportConfig, layoutConfig, setLayoutConfig, onDeleteReport }: ReportEditorProps) {
  const isDark = useThemeStore((s) => s.isDark);
  const [headerModal, setHeaderModal] = useState<{isOpen: boolean, rowIndex: number, colIndex: number, table: ILayoutTable | null}>({ isOpen: false, rowIndex: -1, colIndex: -1, table: null });

  const updateLayout = (type: 'header' | 'body' | 'footer', newData: any) => {
    const newConfig = [...layoutConfig];
    const index = newConfig.findIndex(c => c.type === type);
    if (index >= 0) {
      newConfig[index] = newData;
    } else {
      newConfig.push(newData);
    }
    setLayoutConfig(newConfig);
  };

  const getLayout = (type: string) => layoutConfig.find(c => c.type === type) || { type, rows: [] };

  const tabItems = [
    { 
      label: 'General', 
      value: 'general', 
      content: <div className="p-4 pb-32"><GeneralEditor config={reportConfig} onChange={setReportConfig} isDark={isDark} onDelete={onDeleteReport} /></div> 
    },
    { 
      label: 'Filters', 
      value: 'filters', 
      content: <div className="p-4 pb-32"><FiltersEditor config={reportConfig} onChange={setReportConfig} isDark={isDark} /></div> 
    },
    { 
      label: 'Header Layout', 
      value: 'header', 
      content: <div className="p-4 pb-32"><HeaderEditor config={getLayout('header') as ILayoutHeader} onChange={(d: any) => updateLayout('header', d)} reportConfig={reportConfig} setReportConfig={setReportConfig} isDark={isDark} /></div> 
    },
    { 
      label: 'Body Layout', 
      value: 'body', 
      content: (
        <div className="p-4 pb-32">
          <BodyEditor 
            config={getLayout('body') as ILayoutBody} 
            onChange={(d: any) => updateLayout('body', d)}
            reportConfig={reportConfig}
            setReportConfig={setReportConfig}
            onOpenHeaderModal={(rIdx, cIdx, table) => setHeaderModal({ isOpen: true, rowIndex: rIdx, colIndex: cIdx, table })}
            isDark={isDark}
          />
        </div>
      )
    },
    { 
      label: 'Footer Layout', 
      value: 'footer', 
      content: <div className="p-4 pb-32"><FooterEditor config={getLayout('footer') as ILayoutFooter} onChange={(d: any) => updateLayout('footer', d)} reportConfig={reportConfig} setReportConfig={setReportConfig} isDark={isDark} /></div> 
    }
  ];

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Tabs Component */}
      <Tabs tabs={tabItems} defaultValue={activeTab} onValueChange={setActiveTab} className="h-full" storageKey="report-editor-tab" />

      {/* Table Header Modal */}
      <Show when={headerModal.isOpen && headerModal.table !== null}>
        <TableHeaderModal 
          table={headerModal.table!}
          isDark={isDark}
          reportId={reportConfig.id_laporan}
          datasetQuery={reportConfig.datasets?.find(d => d.nama_dataset === headerModal.table?.dataset)?.query_sumber_data}
          onClose={() => setHeaderModal({ isOpen: false, rowIndex: -1, colIndex: -1, table: null })}
          onSave={(newTable) => {
            const bodyConfig = getLayout('body') as ILayoutBody;
            const newBody = { ...bodyConfig };
            newBody.rows[headerModal.rowIndex].columns[headerModal.colIndex].table = newTable;
            updateLayout('body', newBody);
            setHeaderModal({ isOpen: false, rowIndex: -1, colIndex: -1, table: null });
          }}
        />
      </Show>
    </div>
  );
}
