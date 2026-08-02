import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/data/table';
import { Skeleton } from '@/shared/ui/feedback/skeleton';
import { Each, Show } from '@/shared/ui/layout/Render';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/overlay/button';
import type { IKasBankDetail } from '@/domains/accounting/types/kasbank';

interface KasBankDetailTableProps {
  details: IKasBankDetail[];
  isLoading?: boolean;
  isLocked?: boolean;
  onEdit?: (detail: IKasBankDetail) => void;
  onDelete?: (detail: IKasBankDetail) => void;
}

export function KasBankDetailTable({ details, isLoading, isLocked, onEdit, onDelete }: KasBankDetailTableProps) {
  const { t } = useTranslation(['accounting', 'common']);

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">{t('fields.no_urut')}</TableHead>
            <TableHead>{t('fields.perkiraan')}</TableHead>
            <TableHead>{t('fields.lawan')}</TableHead>
            <TableHead>{t('fields.keterangan')}</TableHead>
            <TableHead className="text-right">{t('fields.debet')}</TableHead>
            <TableHead className="text-right">{t('fields.kredit')}</TableHead>
            <Show when={!isLocked}>
              <TableHead className="w-20 text-center">{t('headers.actions')}</TableHead>
            </Show>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Each
            of={details}
            fallback={
              <TableRow>
                <TableCell colSpan={isLocked ? 6 : 7} className="text-center py-6 text-slate-500">
                  {t('messages.no_detail_data')}
                </TableCell>
              </TableRow>
            }
          >
            {(detail) => (
              <TableRow>
                <TableCell className="font-medium">{detail.urut}</TableCell>
                <TableCell>{detail.perkiraan}</TableCell>
                <TableCell>{detail.lawan || '-'}</TableCell>
                <TableCell>{detail.keterangan || '-'}</TableCell>
                <TableCell className="text-right font-mono">
                  {Number(detail.debet ?? 0) > 0 ? Number(detail.debet).toLocaleString('id-ID', { minimumFractionDigits: 2 }) : '-'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {Number(detail.kredit ?? 0) > 0 ? Number(detail.kredit).toLocaleString('id-ID', { minimumFractionDigits: 2 }) : '-'}
                </TableCell>
                <Show when={!isLocked}>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit?.(detail)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600" onClick={() => onDelete?.(detail)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </Show>
              </TableRow>
            )}
          </Each>
        </TableBody>
      </Table>
    </div>
  );
}
