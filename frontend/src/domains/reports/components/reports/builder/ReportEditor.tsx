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
  reportConfig: Partial<IReportConfig>;
  setReportConfig: (val: Partial<IReportConfig>) => void;
  layoutConfig: ILayoutConfig[];
  setLayoutConfig: (val: ILayoutConfig[]) => void;
}

export function ReportEditor({ reportConfig, setReportConfig, layoutConfig, setLayoutConfig }: ReportEditorProps) {
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
      content: <div className="p-4"><GeneralEditor config={reportConfig} onChange={setReportConfig} isDark={isDark} /></div> 
    },
    { 
      label: 'Filters', 
      value: 'filters', 
      content: <div className="p-4"><FiltersEditor config={reportConfig} onChange={setReportConfig} isDark={isDark} /></div> 
    },
    { 
      label: 'Header Layout', 
      value: 'header', 
      content: <div className="p-4"><HeaderEditor config={getLayout('header') as ILayoutHeader} onChange={(d: any) => updateLayout('header', d)} reportConfig={reportConfig} setReportConfig={setReportConfig} isDark={isDark} /></div> 
    },
    { 
      label: 'Body Layout', 
      value: 'body', 
      content: (
        <div className="p-4">
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
      content: <div className="p-4"><FooterEditor config={getLayout('footer') as ILayoutFooter} onChange={(d: any) => updateLayout('footer', d)} isDark={isDark} /></div> 
    }
  ];

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Tabs Component */}
      <Tabs tabs={tabItems} defaultValue="general" className="h-full" />

      {/* Table Header Modal */}
      <Show when={headerModal.isOpen && headerModal.table !== null}>
        <TableHeaderModal 
          table={headerModal.table!}
          isDark={isDark}
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
