import  { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/overlay/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form/form'
import { Input } from '@/shared/ui/form/input'
import { Checkbox } from '@/shared/ui/form/checkbox'
import { Button } from '@/shared/ui/overlay/button'
import { useReportMutations } from '@/domains/reports/hooks/useReportMutations'
import type { IReportDataset } from '@/domains/reports/types'
import { useToast } from '@/shared/hooks/use-toast'

const datasetSchema = z.object({
  nama_dataset: z.string().min(1, 'Nama dataset harus diisi'),
  deskripsi: z.string().optional(),
  query_sumber_data: z.string().min(5, 'Query SQL harus diisi'),
  urutan: z.number().min(1),
  visible: z.boolean(),
  konfigurasi_list: z.array(z.object({
    key: z.string().min(1, 'Key tidak boleh kosong'),
    value: z.string().min(1, 'Value tidak boleh kosong'),
    type: z.enum(['string', 'int', 'array', 'json']).default('string'),
  })).optional(),
})

type FormValues = z.infer<typeof datasetSchema>

interface DatasetFormModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: number
  dataset?: IReportDataset | null
}

export function DatasetFormModal({ isOpen, onClose, reportId, dataset }: DatasetFormModalProps) {
  const { createDataset, updateDataset } = useReportMutations(reportId)
  const { toast } = useToast()
  const isEdit = !!dataset

  const form = useForm<FormValues>({
    resolver: zodResolver(datasetSchema),
    defaultValues: {
      nama_dataset: dataset?.nama_dataset || '',
      deskripsi: dataset?.deskripsi || '',
      query_sumber_data: dataset?.query_sumber_data || '',
      urutan: dataset?.urutan || 1,
      visible: dataset?.visible ?? true,
      konfigurasi_list: dataset?.config_json ? 
        Object.entries(dataset.config_json).map(([k, v]) => {
          let type: 'string' | 'int' | 'array' | 'json' = 'string'
          let strVal = ''
          if (Array.isArray(v)) {
            type = 'array'
            strVal = JSON.stringify(v)
          } else if (typeof v === 'object' && v !== null) {
            type = 'json'
            strVal = JSON.stringify(v)
          } else if (typeof v === 'number') {
            type = 'int'
            strVal = String(v)
          } else {
            type = 'string'
            strVal = String(v)
          }
          return { key: k, value: strVal, type }
        })
        : [],
    },
  })

  const { fields: konfigFields, append: konfigAppend, remove: konfigRemove } = useFieldArray({
    control: form.control,
    name: 'konfigurasi_list',
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        nama_dataset: dataset?.nama_dataset || '',
        deskripsi: dataset?.deskripsi || '',
        query_sumber_data: dataset?.query_sumber_data || '',
        urutan: dataset?.urutan || 1,
        visible: dataset?.visible ?? true,
        konfigurasi_list: dataset?.config_json ? 
          Object.entries(dataset.config_json).map(([k, v]) => {
            let type: 'string' | 'int' | 'array' | 'json' = 'string'
            let strVal = ''
            if (Array.isArray(v)) {
              type = 'array'
              strVal = JSON.stringify(v)
            } else if (typeof v === 'object' && v !== null) {
              type = 'json'
              strVal = JSON.stringify(v)
            } else if (typeof v === 'number') {
              type = 'int'
              strVal = String(v)
            } else {
              type = 'string'
              strVal = String(v)
            }
            return { key: k, value: strVal, type }
          })
          : [],
      })
    }
  }, [isOpen, dataset, form])

  const onSubmit = (values: FormValues) => {
    const konfigMap: Record<string, any> = {}
    
    if (values.konfigurasi_list) {
      for (const item of values.konfigurasi_list) {
        try {
          if (item.type === 'int') {
            konfigMap[item.key] = parseInt(item.value, 10) || 0
          } else if (item.type === 'array' || item.type === 'json') {
            konfigMap[item.key] = JSON.parse(item.value)
          } else {
            konfigMap[item.key] = item.value
          }
        } catch (err) {
          toast({ title: `Format value tidak valid untuk key: ${item.key}`, variant: 'destructive' })
          return
        }
      }
    }
    
    const parsedConfigJson = Object.keys(konfigMap).length > 0 ? konfigMap : null

    const payload = {
      nama_dataset: values.nama_dataset,
      deskripsi: values.deskripsi || null,
      query_sumber_data: values.query_sumber_data,
      urutan: values.urutan,
      visible: values.visible,
      config_json: parsedConfigJson,
    }

    if (isEdit) {
      updateDataset.mutate(
        { datasetId: dataset.id_query, payload },
        {
          onSuccess: () => {
            toast({ title: 'Dataset berhasil diperbarui', variant: 'success' })
            onClose()
          },
        }
      )
    } else {
      createDataset.mutate(payload, {
        onSuccess: () => {
          toast({ title: 'Dataset berhasil ditambahkan', variant: 'success' })
          onClose()
        },
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Dataset' : 'Tambah Dataset'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nama_dataset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Dataset (T1, T2, dst) <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="T1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urutan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urutan <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deskripsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Input placeholder="Deskripsi dataset" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="query_sumber_data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Query SQL <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[200px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="SELECT * FROM table"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <FormLabel>Konfigurasi Tambahan</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 text-xs" 
                  onClick={() => konfigAppend({ key: '', value: '', type: 'string' })}
                >
                  + Tambah Konfig
                </Button>
              </div>
              
              {konfigFields.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-500">Belum ada konfigurasi khusus.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {konfigFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`konfigurasi_list.${index}.key`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Key (cth: display_role)" {...field} className="h-9 text-xs" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`konfigurasi_list.${index}.type`}
                        render={({ field }) => (
                          <FormItem className="w-24 shrink-0">
                            <FormControl>
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="string">String</option>
                                <option value="int">Integer</option>
                                <option value="array">Array</option>
                                <option value="json">JSON</option>
                              </select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`konfigurasi_list.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-[1.5]">
                            <FormControl>
                              <Input placeholder="Value" {...field} className="h-9 text-xs" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        onClick={() => konfigRemove(index)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="visible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Visible</FormLabel>
                    <p className="text-sm text-slate-500">
                      Apakah dataset ini akan ditampilkan secara langsung di UI?
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" loading={createDataset.isPending || updateDataset.isPending}>
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
