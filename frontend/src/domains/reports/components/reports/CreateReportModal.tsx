import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/overlay/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form/form'
import { Input } from '@/shared/ui/form/input'
import { Checkbox } from '@/shared/ui/form/checkbox'
import { Button } from '@/shared/ui/overlay/button'
import { SearchableSelect } from '@/shared/ui/form/searchable-select'
import { useAvailableKodeMenu, useCreateReport } from '@/domains/reports/hooks/useReport'

const createReportSchema = z.object({
  nama_laporan: z.string().min(1, 'Nama laporan harus diisi'),
  deskripsi: z.string().optional(),
  KODEMENU: z.string().min(1, 'Menu Item harus dipilih'),
  status_aktif: z.boolean(),
})

type FormValues = z.infer<typeof createReportSchema>

interface CreateReportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateReportModal({ isOpen, onClose }: CreateReportModalProps) {
  const { data: availableMenus, isLoading: isLoadingMenus } = useAvailableKodeMenu()
  const createReport = useCreateReport()

  const form = useForm<FormValues>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      nama_laporan: '',
      deskripsi: '',
      KODEMENU: '',
      status_aktif: true,
    },
  })

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        nama_laporan: '',
        deskripsi: '',
        KODEMENU: '',
        status_aktif: true,
      })
    }
  }, [isOpen, form])

  const onSubmit = (values: FormValues) => {
    createReport.mutate(values, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  // Format options for SearchableSelect
  const menuOptions = React.useMemo(() => {
    return availableMenus?.map(menu => ({
      value: menu.KODEMENU,
      label: `${menu.KODEMENU} — ${menu.Keterangan}`
    })) || []
  }, [availableMenus])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Laporan Baru</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="nama_laporan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Laporan <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Nama Laporan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deskripsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Input placeholder="Deskripsi singkat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="KODEMENU"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu Item (KODEMENU) <span className="text-red-500">*</span></FormLabel>
                  <SearchableSelect 
                    value={field.value} 
                    onValueChange={field.onChange}
                    options={menuOptions}
                    placeholder="-- Pilih Menu Item --"
                    searchPlaceholder="Cari Menu Item..."
                    disabled={isLoadingMenus}
                  />
                  <FormMessage />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pilih menu item yang belum terhubung ke laporan lain</p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status_aktif"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Aktif
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={createReport.isPending}>
                Batal
              </Button>
              <Button type="submit" disabled={createReport.isPending || isLoadingMenus}>
                {createReport.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
