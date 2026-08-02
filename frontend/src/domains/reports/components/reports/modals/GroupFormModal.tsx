import  { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/overlay/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form/form'
import { Input } from '@/shared/ui/form/input'
import { Button } from '@/shared/ui/overlay/button'
import { useReportMutations } from '@/domains/reports/hooks/useReportMutations'
import type { IReportGroup } from '@/domains/reports/types'
import { useToast } from '@/shared/hooks/use-toast'

const groupSchema = z.object({
  group_level: z.number().min(1, 'Level group harus lebih besar dari 0'),
  label: z.string().min(1, 'Label harus diisi'),
  group_field: z.string().optional(),
  special_handling: z.string().optional(),
})

type FormValues = z.infer<typeof groupSchema>

interface GroupFormModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: number
  group?: IReportGroup | null
}

export function GroupFormModal({ isOpen, onClose, reportId, group }: GroupFormModalProps) {
  const { createGroup, updateGroup } = useReportMutations(reportId)
  const { toast } = useToast()
  const isEdit = !!group

  const form = useForm<FormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      group_level: group?.group_level || 1,
      label: group?.label || '',
      group_field: group?.group_field || '',
      special_handling: group?.special_handling || '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        group_level: group?.group_level || 1,
        label: group?.label || '',
        group_field: group?.group_field || '',
        special_handling: group?.special_handling || '',
      })
    }
  }, [isOpen, group, form])

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      group_field: values.group_field || null,
      special_handling: values.special_handling || null,
    }

    if (isEdit) {
      updateGroup.mutate(
        { groupId: group.id_group, payload: { ...payload, special_handling: (payload.special_handling || undefined) as any } },
        {
          onSuccess: () => {
            toast({ title: 'Grouping berhasil diperbarui', variant: 'success' })
            onClose()
          },
        }
      )
    } else {
      createGroup.mutate({ ...payload, special_handling: (payload.special_handling || undefined) as any }, {
        onSuccess: () => {
          toast({ title: 'Grouping berhasil ditambahkan', variant: 'success' })
          onClose()
        },
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Grouping' : 'Tambah Grouping'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="group_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level Grouping <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Kantor Cabang" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="group_field"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Database</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: KDCAB" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="special_handling"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Handling</FormLabel>
                  <FormControl>
                    <Input placeholder="Misal: footer_sum" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" loading={createGroup.isPending || updateGroup.isPending}>
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
