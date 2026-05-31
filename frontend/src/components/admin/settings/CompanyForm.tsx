import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ISettingsCompany } from '@/types/settings';
import { useSettings } from '@/hooks/useSettings';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from '@/components/ui';

export function CompanyForm() {
  const { t } = useTranslation();
  const { useCompany, useUpdateCompany } = useSettings();
  const { data, isLoading } = useCompany();
  const updateMutation = useUpdateCompany();

  const form = useForm<ISettingsCompany>({
    defaultValues: {
      kode: '',
      nama: '',
      alamat: '',
      kota: '',
      kodepos: '',
      telepon: '',
      email: '',
    },
  });

  React.useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const onSubmit = (values: ISettingsCompany) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>{t('settings.company_profile', 'Company Profile')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.code', 'Code')}</FormLabel>
                    <FormControl>
                      <Input placeholder="01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.name', 'Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alamat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.address', 'Address')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.city', 'City')}</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              {t('common.save', 'Save Changes')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
