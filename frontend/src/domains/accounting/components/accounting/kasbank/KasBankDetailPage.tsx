import { useTranslation } from 'react-i18next';
import { ChevronLeft, Edit2, Trash2, Download } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { IKasBankDetail } from '@/domains/accounting/types/kasbank';
import { useKasBankDetailList } from '@/domains/accounting/hooks/useKasBankDetail';
import { useDeleteKasBank, useDownloadKasBankPdf } from '@/domains/accounting/hooks/useKasBank';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/overlay/alert-dialog';
import { useState } from 'react';
import { Button } from '@/shared/ui/overlay/button';
import { Badge } from '@/shared/ui/overlay/badge';
import { Skeleton } from '@/shared/ui/feedback/skeleton';
import { Each, Show } from '@/shared/ui/layout/Render';
import { toast } from '@/shared/hooks/use-toast';
import { AuthLevelBadge } from './OtorisasiButton';
import { KasBankTypeBadge } from './KasBankTypeBadge';

/* ========================================================= */
/* Detail Page                                                */
/* ========================================================= */

export function KasBankDetailPage({ nobukti }: { nobukti: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation('accounting');
  const deleteMutation = useDeleteKasBank();
  const downloadPdf = useDownloadKasBankPdf(nobukti);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: voucherResponse, isLoading: loadingVoucher } = useKasBankDetailList(nobukti);
  const voucher = voucherResponse?.data?.header;
  const details = voucherResponse?.data?.items ?? [];

  const handleDelete = () => {
    deleteMutation.mutate(nobukti, {
      onSuccess: () => {
        toast({ title: t('messages.deleted') });
        navigate({ to: '/admin/accounting/kasbank' });
      },
      onError: () => {
        toast({ title: t('messages.delete_error'), variant: 'destructive' });
      },
    });
    setShowDeleteConfirm(false);
  };

  const handleDownloadPdf = () => {
    downloadPdf.mutate(undefined, {
      onSuccess: () => {
        toast({ title: t('messages.pdf_error'), variant: 'default' });
      },
      onError: () => {
        toast({ title: t('messages.pdf_error'), variant: 'destructive' });
      },
    });
  };

  const handleEdit = () => {
    navigate({ to: '/admin/accounting/kasbank', search: { editNobukti: nobukti } });
  };

  if (loadingVoucher) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Bukti {nobukti} tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-blue-500/5 dark:border-white/5 dark:bg-[#0f172a] dark:shadow-2xl">
      <div className="p-4 sm:p-6">
      {/* Top Bar */}
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/admin/accounting/kasbank' })}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('actions.cancel')}
          </Button>
          <div>
            <h1 className="text-lg font-semibold sm:text-xl">
              {t('kasbank.detail_title', { nobukti: nobukti })}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!voucher.locked && (
            <>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit2 className="h-4 w-4 mr-1" />
                {t('actions.edit')}
              </Button>
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('actions.delete')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('actions.delete')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('messages.confirm_delete', { nobukti })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      {t('actions.confirm_auth')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-1" />
            {t('actions.pdf')}
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-lg border bg-card p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('headers.no_bukti')}
            </span>
            <p className="font-mono text-sm font-semibold">{voucher.nobukti}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('headers.tanggal')}
            </span>
            <p className="text-sm font-medium">
              {voucher.tanggal
                ? new Date(voucher.tanggal).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : '-'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('headers.tipe')}
            </span>
            <KasBankTypeBadge tipe={voucher.tipetranshd} />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('headers.perkiraan')}
            </span>
            <p className="text-sm font-medium">{voucher.perkiraanhd || '-'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('headers.note')}
            </span>
            <p className="text-sm font-medium">{voucher.note || '-'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('headers.status')}
            </span>
            <Badge variant={voucher.locked ? 'secondary' : 'outline'}>
              {voucher.locked ? t('otorisasi.locked') : t('otorisasi.pending')}
            </Badge>
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-md bg-slate-50 dark:bg-slate-900/50 p-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('headers.jumlah_valas')}</p>
            <p className="font-mono text-lg font-semibold tabular-nums">
              {Number(voucher.jumlahvalas ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('headers.jumlah_rupiah')}</p>
            <p className="font-mono text-lg font-semibold tabular-nums">
              Rp {Number(voucher.jumlahrupiah ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Authorization Section */}
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide text-foreground">
          {t('headers.authorization')}
        </h3>
        <div className="space-y-3">
          {Array.from({ length: voucher.maxol }, (_, i) => i + 1).map((level) => {
            const levelNum = level as 1 | 2 | 3 | 4 | 5;
            return (
              <div key={`auth-${levelNum}`} className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-[140px] shrink-0">
                  {t('otorisasi.level', { level: levelNum })}
                </span>
                <AuthLevelBadge voucher={voucher} level={levelNum} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Lines Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="p-4 sm:p-6 pb-0 sm:pb-0">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t('table.detail_title')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">
                  {t('fields.perkiraan')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('fields.keterangan')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('fields.debet')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('fields.kredit')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <Show when={details.length === 0}>
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 sm:px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    {t('messages.no_detail_data')}
                  </td>
                </tr>
              </Show>
              <Each of={details}>
                {(item: IKasBankDetail) => (
                  <tr key={item.urut} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 sm:px-6 py-3 font-mono text-xs font-medium">{item.perkiraan}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm">{item.keterangan || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 text-right font-mono text-sm tabular-nums text-emerald-600 dark:text-emerald-400">
                      {item.debet
                        ? Number(item.debet).toLocaleString('id-ID', { minimumFractionDigits: 2 })
                        : '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right font-mono text-sm tabular-nums text-red-600 dark:text-red-400">
                      {item.kredit
                        ? Number(item.kredit).toLocaleString('id-ID', { minimumFractionDigits: 2 })
                        : '-'}
                    </td>
                  </tr>
                )}
              </Each>
            </tbody>
            {/* Totals Footer */}
            <tfoot className="border-t bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <td colSpan={2} className="px-4 sm:px-6 py-3 text-right text-sm font-semibold">
                  Total
                </td>
                <td className="px-4 sm:px-6 py-3 text-right font-mono text-sm font-semibold tabular-nums">
                  {details
                    .reduce((sum, item) => sum + (Number(item.debet) || 0), 0)
                    .toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 sm:px-6 py-3 text-right font-mono text-sm font-semibold tabular-nums">
                  {details
                    .reduce((sum, item) => sum + (Number(item.kredit) || 0), 0)
                    .toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
