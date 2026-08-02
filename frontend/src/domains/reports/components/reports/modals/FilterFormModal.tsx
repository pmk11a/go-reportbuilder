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
import type { IReportFilter,  } from '@/domains/reports/types'
import { useToast } from '@/shared/hooks/use-toast'
import { useBrowseTypes } from '@/domains/browse/hooks/useBrowse'
import { SearchableSelect } from '@/shared/ui/form/searchable-select'

const filterSchema = z.object({
  nama_filter: z.string().min(1, 'Nama filter harus diisi'),
  label: z.string().min(1, 'Label harus diisi'),
  tipe_input: z.enum(['date', 'text', 'number', 'combobox', 'browse', 'perkiraan', 'dropdown', 'checkbox']),
  posisi: z.number().min(1),
  wajib_isi: z.boolean(),
  nilai_default: z.string().optional(),
  konfigurasi_list: z.array(z.object({
    key: z.string().min(1, 'Key tidak boleh kosong'),
    value: z.string().min(1, 'Value tidak boleh kosong'),
  })).optional(),
})

type FormValues = z.infer<typeof filterSchema>

interface FilterFormModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: number
  filter?: IReportFilter | null
}

export function FilterFormModal({ isOpen, onClose, reportId, filter }: FilterFormModalProps) {
  const { createFilter, updateFilter } = useReportMutations(reportId)
  const { toast } = useToast()
  const isEdit = !!filter

  const parseKonfigurasi = (konfig: any) => {
    if (!konfig) return []
    let parsed = konfig
    if (typeof konfig === 'string') {
      try {
        parsed = JSON.parse(konfig)
      } catch (e) {
        return []
      }
    }
    return Object.entries(parsed).map(([k, v]) => ({
      key: k,
      value: typeof v === 'object' ? JSON.stringify(v) : String(v),
    }))
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      nama_filter: filter?.nama_filter || '',
      label: filter?.label || '',
      tipe_input: filter?.tipe_input || 'text',
      wajib_isi: filter?.wajib_isi || false,
      nilai_default: filter?.nilai_default || '',
      posisi: filter?.posisi || 1,
      konfigurasi_list: parseKonfigurasi(filter?.konfigurasi),
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        nama_filter: filter?.nama_filter || '',
        label: filter?.label || '',
        tipe_input: filter?.tipe_input || 'text',
        wajib_isi: filter?.wajib_isi || false,
        nilai_default: filter?.nilai_default || '',
        posisi: filter?.posisi || 1,
        konfigurasi_list: parseKonfigurasi(filter?.konfigurasi),
      })
    }
  }, [isOpen, filter, form])

  const onSubmit = (values: FormValues) => {
    const konfigMap: Record<string, any> = {}
    
    if (values.konfigurasi_list) {
      values.konfigurasi_list.forEach(item => {
        try {
          konfigMap[item.key] = JSON.parse(item.value)
        } catch {
          konfigMap[item.key] = item.value
        }
      })
    }
    
    const konfigurasi = Object.keys(konfigMap).length > 0 ? konfigMap : null

    const payload = {
      nama_filter: values.nama_filter,
      label: values.label,
      tipe_input: values.tipe_input,
      wajib_isi: values.wajib_isi,
      nilai_default: values.nilai_default || null, // convert empty string to null
      posisi: values.posisi,
      konfigurasi,
    }

    if (isEdit) {
      updateFilter.mutate(
        { filterId: filter.id_parameter, payload },
        {
          onSuccess: () => {
            toast({ title: 'Filter berhasil diperbarui', variant: 'success' })
            onClose()
          },
        }
      )
    } else {
      createFilter.mutate(payload, {
        onSuccess: () => {
          toast({ title: 'Filter berhasil ditambahkan', variant: 'success' })
          onClose()
        },
      })
    }
  }

  const tipeInput = form.watch('tipe_input')
  const { data: browseTypes = [] } = useBrowseTypes()
  
  const { fields: konfigFields, append: konfigAppend, remove: konfigRemove } = useFieldArray({
    control: form.control,
    name: 'konfigurasi_list'
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Filter' : 'Tambah Filter'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="nama_filter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parameter (Var) <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: @tanggal" {...field} />
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
                  <FormLabel>Label UI <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Tanggal Transaksi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipe_input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Input <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="combobox">Combobox</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="browse">Browse</option>
                      <option value="perkiraan">Perkiraan</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="posisi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posisi <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nilai_default"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nilai Default</FormLabel>
                    <FormControl>
                      <Input placeholder="Nilai awal" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <FormLabel>Konfigurasi Tambahan</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 text-xs" 
                  onClick={() => konfigAppend({ key: '', value: '' })}
                >
                  + Tambah Konfig
                </Button>
              </div>
              
              {konfigFields.length === 0 ? (
                <p className="text-xs text-secondary-500 italic">Tidak ada konfigurasi tambahan.</p>
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
                              <Input placeholder="Key (cth: kode_browse)" {...field} className="h-9 text-xs" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`konfigurasi_list.${index}.value`}
                        render={({ field }) => {
                          const currentKey = form.watch(`konfigurasi_list.${index}.key`)  
                          
                          if (currentKey === 'kode_browse') {
                            const browseOptions = browseTypes.map((t:any) => ({
                              value: t.kodeBrowse,
                              label: `${t.kodeBrowse} - ${t.group || t.labelField}`
                            }))
                            
                            return (
                              <FormItem className="flex-[1.5]">
                                <FormControl>
                                  <SearchableSelect
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    options={browseOptions}
                                    placeholder="Cari & Pilih Browse..."
                                  />
                                </FormControl>
                              </FormItem>
                            )
                          }
                          
                          return (
                            <FormItem className="flex-[1.5]">
                              <FormControl>
                                <Input placeholder="Value" {...field} className="h-9 text-xs" />
                              </FormControl>
                            </FormItem>
                          )
                        }}
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
              name="wajib_isi"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Wajib Isi (Mandatory)</FormLabel>
                    <p className="text-sm text-slate-500">
                      User harus mengisi filter ini.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" loading={createFilter.isPending || updateFilter.isPending}>
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
