import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import { Each } from '@/components/ui/layout/Render'
import { ShieldCheck } from 'lucide-react'

export const Route = createFileRoute('/admin/_layout/reports/')({
  component: ReportsPage,
})

interface IReportLink {
  to: string
  titleKey: string
  descriptionKey: string
  icon: React.ReactNode
}

const REPORT_LINKS: IReportLink[] = [
  {
    to: '/admin/reports/permission-report',
    titleKey: 'reports_index.permission_report_title',
    descriptionKey: 'reports_index.permission_report_description',
    icon: <ShieldCheck className="h-6 w-6 text-primary-600 dark:text-primary-400" />,
  },
]

function ReportsPage() {
  const { t } = useTranslation(['reports', 'common'])

  return (
    <div className="space-y-6 p-8">
      <Helmet>
        <title>{t('reports_index.title')} - DAPEN</title>
        <meta name="description" content={t('reports_index.description')} />
      </Helmet>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Each of={REPORT_LINKS}>
          {(report: IReportLink) => (
            <Link
              key={report.to}
              to={report.to}
              className="block focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-2xl"
              aria-label={t(report.titleKey)}
            >
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {report.icon}
                    <CardTitle className="text-base">{t(report.titleKey)}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{t(report.descriptionKey)}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}
        </Each>
      </div>
    </div>
  )
}
