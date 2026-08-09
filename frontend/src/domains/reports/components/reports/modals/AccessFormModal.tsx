import  { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/overlay/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form/form'
import { Checkbox } from '@/shared/ui/form/checkbox'
import { Button } from '@/shared/ui/overlay/button'
import { SearchableSelect } from '@/shared/ui/form/searchable-select'
import { useReportMutations } from '@/domains/reports/hooks/useReportMutations'
import { useAllUsers } from '@/domains/reports/hooks/useReport'
import { useToast } from '@/shared/hooks/use-toast'

const accessSchema = z.object({
  USERID: z.string().min(1, 'User harus dipilih'),
  Access: z.boolean(),
  IsDesign: z.boolean(),
  IsExport: z.boolean(),
})

type FormValues = z.infer<typeof accessSchema>

interface AccessFormModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: number
}

export function AccessFormModal({ isOpen, onClose, reportId }: AccessFormModalProps) {
  const { grantAccess } = useReportMutations(reportId)
  const { data: allUsers } = useAllUsers()
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(accessSchema),
    defaultValues: {
      USERID: '',
      Access: true,
      IsDesign: false,
      IsExport: false,
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        USERID: '',
        Access: true,
        IsDesign: false,
        IsExport: false,
      })
    }
  }, [isOpen, form])

  const onSubmit = (values: FormValues) => {
    grantAccess.mutate(values, {
      onSuccess: () => {
        toast({ title: 'Akses berhasil diberikan', variant: 'success' })
        onClose()
      },
    })
  }

  const userOptions = useMemo(() => {
    if (!allUsers) return []
    
    // Safely extract array in case TanStack Query returned a cached paginated object
    const usersArray = Array.isArray(allUsers) 
      ? allUsers 
      : (allUsers as any).items || (allUsers as any).data || []
      
    if (!Array.isArray(usersArray)) return []

    return usersArray.map((u: any) => ({
      value: u.USERID,
      label: `${u.USERID} — ${u.FullName}`,
    }))
  }, [allUsers])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Beri Akses User</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="USERID"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Pilih User <span className="text-red-500">*</span></FormLabel>
                  <SearchableSelect
                    options={userOptions}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="Pilih user..."
                    className="w-full"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 pt-2 border-t mt-4">
              <h4 className="text-sm font-medium">Hak Akses</h4>
              
              <FormField
                control={form.control}
                name="Access"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                    </FormControl>
                    <FormLabel className="font-normal">Bisa membuka dan melihat laporan</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="IsExport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                    </FormControl>
                    <FormLabel className="font-normal">Bisa export (Excel/PDF)</FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="IsDesign"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                    </FormControl>
                    <FormLabel className="font-normal">Bisa mengubah desain layout cetak</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" loading={grantAccess.isPending}>
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
