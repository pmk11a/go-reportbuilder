'use client';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { IKasBankHeader, ICreateKasBankPayload, KasBankTipe } from '@/domains/accounting/types/kasbank';
import { useCreateKasBank, useUpdateKasBank, useGenerateNoBukti, useLookupPerkiraan } from '@/domains/accounting/hooks/useKasBank';
import { useToast } from '@/shared/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/overlay/dialog';
import { Button } from '@/shared/ui/overlay/button';
import { Input } from '@/shared/ui/form/input';
import { Label } from '@/shared/ui/form/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/form/select';
import { Alert } from '@/shared/ui/feedback/alert';
import { SearchableSelect } from '@/shared/ui/form/searchable-select';
import { Show } from '@/shared/ui/layout/Render';
import { Plus, Trash2, Calculator } from 'lucide-react';

const TIPE_OPTIONS: KasBankTipe[] = ['BKM', 'BKK', 'BBM', 'BBK'];

const formSchema = z.object({
  tanggal: z.string().min(1),
  tipeTransHd: z.enum(['BKM', 'BKK', 'BBM', 'BBK']),
  perkiraanHd: z.string().min(1),
  note: z.string().optional(),
  details: z.array(z.object({
    perkiraan: z.string().min(1),
    lawan: z.string().optional(),
    debet: z.number().min(0).default(0),
    kredit: z.number().min(0).default(0),
    keterangan: z.string().optional(),
    valas: z.string().default(''),
    kurs: z.number().default(1),
  })).min(1),
}).refine((data) => {
  const sumDebet = data.details.reduce((s, d) => s + (d.debet ?? 0), 0);
  const sumKredit = data.details.reduce((s, d) => s + (d.kredit ?? 0), 0);
  return Math.abs(sumDebet - sumKredit) < 0.01;
}, {
  message: 'Total debit and credit must be equal',
  path: ['details'],
});

type FormValues = z.infer<typeof formSchema>;

interface KasBankFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: IKasBankHeader | null;
  onSuccess?: () => void;
}

export function KasBankFormDialog({ open, onOpenChange, editData, onSuccess }: KasBankFormDialogProps) {
  const { t } = useTranslation(['accounting', 'common']);
  const { toast } = useToast();
  const [selectedTipe, setSelectedTipe] = useState<KasBankTipe>('BKK');
  const [perkiraanSearch, setPerkiraanSearch] = useState('');

  const { data: noBuktiData } = useGenerateNoBukti(selectedTipe);
  const { data: perkiraanData } = useLookupPerkiraan(perkiraanSearch, true);

  const createMutation = useCreateKasBank(() => {
    toast({ title: t('messages.created'), variant: 'success' });
    onOpenChange(false);
    onSuccess?.();
  });

  const updateMutation = useUpdateKasBank(editData?.nobukti ?? '', () => {
    toast({ title: t('messages.updated'), variant: 'success' });
    onOpenChange(false);
    onSuccess?.();
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      tanggal: new Date().toISOString().split('T')[0],
      tipeTransHd: 'BKK',
      perkiraanHd: '',
      note: '',
      details: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'details' });
  const details = watch('details');

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          tanggal: editData.tanggal?.split('T')[0] ?? '',
          tipeTransHd: editData.tipetranshd as KasBankTipe,
          perkiraanHd: editData.perkiraanhd ?? '',
          note: editData.note,
          details: [],
        });
        setSelectedTipe(editData.tipetranshd as KasBankTipe);
      } else {
        reset({
          tanggal: new Date().toISOString().split('T')[0],
          tipeTransHd: 'BKK',
          perkiraanHd: '',
          note: '',
          details: [],
        });
        setSelectedTipe('BKK');
      }
    }
  }, [open, editData, reset]);

  const perkiraanOpts = (perkiraanData?.data?.items ?? []).map((p: { perkiraan: string; keterangan: string }) => ({
    value: p.perkiraan,
    label: `${p.perkiraan} - ${p.keterangan}`,
  }));

  const sumDebet = details.reduce((s, d) => s + (d.debet ?? 0), 0);
  const sumKredit = details.reduce((s, d) => s + (d.kredit ?? 0), 0);
  const isBalanced = Math.abs(sumDebet - sumKredit) < 0.01;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const apiError = createMutation.error ?? updateMutation.error;

  const onSubmit = (values: FormValues) => {
    const payload: ICreateKasBankPayload = {
      tanggal: values.tanggal,
      tipeTransHd: values.tipeTransHd,
      perkiraanHd: values.perkiraanHd,
      note: values.note ?? '',
      details: values.details.map((d) => ({
        perkiraan: d.perkiraan,
        lawan: d.lawan ?? '',
        debet: d.debet ?? 0,
        kredit: d.kredit ?? 0,
        keterangan: d.keterangan ?? '',
        valas: d.valas ?? '',
        kurs: d.kurs ?? 1,
      })),
    };

    if (editData) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? t('form.edit_title') : t('form.create_title')}</DialogTitle>
        </DialogHeader>

        <Show when={apiError}>
          <Alert variant="destructive">{String(apiError)}</Alert>
        </Show>

        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('fields.no_bukti')}</Label>
              <Input
                value={editData?.nobukti ?? noBuktiData?.data?.nobukti ?? ''}
                disabled
                className="bg-slate-50"
              />
            </div>
            <div>
              <Label htmlFor="tanggal">{t('fields.tanggal')} *</Label>
              <Input id="tanggal" type="date" {...register('tanggal')} />
              {errors.tanggal && <p className="text-xs text-rose-500 mt-1">{errors.tanggal.message as string}</p>}
            </div>
            <div>
              <Label htmlFor="tipe">{t('fields.tipe')} *</Label>
              <Select
                value={selectedTipe}
                onValueChange={(v) => {
                  setSelectedTipe(v as KasBankTipe);
                  setValue('tipeTransHd', v as KasBankTipe);
                }}
                disabled={!!editData}
              >
                <SelectTrigger id="tipe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPE_OPTIONS.map((tipe) => (
                    <SelectItem key={tipe} value={tipe}>{t(`tipe.${tipe.toLowerCase()}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('fields.perkiraan_hd')} *</Label>
              <SearchableSelect
                value={watch('perkiraanHd')}
                onValueChange={(v) => setValue('perkiraanHd', v)}
                options={perkiraanOpts}
                onSearchChange={setPerkiraanSearch}
                placeholder={t('fields.perkiraan')}
              />
              {errors.perkiraanHd && <p className="text-xs text-rose-500 mt-1">{errors.perkiraanHd.message as string}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="note">{t('fields.note')}</Label>
            <Input id="note" {...register('note')} placeholder={t('fields.note')} />
          </div>

          {/* Detail lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>{t('table.detail_title')} *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ perkiraan: '', lawan: '', debet: 0, kredit: 0, keterangan: '', valas: '', kurs: 1 })}
                disabled={editData?.locked}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t('actions.add_detail')}
              </Button>
            </div>

            <div className="space-y-2">
              {fields.length === 0 && (
                <p className="text-sm text-slate-500 py-4 text-center">{t('messages.no_detail_data')}</p>
              )}
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                  <div className="col-span-3">
                    <Label className="text-xs">{t('fields.perkiraan')}</Label>
                    <SearchableSelect
                      value={details[idx]?.perkiraan ?? ''}
                      onValueChange={(v) => setValue(`details.${idx}.perkiraan` as const, v)}
                      options={perkiraanOpts}
                      onSearchChange={setPerkiraanSearch}
                      placeholder={t('fields.perkiraan')}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">{t('fields.debet')}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={details[idx]?.debet ?? 0}
                      onChange={(e) => setValue(`details.${idx}.debet` as const, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">{t('fields.kredit')}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={details[idx]?.kredit ?? 0}
                      onChange={(e) => setValue(`details.${idx}.kredit` as const, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-xs">{t('fields.keterangan')}</Label>
                    <Input
                      value={details[idx]?.keterangan ?? ''}
                      onChange={(e) => setValue(`details.${idx}.keterangan` as const, e.target.value)}
                      placeholder={t('fields.keterangan')}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-rose-600"
                      onClick={() => remove(idx)}
                      disabled={editData?.locked}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Balance summary */}
            <div className="flex items-center justify-end gap-4 mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-slate-500" />
                <span className="text-sm">
                  {t('fields.total_d')}: <span className="font-mono font-semibold">{sumDebet.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-sm">
                  {t('fields.total_k')}: <span className="font-mono font-semibold">{sumKredit.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
                </span>
              </div>
              <Show when={!isBalanced && fields.length > 0}>
                <span className="text-xs text-rose-600 font-medium">{t('validation.balance_error')}</span>
              </Show>
              <Show when={isBalanced && fields.length > 0}>
                <span className="text-xs text-emerald-600 font-medium">Balanced</span>
              </Show>
            </div>
            {errors.details?.root && <p className="text-xs text-rose-500 mt-1">{errors.details.root.message as string}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={isPending || !isBalanced || fields.length === 0}>
              {isPending ? t('form.saving') : t('actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}