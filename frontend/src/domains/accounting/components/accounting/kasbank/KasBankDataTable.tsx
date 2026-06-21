import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IKasBankHeader, IKasBankListParams, KasBankTipe } from '@/domains/accounting/types/kasbank';
import { useKasBankList, useDeleteKasBank, useDownloadKasBankPdf } from '@/domains/accounting/hooks/useKasBank';
import { useGetPeriode } from '@/domains/berkas/hooks/useBerkas';
import { Button } from '@/shared/ui/overlay/button';
import { Input } from '@/shared/ui/form/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/form/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/data/table';
import { Skeleton } from '@/shared/ui/feedback/skeleton';
import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { usePagination } from '@/shared/hooks/usePagination';
import { Each, Show } from '@/shared/ui/layout/Render';
import { KasBankTypeBadge } from './KasBankTypeBadge';
import { OtorisasiButton, AuthLevelCell, TOtorisasiLevel } from './OtorisasiButton';
import { Eye, Plus, Edit, Trash2, Search, RefreshCw, FileDown } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface KasBankDataTableProps {
  onAdd?: () => void;
  onEdit?: (voucher: IKasBankHeader) => void;
}

const TIPE_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: 'all', labelKey: 'filter.tipe_all' },
  { value: 'BKM', labelKey: 'tipe.bkm' },
  { value: 'BKK', labelKey: 'tipe.bkk' },
  { value: 'BBM', labelKey: 'tipe.bbm' },
  { value: 'BBK', labelKey: 'tipe.bbk' },
];

/** Formats a Date as yyyy-MM-dd for native `<input type="date">` values. */
function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes the first/last day of the month for a DBPERIODE (BULAN/TAHUN) pair.
 * BULAN/TAHUN are stored zero-padded (e.g. "01".."12" / "2026") but parsed
 * defensively here since callers only guarantee non-empty strings.
 * Returns null when bulan/tahun do not resolve to a valid calendar month.
 */
function resolvePeriodeRange(bulan: string, tahun: string): { from: string; to: string } | null {
  const month = parseInt(bulan, 10);
  const year = parseInt(tahun, 10);
  if (!month || !year || month < 1 || month > 12) {
    return null;
  }
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  return { from: formatDateInput(from), to: formatDateInput(to) };
}

export function KasBankDataTable({ onAdd, onEdit }: KasBankDataTableProps) {
  const { t } = useTranslation(['accounting', 'common']);
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [tipe, setTipe] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const { page, setPage, limit, renderPagination } = usePagination(10);
  const { data: periodeData } = useGetPeriode();
  const hasAppliedPeriodeDefault = useRef(false);

  // Default dateFrom/dateTo to the user's active accounting period (DBPERIODE)
  // once, on first load. Once applied (or once the user edits a date filter
  // manually), never override the inputs again.
  useEffect(() => {
    if (hasAppliedPeriodeDefault.current) return;
    if (!periodeData?.BULAN || !periodeData?.TAHUN) return;

    const range = resolvePeriodeRange(periodeData.BULAN, periodeData.TAHUN);
    hasAppliedPeriodeDefault.current = true;
    if (range) {
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  }, [periodeData]);

  const handleDateFromChange = (value: string) => {
    hasAppliedPeriodeDefault.current = true;
    setDateFrom(value);
  };

  const handleDateToChange = (value: string) => {
    hasAppliedPeriodeDefault.current = true;
    setDateTo(value);
  };

  useEffect(() => { setPage(1); }, [debouncedSearch, tipe, dateFrom, dateTo]);

  const params: IKasBankListParams = {
    search: debouncedSearch,
    tipe: tipe === 'all' ? undefined : tipe as KasBankTipe,
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

  // Compute the maximum maxol across all vouchers for consistent column count
  const maxOtorisasi = vouchers.length > 0 ? Math.max(...vouchers.map(v => v.maxol ?? 2)) : 2;

  const authHeaders = Array.from({ length: maxOtorisasi }, (_, i) => i + 1).map(level => (
    <TableHead key={`auth-hdr-${level}`} className="text-center min-w-[80px] w-[80px]">
      Authorized {level}
    </TableHead>
  ));

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-blue-500/5 dark:border-white/5 dark:bg-[#0f172a] dark:shadow-2xl">
      {/* Filter bar */}
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-800 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t('filter.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 bg-white pl-9 text-sm dark:bg-slate-950"
            />
          </div>
          <Select value={tipe} onValueChange={setTipe}>
            <SelectTrigger className="h-9 w-full bg-white text-sm dark:bg-slate-950 sm:w-52">
              <SelectValue placeholder={t('filter.tipe_all')} />
            </SelectTrigger>
            <SelectContent>
              <Each of={TIPE_OPTIONS}>
                {(option) => (
                  <SelectItem value={option.value}>{t(option.labelKey)}</SelectItem>
                )}
              </Each>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            aria-label={t('filter.from')}
            className="h-9 w-full bg-white text-sm dark:bg-slate-950 sm:w-40"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            aria-label={t('filter.to')}
            className="h-9 w-full bg-white text-sm dark:bg-slate-950 sm:w-40"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {t('actions.refresh')}
          </Button>
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.add_new')}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[130px]">{t('headers.no_bukti')}</TableHead>
              <TableHead className="min-w-[90px]">{t('headers.tanggal')}</TableHead>
              <TableHead className="min-w-[60px] w-[60px]">{t('headers.tipe')}</TableHead>
              <TableHead className="min-w-[80px] w-[80px]">{t('headers.perkiraan')}</TableHead>
              <TableHead>{t('headers.note')}</TableHead>
              <TableHead className="text-right">{t('headers.jumlah_valas')}</TableHead>
              <TableHead className="text-right">{t('headers.jumlah_rupiah')}</TableHead>
              {authHeaders}
              <TableHead className="text-center w-32">{t('headers.actions')}</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            <Show
              when={!isLoading}
              fallback={
                <Each of={Array.from({ length: 5 })}>
                  {() => (
                    <TableRow>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <Each of={Array.from({ length: maxOtorisasi }, (_, i) => i)}>
                        {(i: number) => (
                          <TableCell key={i}><Skeleton className="h-6 w-full" /></TableCell>
                        )}
                      </Each>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                  )}
                </Each>
              }
            >
              <Each
                of={vouchers}
                fallback={
                  <TableRow>
                    <TableCell colSpan={8 + maxOtorisasi} className="text-center py-12 text-slate-500">
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

/* ========================================================= */
/* Row                                                          */
/* ========================================================= */

function KasBankRow({ voucher, onDelete, onEdit, onPdf }: {
  voucher: IKasBankHeader;
  onDelete: (v: IKasBankHeader) => void;
  onEdit?: (v: IKasBankHeader) => void;
  onPdf: (v: IKasBankHeader) => void;
}) {
  const { t } = useTranslation(['accounting', 'common']);

  return (
    <TableRow>
      {/* No Bukti — linked to detail page */}
      <TableCell className="whitespace-nowrap font-mono text-sm font-medium text-slate-800 dark:text-slate-200">
        <Link
          to="/admin/accounting/kasbank/$nobukti"
          params={{ nobukti: voucher.nobukti }}
          className="hover:text-blue-600 transition-colors"
        >
          {voucher.nobukti}
        </Link>
      </TableCell>

      {/* Tanggal */}
      <TableCell>{voucher.tanggal ? new Date(voucher.tanggal).toLocaleDateString('id-ID') : '-'}</TableCell>

      {/* Tipe */}
      <TableCell>
        <KasBankTypeBadge tipe={voucher.tipetranshd} />
      </TableCell>

      {/* Perkiraan */}
      <TableCell className="text-sm">{voucher.perkiraanhd || '-'}</TableCell>

      {/* Keterangan */}
      <TableCell className="max-w-60 truncate text-sm" title={voucher.note || undefined}>{voucher.note || '-'}</TableCell>

      {/* Valas */}
      <TableCell className="text-right font-mono">
        {Number(voucher.jumlahvalas ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
      </TableCell>

      {/* Rupiah */}
      <TableCell className="text-right font-mono">
        {Number(voucher.jumlahrupiah ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
      </TableCell>

      {/* --- Dynamic Authorized N / User N / Date N columns --- */}
      <Each of={Array.from({ length: voucher.maxol ?? 2 }, (_, i) => i + 1)}>
        {(level: number) => {
          const levelNum = level as TOtorisasiLevel;
          return (
            <AuthLevelCell
              key={`auth-${level}`}
              voucher={voucher}
              level={levelNum}
            />
          );
        }}
      </Each>

      {/* Actions */}
      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-1">
          <Link
            to="/admin/accounting/kasbank/$nobukti"
            params={{ nobukti: voucher.nobukti }}
          >
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600">
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Show when={!voucher.locked && onEdit}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit!(voucher)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </Show>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-violet-600" onClick={() => onPdf(voucher)}>
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
  );
}
