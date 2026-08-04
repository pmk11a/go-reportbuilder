import { Show } from '@/shared/ui/layout'

interface ReportTitleBandProps {
  footerBandsJson?: any
  fallbackTitle: string
  fallbackSubtitle?: string
}

export function ReportTitleBand({ footerBandsJson, fallbackTitle, fallbackSubtitle }: ReportTitleBandProps) {
  let titleConfig = footerBandsJson?.bands?.title
  let pageHeaderConfig = footerBandsJson?.bands?.pageHeader

  // Fallback to defaults if not configured
  const titleText = titleConfig?.enabled && titleConfig.content ? titleConfig.content : fallbackTitle
  const titleAlign = titleConfig?.align || 'left'
  
  const subtitleText = pageHeaderConfig?.enabled && pageHeaderConfig.content ? pageHeaderConfig.content : fallbackSubtitle

  return (
    <div className={`mb-6 w-full flex flex-col gap-1 ${
      titleAlign === 'center' ? 'items-center text-center' : 
      titleAlign === 'right' ? 'items-end text-right' : 
      'items-start text-left'
    }`}>
      <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-200">
        {titleText}
      </h1>
      <Show when={!!subtitleText}>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {subtitleText}
        </p>
      </Show>
    </div>
  )
}
