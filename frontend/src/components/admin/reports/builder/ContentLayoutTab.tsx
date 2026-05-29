import React from 'react';
import { useAdminReportStore, defaultLayoutConfig } from '@/store/adminReportStore';
import { LayoutHeaderBuilder } from './LayoutHeaderBuilder';
import { LayoutBodyBuilder } from './LayoutBodyBuilder';
import { LayoutFooterBuilder } from './LayoutFooterBuilder';
import { Card } from '@/components/ui';

export function ContentLayoutTab() {
  const { activeReport, updateLayoutConfig } = useAdminReportStore();

  if (!activeReport) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No active report selected.
      </div>
    );
  }

  const layoutConfig = activeReport.layoutConfig || defaultLayoutConfig;

  return (
    <div className="space-y-6 pb-16">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Report Layout Designer</h2>
        <p className="text-sm text-muted-foreground">
          Configure the visual layout for the PDF export, including headers, data grids, and signatures.
        </p>
      </div>

      <Card className="p-6 border-primary/20">
        <LayoutHeaderBuilder 
          value={layoutConfig.header} 
          onChange={(header) => updateLayoutConfig({ ...layoutConfig, header })} 
        />
      </Card>
      
      <Card className="p-6 border-primary/20">
        <LayoutBodyBuilder 
          value={layoutConfig.body} 
          onChange={(body) => updateLayoutConfig({ ...layoutConfig, body })}
          availableDatasets={activeReport.datasets || []}
        />
      </Card>
      
      <Card className="p-6 border-primary/20">
        <LayoutFooterBuilder 
          value={layoutConfig.footer} 
          onChange={(footer) => updateLayoutConfig({ ...layoutConfig, footer })} 
        />
      </Card>

      <div className="bg-slate-950 p-4 rounded-lg overflow-auto mt-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-slate-300">JSON Payload Preview (For Golang Backend)</h3>
        </div>
        <pre className="text-xs font-mono text-slate-400">
          {JSON.stringify(layoutConfig, null, 2)}
        </pre>
      </div>
    </div>
  );
}
