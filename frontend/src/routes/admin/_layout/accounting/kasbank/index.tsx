import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IKasBankHeader } from '@/types/kasbank';
import { KasBankDataTable } from '@/components/admin/accounting/kasbank/KasBankDataTable';
import { KasBankFormDialog } from '@/components/admin/accounting/kasbank/KasBankFormDialog';
import { useToast } from '@/hooks/use-toast';

export const Route = createFileRoute('/admin/_layout/accounting/kasbank/')({
  component: KasBankIndexPage,
});

function KasBankIndexPage() {
  const { t } = useTranslation(['accounting']);
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<IKasBankHeader | null>(null);

  const handleAdd = () => {
    setSelectedVoucher(null);
    setIsFormOpen(true);
  };

  const handleEdit = (voucher: IKasBankHeader) => {
    setSelectedVoucher(voucher);
    setIsFormOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
      </div>

      <KasBankDataTable onAdd={handleAdd} onEdit={handleEdit} />

      <KasBankFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editData={selectedVoucher}
        onSuccess={() => setIsFormOpen(false)}
      />
    </div>
  );
}