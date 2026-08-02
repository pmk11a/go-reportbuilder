import  { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/overlay/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form/form'
import { Input } from '@/shared/ui/form/input'
import { Checkbox } from '@/shared/ui/form/checkbox'
import { Button } from '@/shared/ui/overlay/button'
import { useUpdateReport } from '@/domains/reports/hooks/useReport'
import type { IReportConfig } from '@/domains/reports/types'
import { useToast } from '@/shared/hooks/use-toast'

const updateReportSchema = z.object({
  nama_laporan: z.string().min(1, 'Nama laporan harus diisi'),
  deskripsi: z.string().optional(),
  status_aktif: z.boolean(),
})

type FormValues = z.infer<typeof updateReportSchema>

interface ReportFormModalProps {
  isOpen: boolean
  onClose: () => void
  report: IReportConfig
}

export function ReportFormModal({ isOpen, onClose, report }: ReportFormModalProps) {
  const updateReport = useUpdateReport()
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(updateReportSchema),
    defaultValues: {
      nama_laporan: report.nama_laporan,
      deskripsi: report.deskripsi || '',
      status_aktif: report.status_aktif,
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        nama_laporan: report.nama_laporan,
        deskripsi: report.deskripsi || '',
        status_aktif: report.status_aktif,
      })
    }
  }, [isOpen, report, form])

  const onSubmit = (values: FormValues) => {
    updateReport.mutate(
      { id: report.id_laporan, payload: values },
      {
        onSuccess: () => {
          toast({ title: 'Laporan berhasil diperbarui', variant: 'success' })
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Laporan</DialogTitle>
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
                    <Input placeholder="Deskripsi opsional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status_aktif"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Status Aktif</FormLabel>
                    <p className="text-sm text-slate-500">
                      Apakah laporan ini dapat diakses oleh user?
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" loading={updateReport.isPending}>
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
