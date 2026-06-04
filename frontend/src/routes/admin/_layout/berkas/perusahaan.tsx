import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Tabs } from '@/components/ui';
import { CompanyForm } from '@/components/admin/settings/CompanyForm';
import { NumberingForm } from '@/components/admin/settings/NumberingForm';

export const Route = createFileRoute('/admin/_layout/berkas/perusahaan')({
  component: PerusahaanSettingsPage,
});

function PerusahaanSettingsPage() {
  const { t } = useTranslation(['company', 'numbering']);

  const tabItems = [
    {
      label: t('company:title'),
      value: 'company',
      content: <CompanyForm />,
    },
    {
      label: t('numbering:title'),
      value: 'numbering',
      content: <NumberingForm />,
    },
  ];

  return (
    <div className="w-full">
      <Tabs tabs={tabItems} defaultValue="company" />
    </div>
  );
}

