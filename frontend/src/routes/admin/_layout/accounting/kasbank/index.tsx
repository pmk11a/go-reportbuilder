import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { IKasBankHeader } from '@/domains/accounting/kasbank';
import { KasBankDataTable } from '@/domains/accounting/components/accounting/kasbank/KasBankDataTable';
import { KasBankFormDialog } from '@/domains/accounting/components/accounting/kasbank/KasBankFormDialog';

export const Route = createFileRoute('/admin/_layout/accounting/kasbank/')({
  component: KasBankIndexPage,
});

function KasBankIndexPage() {
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
    <div className="w-full">
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
