import  { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/overlay/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form/form'
import { Input } from '@/shared/ui/form/input'
import { Checkbox } from '@/shared/ui/form/checkbox'
import { Button } from '@/shared/ui/overlay/button'
import { useReportMutations } from '@/domains/reports/hooks/useReportMutations'
import type { IReportColumn } from '@/domains/reports/types'
import { useToast } from '@/shared/hooks/use-toast'

const columnSchema = z.object({
  nama_kolom: z.string().min(1, 'Nama kolom harus diisi'),
  label_tampil: z.string().optional(),
  format_type: z.enum(['text', 'number', 'currency', 'date']),
  alignment: z.enum(['left', 'center', 'right']),
  is_summable: z.boolean(),
})

type FormValues = z.infer<typeof columnSchema>

interface ColumnFormModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: number
  column?: IReportColumn | null
}

export function ColumnFormModal({ isOpen, onClose, reportId, column }: ColumnFormModalProps) {
  const { createColumn, updateColumn } = useReportMutations(reportId)
  const { toast } = useToast()
  const isEdit = !!column

  const form = useForm<FormValues>({
    resolver: zodResolver(columnSchema),
    defaultValues: {
      nama_kolom: column?.nama_kolom || '',
      label_tampil: column?.label_tampil || '',
      format_type: column?.format_type || 'text',
      alignment: column?.alignment || 'left',
      is_summable: column?.is_summable || false,
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        nama_kolom: column?.nama_kolom || '',
        label_tampil: column?.label_tampil || '',
        format_type: column?.format_type || 'text',
        alignment: column?.alignment || 'left',
        is_summable: column?.is_summable || false,
      })
    }
  }, [isOpen, column, form])

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      label_tampil: values.label_tampil || null,
    }

    if (isEdit) {
      updateColumn.mutate(
        { columnId: column.id_kolom, payload: { ...payload, label_tampil: payload.label_tampil || undefined } },
        {
          onSuccess: () => {
            toast({ title: 'Kolom berhasil diperbarui', variant: 'success' })
            onClose()
          },
        }
      )
    } else {
      createColumn.mutate({ ...payload, label_tampil: payload.label_tampil || undefined }, {
        onSuccess: () => {
          toast({ title: 'Kolom berhasil ditambahkan', variant: 'success' })
          onClose()
        },
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Kolom' : 'Tambah Kolom'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="nama_kolom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kolom (Database) <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: jml_transaksi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label_tampil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label UI</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Jumlah Transaksi" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="format_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="currency">Currency</option>
                        <option value="date">Date</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alignment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alignment</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="left">Kiri</option>
                        <option value="center">Tengah</option>
                        <option value="right">Kanan</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_summable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Dapat Dijumlah (Summable)</FormLabel>
                    <p className="text-sm text-slate-500">
                      Tampilkan total sum di baris paling bawah.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" loading={createColumn.isPending || updateColumn.isPending}>
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
