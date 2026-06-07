import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IKasBankHeader, IKasBankListParams, KasBankTipe } from '@/types/kasbank';
import { useKasBankList, useDeleteKasBank, useDownloadKasBankPdf } from '@/hooks/useKasBank';
import { useKasBankDetailList } from '@/hooks/useKasBankDetail';
import { Button } from '@/components/ui/overlay/button';
import { Input } from '@/components/ui/form/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/form/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/data/table';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { Each, Show } from '@/components/ui/layout/Render';
import { KasBankTypeBadge } from './KasBankTypeBadge';
import { KasBankDetailTable } from './KasBankDetailTable';
import { OtorisasiButton } from './OtorisasiButton';
import { Plus, Edit, Trash2, Search, RefreshCw, FileDown, ChevronDown, ChevronUp } from 'lucide-react';

interface KasBankDataTableProps {
  onAdd?: () => void;
  onEdit?: (voucher: IKasBankHeader) => void;
}

const TIPE_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: '', labelKey: 'filter.tipe_all' },
  { value: 'BKM', labelKey: 'tipe.bkm' },
  { value: 'BKK', labelKey: 'tipe.bkk' },
  { value: 'BBM', labelKey: 'tipe.bbm' },
  { value: 'BBK', labelKey: 'tipe.bbk' },
];

export function KasBankDataTable({ onAdd, onEdit }: KasBankDataTableProps) {
  const { t } = useTranslation(['accounting', 'common']);
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [tipe, setTipe] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const { page, setPage, limit, renderPagination } = usePagination(10);

  useEffect(() => { setPage(1); }, [debouncedSearch, tipe, dateFrom, dateTo]);

  const params: IKasBankListParams = {
    search: debouncedSearch,
    tipe: tipe || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    perPage: limit,
    sortBy: 'Tanggal',
    sortDir: 'desc',
  };

  const { data: response, isLoading, isFetching, refetch } = useKasBankList(params);
  const deleteMutation = useDeleteKasBank();
  const downloadPdf = useDownloadKasBankPdf('');

  const listData = response?.data;
  const vouchers: IKasBankHeader[] = listData?.items ?? [];
  const pagination = listData ?? { total: 0, page: 1, perPage: 10 };

  const handleDelete = (v: IKasBankHeader) => {
    if (confirm(t('messages.confirm_delete'))) {
      deleteMutation.mutate(v.nobukti, {
        onSuccess: () => toast({ title: t('messages.deleted'), variant: 'success' }),
        onError: () => toast({ title: t('messages.delete_error'), variant: 'destructive' }),
      });
    }
  };

  const handlePdf = (v: IKasBankHeader) => {
    downloadPdf.mutate(undefined, {
      onSuccess: () => {
        const url = URL.createObjectURL(new Blob());
        const a = document.createElement('a');
        a.href = url;
        a.download = `${v.nobukti}.pdf`;
        a.click();
      },
      onError: () => toast({ title: t('messages.pdf_error'), variant: 'destructive' }),
    });
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 overflow-hidden">
      {/* Filter bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('filter.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-white dark:bg-slate-950 rounded-r-none border-r-0 focus:z-10"
          />
        </div>
        <Select value={tipe} onValueChange={setTipe}>
          <SelectTrigger className="w-full lg:w-48 h-9 rounded-none border-r-0 bg-white dark:bg-slate-950">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder={t('filter.from')}
          className="w-full lg:w-40 h-9 bg-white dark:bg-slate-950 rounded-none border-r-0"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder={t('filter.to')}
          className="w-full lg:w-40 h-9 bg-white dark:bg-slate-950 rounded-none border-r-0"
        />
        <Button
          variant="secondary"
          size="sm"
          className="rounded-none h-9 px-4"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
        <Button size="sm" className="h-9 px-4 ml-auto" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('actions.add_new')}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>{t('headers.no_bukti')}</TableHead>
              <TableHead>{t('headers.tanggal')}</TableHead>
              <TableHead>{t('headers.tipe')}</TableHead>
              <TableHead>{t('headers.perkiraan')}</TableHead>
              <TableHead>{t('headers.note')}</TableHead>
              <TableHead className="text-right">{t('headers.total')}</TableHead>
              <TableHead>{t('headers.otorisasi')}</TableHead>
              <TableHead className="text-center">{t('headers.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show
              when={!isLoading}
              fallback={
                <Each of={Array.from({ length: 5 })}>
                  {() => (
                    <TableRow>
                      {Array.from({ length: 9 }).map((_, i) => (
                        <TableCell key={i}><Skeleton className="h-6 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  )}
                </Each>
              }
            >
              <Each
                of={vouchers}
                fallback={
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      {t('messages.no_data')}
                    </TableCell>
                  </TableRow>
                }
              >
                {(v) => (
                  <KasBankRow
                    voucher={v}
                    onDelete={handleDelete}
                    onEdit={onEdit}
                    onPdf={handlePdf}
                  />
                )}
              </Each>
            </Show>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        {renderPagination({ totalPages: Math.ceil(pagination.total / pagination.perPage), totalItems: pagination.total })}
      </div>
    </div>
  );
}

function KasBankRow({ voucher, onDelete, onEdit, onPdf }: {
  voucher: IKasBankHeader;
  onDelete: (v: IKasBankHeader) => void;
  onEdit?: (v: IKasBankHeader) => void;
  onPdf: (v: IKasBankHeader) => void;
}) {
  const { t } = useTranslation(['accounting', 'common']);
  const [expanded, setExpanded] = useState(false);
  const { data: detailResponse, isLoading: detailLoading } = useKasBankDetailList(expanded ? voucher.nobukti : '');
  const details = detailResponse?.data?.items ?? [];

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <TableCell className="w-8 text-center">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </TableCell>
        <TableCell className="font-mono text-sm">{voucher.nobukti}</TableCell>
        <TableCell>{voucher.tanggal ? new Date(voucher.tanggal).toLocaleDateString('id-ID') : '-'}</TableCell>
        <TableCell>
          <KasBankTypeBadge tipe={voucher.tipetranshd} />
        </TableCell>
        <TableCell className="text-sm">{voucher.perkiraanhd || '-'}</TableCell>
        <TableCell className="text-sm max-w-[200px] truncate">{voucher.note || '-'}</TableCell>
        <TableCell className="text-right font-mono">
          {voucher.totald.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <OtorisasiButton voucher={voucher} />
        </TableCell>
        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-1">
            <Show when={!voucher.locked && onEdit}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit!(voucher)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </Show>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600" onClick={() => onPdf(voucher)}>
              <FileDown className="h-3.5 w-3.5" />
            </Button>
            <Show when={!voucher.locked}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600" onClick={() => onDelete(voucher)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </Show>
          </div>
        </TableCell>
      </TableRow>
      <Show when={expanded}>
        <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableCell colSpan={9} className="p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{t('table.detail_title')}</p>
            <KasBankDetailTable details={details} isLoading={detailLoading} isLocked={voucher.locked} />
          </TableCell>
        </TableRow>
      </Show>
    </>
  );
}