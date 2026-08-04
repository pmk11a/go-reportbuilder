import React from 'react'
import { SideInfoPanel } from './SideInfoPanel'
import { FooterSummaryTable } from './FooterSummaryTable'
import { SignaturesBlock } from './SignaturesBlock'

interface ReportFooterBandsProps {
  footerBandsJson?: any
  summaryData: Record<string, any> // Processed T1 with computes
  detailDatasets: Record<string, any[]>
}

export function ReportFooterBands({ footerBandsJson, summaryData, detailDatasets }: ReportFooterBandsProps) {
  if (!footerBandsJson?.bands?.summary?.enabled) return null

  const summaryConfig = footerBandsJson.bands.summary
  const sidePanelConfig = summaryConfig.chgb_panel // Still using chgb_panel from json for backward compatibility
  const footerTable = summaryConfig.footer_table
  const signatures = summaryConfig.signatures

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(val)

  return (
    <div className="mt-8 pt-6 border-t-2 border-slate-200 dark:border-slate-700/50 flex flex-col gap-8 w-full bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl">
      
      {/* Side Panel & Footer Table Row */}
      {(sidePanelConfig?.enabled || footerTable) && (
        <div className={`flex flex-col md:flex-row gap-8 w-full`}>
          
          {sidePanelConfig?.enabled && (
             <div className={`${footerTable ? 'w-full md:w-1/3' : 'w-full'}`}>
               <SideInfoPanel 
                 config={sidePanelConfig} 
                 summaryData={summaryData} 
                 formatCurrency={formatCurrency} 
               />
             </div>
          )}

          {footerTable && (
             <div className={`${sidePanelConfig?.enabled ? 'w-full md:flex-1' : 'w-full'}`}>
               <FooterSummaryTable 
                 config={footerTable} 
                 summaryData={summaryData} 
                 detailDatasets={detailDatasets} 
                 formatCurrency={formatCurrency} 
               />
             </div>
          )}

        </div>
      )}

      {/* Signatures */}
      {signatures && signatures.length > 0 && (
        <SignaturesBlock signatures={signatures} />
      )}

    </div>
  )
}
