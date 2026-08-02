import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/overlay/dialog'
import { Button } from '@/shared/ui/overlay/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/shared/ui/form'
import { Input } from '@/shared/ui/form/input'
import { Textarea } from '@/shared/ui/form/textarea'
import { useBrowseConfigCreate, useBrowseConfigUpdate } from '@/domains/browse/hooks/useBrowse'
import { useToast } from '@/shared/hooks/use-toast'
import { Switch } from '@/shared/ui/form/switch'

interface BrowseConfigModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialData?: any // The SDbBrowseConfig object or null
  onSuccess?: () => void
}

export function BrowseConfigModal({
  isOpen,
  onClose,
  mode,
  initialData,
  onSuccess,
}: BrowseConfigModalProps) {
  const createMutation = useBrowseConfigCreate()
  const updateMutation = useBrowseConfigUpdate()
  const { toast } = useToast()

  const form = useForm({
    defaultValues: {
      kodebrowse: '',
      tablename: '',
      keyfield: '',
      labelfield: '',
      query: '',
      additionalfields: '',
      joins: '',
      whereextra: '',
      aliasfields: '',
      parentfilters: '',
      params: '',
      isactive: 1,
    },
  })

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        // Map the fields properly
        form.reset({
          kodebrowse: initialData.kodeBrowse || initialData.kodebrowse || '',
          tablename: initialData.tablename || '',
          keyfield: initialData.keyfield || '',
          labelfield: initialData.labelfield || '',
          query: initialData.query || '',
          additionalfields: initialData.additionalfields?.join?.(',') || (typeof initialData.additionalfields === 'string' ? initialData.additionalfields : ''),
          joins: initialData.joins?.join?.('\n') || (typeof initialData.joins === 'string' ? initialData.joins : ''),
          whereextra: initialData.whereextra || '',
          aliasfields: typeof initialData.aliasfields === 'object' ? JSON.stringify(initialData.aliasfields) : (initialData.aliasfields || ''),
          parentfilters: Array.isArray(initialData.parentfilters) ? JSON.stringify(initialData.parentfilters) : (initialData.parentfilters || ''),
          params: typeof initialData.params === 'object' ? JSON.stringify(initialData.params) : (initialData.params || ''),
          isactive: initialData.isactive ?? 1,
        })
      } else {
        form.reset({
          kodebrowse: '',
          tablename: '',
          keyfield: '',
          labelfield: '',
          query: '',
          additionalfields: '',
          joins: '',
          whereextra: '',
          aliasfields: '',
          parentfilters: '',
          params: '',
          isactive: 1,
        })
      }
    }
  }, [isOpen, mode, initialData, form])

  const onSubmit = async (values: any) => {
    try {
      // Clean up stringified arrays/objects
      const payload = {
        ...values,
        additionalfields: values.additionalfields ? values.additionalfields.split(',').map((s: string) => s.trim()) : [],
        joins: values.joins ? values.joins.split('\n').filter(Boolean) : [],
        aliasfields: values.aliasfields ? JSON.parse(values.aliasfields) : {},
        parentfilters: values.parentfilters ? JSON.parse(values.parentfilters) : [],
        params: values.params ? JSON.parse(values.params) : {},
        isactive: values.isactive ? 1 : 0,
      }

      if (mode === 'create') {
        await createMutation.mutateAsync(payload)
        toast({ title: 'Berhasil', description: 'Konfigurasi browse berhasil dibuat' })
      } else if (mode === 'edit') {
        const id = initialData?.id
        if (!id) throw new Error('ID Konfigurasi tidak ditemukan')

        await updateMutation.mutateAsync({ id, payload })
        toast({ title: 'Berhasil', description: 'Konfigurasi browse berhasil diperbarui' })
      }
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan saat menyimpan konfigurasi',
        variant: 'destructive',
      })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Tambah Konfigurasi Browse' : 'Edit Konfigurasi Browse'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kodebrowse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Browse *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contoh: 1001" disabled={mode === 'edit'} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tablename"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Name (opsional jika Query ada)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contoh: MSTPERKIRAAN" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keyfield"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Field</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contoh: NoKira" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="labelfield"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label Field</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contoh: NamaKira" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Query (opsional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="SELECT * FROM MSTPERKIRAAN" rows={3} className="font-mono text-sm" />
                  </FormControl>
                  <FormDescription>Gunakan ini jika ingin join kompleks atau kondisi khusus.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="additionalfields"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Fields</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Tipe, Level (pisahkan koma)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whereextra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Where Extra</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="IsActive = 1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="joins"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Joins (Tiap baris satu join)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="LEFT JOIN MSTCABANG ON ...&#10;INNER JOIN ..." rows={2} className="font-mono text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="aliasfields"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alias Fields (JSON)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='{"Keterangan": "Desc"}' className="font-mono text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentfilters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Filters (JSON Array)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='[{"sourceColumn": "divisi", "targetColumn": "DivisiID"}]' className="font-mono text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isactive"
              render={() => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Aktif</FormLabel>
                    <FormDescription>
                      Apakah konfigurasi browse ini dapat digunakan.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Controller
                      name="isactive"
                      control={form.control}
                      render={({ field: { value, onChange } }) => (
                        <Switch
                          checked={value === 1}
                          onCheckedChange={(checked) => onChange(checked ? 1 : 0)}
                        />
                      )}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
