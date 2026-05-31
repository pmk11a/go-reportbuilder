import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Tabs } from '@/components/ui';
import { CompanyForm } from '@/components/admin/settings/CompanyForm';
import { NumberingForm } from '@/components/admin/settings/NumberingForm';

export const Route = createFileRoute('/admin/_layout/berkas/perusahaan')({
  component: PerusahaanSettingsPage,
});

function PerusahaanSettingsPage() {
  const { t } = useTranslation();

  const tabItems = [
    {
      label: t('settings.company_tab', 'Company'),
      value: 'company',
      content: <CompanyForm />,
    },
    {
      label: t('settings.numbering_tab', 'Numbering'),
      value: 'numbering',
      content: <NumberingForm />,
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('settings.page_title', 'System Settings')}
        </h1>
        <p className="text-slate-500">
          {t('settings.page_description', 'Manage company profile and document numbering formats.')}
        </p>
      </div>

      <Tabs tabs={tabItems} defaultValue="company" />
    </div>
  );
}
