import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ISettingsNumbering } from '@/domains/settings/types/settings';
import { useSettings } from '@/domains/settings/hooks/useSettings';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
  Skeleton,
  Card,
} from '@/shared/ui';
import { Save, Search, X } from 'lucide-react';

const SEPARATOR_MAP: Record<string, string> = {
  '1': '/',
  '2': '-',
  '3': '.',
  '4': ' ',
};

const CONFIG_KEYS = [
  'alias',
  'pemisah',
  'format1',
  'format2',
  'format3',
  'format4',
  'contoh',
  'reset',
  'noseri',
  'inicab',
  'digitNomor',
];

const FIELD_LABELS: Record<string, string> = {
  BKM: 'Kas Masuk',
  BKK: 'Kas Keluar',
  BBM: 'Bank Masuk',
  BBK: 'Bank Keluar',
  BMM: 'Bukti Memorial',
  BJK: 'Jurnal Koreksi',
  SO: 'Sales Order',
  SPP: 'Perintah Pengiriman',
  SPB: 'Pengiriman Barang',
  INV: 'Invoice Penjualan',
  RPJ: 'Retur Penjualan',
  PJL: 'Penjualan',
  PBL: 'Pembelian',
  BPPB: 'BPPB (Pengeluaran Barang)',
  BPSB: 'BPSB (Penyerahan Barang)',
  BBP: 'BBP (Bukti Barang)',
  BPB: 'BPB (Penerimaan Barang)',
  SPRK: 'SPRK (Permintaan)',
  BSPRK: 'Permintaan Barang',
  PPL: 'PPL (Permintaan)',
  BPL: 'BPL (Bukti Pembelian)',
  PO: 'Purchase Order',
  BPO: 'Bukti Purchase Order',
  BP: 'Bukti Pembelian',
  BPSPRK: 'Bukti SPRK',
  INS: 'Incentive',
  KNS: 'Konsinyasi',
  RPB: 'Retur Pembelian',
  SPG: 'Sales Promotion',
  OPN: 'Opname Stok',
  KMS: 'Komisi',
  RBPB: 'Retur BPB',
  ENQ: 'Enquiry',
  CR: 'Credit Note',
  RKL: 'Rekonsiliasi',
  SC: 'Service Charge',
  RSPB: 'Retur SPB',
  PNJ: 'Penunjang',
  TRC: 'Tracking',
  SHIP: 'Shipping',
  TBJ: 'Timbangan',
  RBJ: 'Retur Barang',
  TRS: 'Transfer',
  BHN: 'Bahan Baku',
  INVC: 'Invoice',
  SPR: 'SPK/Surat Perintah',
  KN: 'Kredit Note',
  PBS: 'Penerimaan',
  RPBS: 'Retur Penerimaan',
  POS: 'Point of Sale',
};

export function NumberingForm() {
  const { t } = useTranslation('numbering');
  const { useNumbering, useUpdateNumbering } = useSettings();
  const { data, isLoading } = useNumbering();
  const updateMutation = useUpdateNumbering();
  const [searchQuery, setSearchQuery] = React.useState('');

  const form = useForm<ISettingsNumbering>({
    defaultValues: {
      alias: '',
      pemisah: '1',
      format1: 0,
      format2: 1,
      format3: 4,
      format4: 2,
      contoh: '',
      reset: 1,
      noseri: '',
      inicab: '',
      digitNomor: '00000',
    },
  });

  const formatOptions = React.useMemo(() => [
    { label: t('format_options.sequence'), value: 0 },
    { label: t('format_options.transaction_code'), value: 1 },
    { label: t('format_options.company_initials'), value: 4 },
    { label: t('format_options.mmyyyy'), value: 2 },
    { label: t('format_options.mmyy'), value: 3 },
    { label: t('format_options.yy'), value: 5 },
    { label: t('format_options.none'), value: -1 },
  ], [t]);

  // Watch configuration fields to calculate Example preview reactively
  const watchedPemisah = useWatch({ control: form.control, name: 'pemisah' });
  const watchedFormat1 = useWatch({ control: form.control, name: 'format1' });
  const watchedFormat2 = useWatch({ control: form.control, name: 'format2' });
  const watchedFormat3 = useWatch({ control: form.control, name: 'format3' });
  const watchedFormat4 = useWatch({ control: form.control, name: 'format4' });
  const watchedInicab = useWatch({ control: form.control, name: 'inicab' });
  const watchedDigitNomor = useWatch({ control: form.control, name: 'digitNomor' });

  React.useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  // Reactive Contoh (Example) logic
  React.useEffect(() => {
    const getPart = (code: number | undefined, trans: string, ini: string, digits: string) => {
      if (code === undefined || code === -1) return '';
      switch (code) {
        case 0: return digits || '00000';
        case 1: return trans;
        case 4: return ini || 'PWT';
        case 2: return '032022'; // Example MMYYYY
        case 3: return '0322'; // Example MMYY
        case 5: return '22'; // Example YY
        default: return '';
      }
    };

    const sepStr = SEPARATOR_MAP[watchedPemisah || '1'] || '';
    const example = [watchedFormat1, watchedFormat2, watchedFormat3, watchedFormat4]
      .map(f => getPart(f, 'LPB', watchedInicab || 'PWT', watchedDigitNomor || '00000'))
      .filter(Boolean)
      .join(sepStr);

    form.setValue('contoh', example);
  }, [
    watchedPemisah,
    watchedFormat1,
    watchedFormat2,
    watchedFormat3,
    watchedFormat4,
    watchedInicab,
    watchedDigitNomor,
    form,
  ]);

  const onSubmit = (values: ISettingsNumbering) => {
    // Standardize numbers format fields before submitting
    const payload = {
      ...values,
      format1: Number(values.format1),
      format2: Number(values.format2),
      format3: Number(values.format3),
      format4: Number(values.format4),
      reset: Number(values.reset),
    };
    updateMutation.mutate(payload as any);
  };

  // Group dynamic keys parsed from API response
  const groupedFields = React.useMemo(() => {
    if (!data) return {};
    const groups: Record<string, { prefix?: string; counter?: string }> = {};

    Object.keys(data).forEach(key => {
      if (CONFIG_KEYS.includes(key)) return;

      // Normalize key by stripping "no" / "No" / "NO" from the front
      const base = key.replace(/^(no|No|NO)/, '').toUpperCase();
      if (!groups[base]) {
        groups[base] = {};
      }

      if (key.match(/^(no|No|NO)/)) {
        groups[base].counter = key;
      } else {
        groups[base].prefix = key;
      }
    });

    return groups;
  }, [data]);

  // Filter grouped fields based on search query
  const filteredGroups = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return groupedFields;

    const result: typeof groupedFields = {};
    Object.entries(groupedFields).forEach(([base, group]) => {
      const label = t('fields.' + base, FIELD_LABELS[base] || base).toLowerCase();
      const prefix = group.prefix?.toLowerCase() || '';
      const counter = group.counter?.toLowerCase() || '';

      if (
        base.toLowerCase().includes(query) ||
        label.includes(query) ||
        prefix.includes(query) ||
        counter.includes(query)
      ) {
        result[base] = group;
      }
    });
    return result;
  }, [groupedFields, searchQuery, t]);

  if (isLoading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-950/20">
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-950/20">
        <Button type="submit" form="numbering-form" loading={updateMutation.isPending} size="sm" className="gap-2">
          {!updateMutation.isPending && <Save size={14} />}
          {t('save_button')}
        </Button>
      </div>

      {/* Form Body */}
      <div className="p-6">
        <Form {...form}>
          <form id="numbering-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Kode Transaksi (Span 7) */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="p-6 bg-slate-50/40 dark:bg-slate-950/20 border border-slate-100 dark:border-white/5 shadow-inner">
                  
                  {/* Title and Search Filter */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b pb-4 border-slate-200/60 dark:border-slate-800">
                    <h5 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      {t('title')}
                    </h5>
                    
                    <div className="relative w-full sm:w-64">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder={t('search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 pr-8"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Scrollable grid container */}
                  <div className="max-h-[520px] overflow-y-auto pr-2 space-y-4 scrollbar-thin">
                    {Object.keys(filteredGroups).length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-sm font-semibold bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-white/5">
                        {t('no_results')}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(filteredGroups).map(([base, group]) => {
                          const label = t('fields.' + base, FIELD_LABELS[base] || base);
                          return (
                            <div
                              key={base}
                              className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm space-y-2 hover:border-primary-400/50 dark:hover:border-primary-500/30 transition-all duration-200"
                            >
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                {label} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-normal">({base})</span>
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {group.prefix && (
                                  <FormField
                                    control={form.control}
                                    name={group.prefix as any}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            placeholder={t('prefix')}
                                            {...field}
                                            value={field.value ?? ''}
                                            className="h-8 text-xs font-semibold"
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                )}
                                {group.counter && (
                                  <FormField
                                    control={form.control}
                                    name={group.counter as any}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            placeholder={t('counter')}
                                            {...field}
                                            value={field.value ?? ''}
                                            className="h-8 text-xs font-semibold font-mono"
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Column: Konfigurasi (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="p-6 bg-slate-50/40 dark:bg-slate-950/20 border border-slate-100 dark:border-white/5 shadow-inner">
                  <h5 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 border-b pb-2 border-slate-200/60 dark:border-slate-800">
                    {t('config_title')}
                  </h5>

                  <div className="space-y-4">
                    {/* Pemisah Dropdown */}
                    <FormField control={form.control} name="pemisah" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('separator')}</FormLabel>
                        <FormControl>
                          <select 
                            {...field}
                            value={field.value ?? '1'}
                            className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 dark:text-white transition-all font-semibold"
                          >
                            <option value="1">/</option>
                            <option value="2">-</option>
                            <option value="3">.</option>
                            <option value="4">[Space]</option>
                          </select>
                        </FormControl>
                      </FormItem>
                    )} />

                    {/* Format Nomor Transaksi Parameters */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">{t('format_title')}</span>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Format 1 */}
                        <FormField control={form.control} name="format1" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <select
                                {...field}
                                value={field.value ?? 0}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="w-full h-10 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none dark:text-white transition-all text-xs"
                              >
                                {formatOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                            </FormControl>
                          </FormItem>
                        )} />
                        {/* Format 2 */}
                        <FormField control={form.control} name="format2" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <select
                                {...field}
                                value={field.value ?? 1}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="w-full h-10 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none dark:text-white transition-all text-xs"
                              >
                                {formatOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                            </FormControl>
                          </FormItem>
                        )} />
                        {/* Format 3 */}
                        <FormField control={form.control} name="format3" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <select
                                {...field}
                                value={field.value ?? 4}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="w-full h-10 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none dark:text-white transition-all text-xs"
                              >
                                {formatOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                            </FormControl>
                          </FormItem>
                        )} />
                        {/* Format 4 */}
                        <FormField control={form.control} name="format4" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <select
                                {...field}
                                value={field.value ?? 2}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="w-full h-10 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none dark:text-white transition-all text-xs"
                              >
                                {formatOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                            </FormControl>
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    {/* Reset Dropdown */}
                    <FormField control={form.control} name="reset" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('reset')}</FormLabel>
                        <FormControl>
                          <select 
                            {...field}
                            value={field.value ?? 1}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 dark:text-white transition-all font-semibold"
                          >
                            <option value={1}>{t('reset_options.year')}</option>
                            <option value={0}>{t('reset_options.month')}</option>
                            <option value={2}>{t('reset_options.never')}</option>
                          </select>
                        </FormControl>
                      </FormItem>
                    )} />

                    {/* Contoh Preview Box */}
                    <FormField control={form.control} name="contoh" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('example')}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            readOnly 
                            className="bg-slate-150 dark:bg-slate-800/80 font-mono text-center font-bold text-primary-600 dark:text-primary-400 select-all" 
                          />
                        </FormControl>
                      </FormItem>
                    )} />

                    {/* No Seri Faktur Pajak */}
                    <FormField control={form.control} name="noseri" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('faktur_pajak')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan NOSERI" {...field} value={field.value ?? ''} />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>

                </Card>
              </div>

            </div>
          </form>
        </Form>
      </div>
    </Card>
  );
}
