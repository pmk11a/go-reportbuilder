import { Show } from '@/shared/ui/layout'
import { substituteTemplate, parseTitleStyle, TITLE_FONT_SIZE_CLASS, TITLE_FONT_WEIGHT_CLASS } from '../../../utils/bandSubstitution'
import { Divider } from '@/shared/ui'

interface ReportTitleBandProps {
  footerBandsJson?: any
  fallbackTitle: string
  fallbackSubtitle?: string
  filterValues?: Record<string, string | string[] | null>
}

export function ReportTitleBand({ footerBandsJson, fallbackTitle, fallbackSubtitle, filterValues }: ReportTitleBandProps) {
  let titleConfig = footerBandsJson?.bands?.title
  let pageHeaderConfig = footerBandsJson?.bands?.pageHeader

  // Substitute @param and [param] in title and pageHeader
  const fv = filterValues || {}
  const titleText = substituteTemplate(
    (titleConfig?.enabled && titleConfig?.content ? titleConfig.content : undefined) || fallbackTitle,
    fv
  )
  const titleAlign = titleConfig?.align || 'left'
  const subtitleText = substituteTemplate(
    (pageHeaderConfig?.enabled && pageHeaderConfig?.content ? pageHeaderConfig.content : undefined) || fallbackSubtitle,
    fv
  )

  // Parse style config
  const style = parseTitleStyle(titleConfig || {})
  const fontSizeClass = TITLE_FONT_SIZE_CLASS[style.fontSize] || TITLE_FONT_SIZE_CLASS.large
  const fontWeightClass = TITLE_FONT_WEIGHT_CLASS[style.fontWeight] || TITLE_FONT_WEIGHT_CLASS.black
  const italicClass = style.italic ? 'italic' : ''
  const colorStyle = style.color ? { color: style.color } : {}

  return (
    <div className={`mb-6 w-full flex flex-col gap-1 ${
      titleAlign === 'center' ? 'items-center text-center' :
      titleAlign === 'right' ? 'items-end text-right' :
      'items-start text-left'
    }`}>
      <Show when={style.divider}>
        <Divider className="my-2" />
      </Show>
      <h1
        className={`${fontSizeClass} ${fontWeightClass} ${italicClass} tracking-tight text-slate-800 dark:text-slate-200`}
        style={colorStyle}
      >
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