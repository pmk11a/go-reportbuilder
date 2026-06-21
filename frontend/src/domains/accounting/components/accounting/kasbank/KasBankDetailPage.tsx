import { useTranslation } from 'react-i18next';
import { ChevronLeft, Edit2, Trash2, Download } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { IKasBankHeader, IKasBankDetail } from '@/domains/accounting/types/kasbank';
import { useKasBankDetailList } from '@/domains/accounting/hooks/useKasBankDetail';
import { useDeleteKasBank } from '@/domains/accounting/hooks/useKasBank';
import { useQueryClient } from '@tanstack/react-query';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/shared/ui/overlay/alert-dialog';
import { useState } from 'react';
import { Button } from '@/shared/ui/overlay/button';
import { Badge } from '@/shared/ui/overlay/badge';
import { Skeleton } from '@/shared/ui/feedback/skeleton';
import { Each, Show } from '@/shared/ui/layout/Render';
import { toast } from '@/shared/hooks/use-toast';
import { AuthLevelCell } from './OtorisasiButton';
import { KasBankTypeBadge } from './KasBankTypeBadge';

/* ========================================================= */
/* Detail Page                                                    */
/* ========================================================= */

export function KasBankDetailPage({ nobukti }: { nobukti: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation(['accounting', 'common']);
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteKasBank(() => {
    queryClient.invalidateQueries({ queryKey: ['kasbank'] });
    navigate({ to: '/admin/accounting/kasbank' });
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: voucherResponse, isLoading: loadingVoucher } = useKasBankDetailList(nobukti);
  const voucher = voucherResponse?.data?.header;
  const details = voucherResponse?.data?.items ?? [];

  const handleDelete = () => {
    deleteMutation.mutate(nobukti);
    setShowDeleteConfirm(false);
  };

  if (loadingVoucher) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (!voucher) {
    return <div className="p-4 text-red-500">Voucher tidak ditemukan</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/admin/accounting/kasbank' })}>
          <ChevronLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{t('kasbank.detail_title', { nobukti })}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/accounting/kasbank' })}>
            <Edit2 className="h-4 w-4 mr-1" />
            {t('actions.edit')}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            {t('actions.download_pdf')}
          </Button>
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                {t('actions.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('confirm.delete_title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('kasbank.confirm_delete', { nobukti })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{t('common.confirm')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">{t('headers.no_bukti')}</span>
            <p className="font-mono text-sm font-medium">{voucher.nobukti}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('headers.tanggal')}</span>
            <p className="text-sm">{voucher.tanggal ? new Date(voucher.tanggal).toLocaleDateString('id-ID') : '-'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('headers.tipe')}</span>
            <KasBankTypeBadge tipe={voucher.tipetranshd} />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('headers.perkiraan')}</span>
            <p className="text-sm">{voucher.perkiraanhd || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('headers.note')}</span>
            <p className="text-sm">{voucher.note || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('headers.status')}</span>
            {voucher.locked ? (
              <Badge variant="secondary">{t('otorisasi.locked')}</Badge>
            ) : (
              <Badge variant="outline">{t('kasbank.pending')}</Badge>
            )}
          </div>
        </div>

        {/* Amounts */}
        <div className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-slate-900/50 p-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('headers.jumlah_valas')}</p>
            <p className="font-mono text-lg font-semibold">
              {Number(voucher.jumlahvalas ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('headers.jumlah_rupiah')}</p>
            <p className="font-mono text-lg font-semibold">
              {Number(voucher.jumlahrupiah ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Authorization Section */}
      <div className="rounded-lg border p-4">
        <h3 className="text-base font-semibold mb-3">{t('headers.authorization')}</h3>
        <div className="space-y-2">
          {Array.from({ length: voucher.maxol }, (_, i) => i + 1).map(level => {
            const levelNum = level as 1 | 2 | 3 | 4 | 5;
            return (
              <div key={`auth-${levelNum}`} className="flex items-center gap-2">
                <span className="text-sm font-medium w-20">Authorized {levelNum}:</span>
                <AuthLevelCell voucher={voucher} level={levelNum} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Lines Table */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-base font-semibold">{t('table.detail_lines')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-2 text-left">{t('headers.coa')}</th>
                <th className="px-4 py-2 text-left">{t('headers.deskripsi')}</th>
                <th className="px-4 py-2 text-right">{t('headers.debit')}</th>
                <th className="px-4 py-2 text-right">{t('headers.kredit')}</th>
              </tr>
            </thead>
            <tbody>
              <Each of={details}>
                {(item: IKasBankDetail) => (
                  <tr key={item.urut} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{item.perkiraan}</td>
                    <td className="px-4 py-2">{item.keterangan || '-'}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {item.debet ? Number(item.debet).toLocaleString('id-ID', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {item.kredit ? Number(item.kredit).toLocaleString('id-ID', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                  </tr>
                )}
              </Each>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
