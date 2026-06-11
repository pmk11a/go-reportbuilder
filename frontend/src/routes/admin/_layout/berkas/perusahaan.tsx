import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Tabs } from '@/shared/ui';
import { CompanyForm } from '@/domains/settings/components/settings/CompanyForm';
import { NumberingForm } from '@/domains/settings/components/settings/NumberingForm';

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

