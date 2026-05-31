import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ISettingsNumbering } from '@/types/settings';
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

export function NumberingForm() {
  const { t } = useTranslation();
  const { useNumbering, useUpdateNumbering } = useSettings();
  const { data, isLoading } = useNumbering();
  const updateMutation = useUpdateNumbering();

  const form = useForm<ISettingsNumbering>({
    defaultValues: {
      alias: '',
      pemisah: 0,
      reset: 0,
      contoh: '',
    },
  });

  React.useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const onSubmit = (values: ISettingsNumbering) => {
    // Number inputs need to be properly parsed
    const formattedValues = {
      ...values,
      pemisah: Number(values.pemisah),
      reset: Number(values.reset),
    };
    updateMutation.mutate(formattedValues);
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>{t('settings.numbering_format', 'Numbering Format')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.alias', 'Alias')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Alias" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contoh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.example', 'Example Format')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Example" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pemisah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.separator', 'Separator')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.reset_type', 'Reset Type')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
