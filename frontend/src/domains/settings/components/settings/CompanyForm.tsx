import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ISettingsCompany } from '@/domains/settings/types/settings';
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
  Tabs,
  FileUpload,
} from '@/shared/ui';
import { Save } from 'lucide-react';

export function CompanyForm() {
  const { t } = useTranslation('company');
  const { useCompany, useUpdateCompany } = useSettings();
  const { data, isLoading } = useCompany();
  const updateMutation = useUpdateCompany();

  const form = useForm<ISettingsCompany>({
    defaultValues: {
      nama: '',
      alamat1: '',
      alamat2: '',
      kota: '',
      telpon: '',
      fax: '',
      email: '',
      direksi: '',
      jabatan: '',
      namapkp: '',
      alamatpkp1: '',
      alamatpkp2: '',
      kotapkp: '',
      npwp: '',
      tglpengukuhan: '',
      namapkp1: '',
      alamatpkp21: '',
      alamatpkp22: '',
      kotapkp1: '',
      npwp1: '',
      tglpengukuhan1: '',
      logo: '',
      ttd: '',
    },
  });

  React.useEffect(() => {
    if (data) {
      const formattedData = {
        ...data,
        tglpengukuhan: data.tglpengukuhan ? data.tglpengukuhan.split('T')[0] : '',
        tglpengukuhan1: data.tglpengukuhan1 ? data.tglpengukuhan1.split('T')[0] : '',
      };
      form.reset(formattedData);
    }
  }, [data, form]);

  const onSubmit = (values: ISettingsCompany) => {
    // Format dates to ISO strings before submitting
    const payload = {
      ...values,
      tglpengukuhan: values.tglpengukuhan ? new Date(values.tglpengukuhan).toISOString() : undefined,
      tglpengukuhan1: values.tglpengukuhan1 ? new Date(values.tglpengukuhan1).toISOString() : undefined,
    };
    updateMutation.mutate(payload as any);
  };

  const npwpTabs = React.useMemo(() => [
    {
      label: 'NPWP1',
      value: 'npwp1',
      content: (
        <div className="space-y-4 p-6 animate-in fade-in-50 duration-200">
          <FormField control={form.control} name="namapkp" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('pkp_name')}</FormLabel>
              <FormControl><Input placeholder={t('pkp_name_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="space-y-2">
            <FormField control={form.control} name="alamatpkp1" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pkp_address')}</FormLabel>
                <FormControl><Input placeholder={t('pkp_address_line1_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="alamatpkp2" render={({ field }) => (
              <FormItem>
                <FormControl><Input placeholder={t('pkp_address_line2_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="npwp" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('npwp')}</FormLabel>
              <FormControl><Input placeholder={t('npwp_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="kotapkp" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('npwp_city')}</FormLabel>
                <FormControl><Input placeholder={t('npwp_city_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="tglpengukuhan" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('npwp_date')}</FormLabel>
                <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="direksi" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('signatory')}</FormLabel>
                <FormControl><Input placeholder={t('signatory_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="jabatan" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('position')}</FormLabel>
                <FormControl><Input placeholder={t('position_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <FormField control={form.control} name="ttd" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('signature')}</FormLabel>
                <FormControl>
                  <FileUpload
                    variant="dropzone"
                    accept="image/*"
                    value={field.value ?? ''}
                    onChange={(base64) => field.onChange(base64)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="logo" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('logo')}</FormLabel>
                <FormControl>
                  <FileUpload
                    variant="dropzone"
                    accept="image/*"
                    value={field.value ?? ''}
                    onChange={(base64) => field.onChange(base64)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
      ),
    },
    {
      label: 'NPWP2',
      value: 'npwp2',
      content: (
        <div className="space-y-4 p-6 animate-in fade-in-50 duration-200">
          <FormField control={form.control} name="namapkp1" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('pkp_name')} 2</FormLabel>
              <FormControl><Input placeholder={t('pkp_name2_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="space-y-2">
            <FormField control={form.control} name="alamatpkp21" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pkp_address')} 2</FormLabel>
                <FormControl><Input placeholder={t('pkp_address2_line1_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="alamatpkp22" render={({ field }) => (
              <FormItem>
                <FormControl><Input placeholder={t('pkp_address2_line2_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="npwp1" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('npwp')} 2</FormLabel>
              <FormControl><Input placeholder={t('npwp2_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="kotapkp1" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('npwp_city')} 2</FormLabel>
                <FormControl><Input placeholder={t('npwp2_city_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="tglpengukuhan1" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('npwp2_date')}</FormLabel>
                <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
      ),
    },
  ], [form, t]);

  if (isLoading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-950/20">
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-100 dark:border-white/5 shadow-xl shadow-blue-500/5 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-950/20">
        <Button type="submit" form="company-form" loading={updateMutation.isPending} size="sm" className="gap-2">
          {!updateMutation.isPending && <Save size={14} />}
          {t('save_button')}
        </Button>
      </div>

      {/* Form Body */}
      <div className="p-6">
        <Form {...form}>
          <form id="company-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Perusahaan (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <h5 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 border-b pb-2 border-slate-100 dark:border-slate-800">
                    {t('title')}
                  </h5>
                  <div className="space-y-4">
                    <FormField control={form.control} name="nama" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('name')}</FormLabel>
                        <FormControl><Input placeholder={t('name_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="space-y-4">
                      <FormField control={form.control} name="alamat1" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('address')}</FormLabel>
                          <FormControl><Input placeholder={t('address_line1_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="alamat2" render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder={t('address_line2_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="kota" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('city')}</FormLabel>
                        <FormControl><Input placeholder={t('city_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('email')}</FormLabel>
                        <FormControl><Input type="email" placeholder={t('email_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="telpon" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('phone')}</FormLabel>
                          <FormControl><Input placeholder={t('phone_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="fax" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('fax')}</FormLabel>
                          <FormControl><Input placeholder={t('fax_placeholder')} {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacer / Border */}
              <div className="hidden lg:block w-[1px] bg-slate-200 dark:bg-slate-800 self-stretch my-2" />

              {/* Right Column: Tabbed NPWP1 / NPWP2 (Span 6) */}
              <div className="lg:col-span-6">
                <Tabs tabs={npwpTabs} defaultValue="npwp1" />
              </div>

            </div>
          </form>
        </Form>
      </div>
    </Card>
  );
}
