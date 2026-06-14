import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { 
  Label, Input, PasswordInput, SearchInput, Checkbox, Switch, 
  RadioGroup, RadioGroupItem, Select, SelectTrigger, SelectValue, 
  SelectContent, SelectItem, Rating, Slider, Counter, FileUpload,
  PhoneInput, TimeInput, SearchableSelect, Textarea, ImageUpload,
  RichTextEditor
} from '@/shared/ui';
import { SectionHeading, ComponentDoc } from './-components/doc-utils';

export const Route = createFileRoute('/(public)/docs/form')({
  component: FormSection,
});

function FormSection() {
  const [rating, setRating] = useState(4);
  const [slider, setSlider] = useState(50);
  const [count, setCount] = useState(1);
  const [phone, setPhone] = useState('');
  const [time, setTime] = useState('12:00');
  const [searchableValue, setSearchableValue] = useState('');
  const [rteValue, setRteValue] = useState('<p>Halo, selamat mencoba editor ini!</p>');

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeading title="Form Components" description="Input dan kontrol untuk mengumpulkan data dari pengguna." />

      <ComponentDoc
        title="Basic Inputs"
        description="Input teks, password, textarea, dan pencarian."
        usage={`<Input placeholder="Nama Lengkap" />
<Textarea placeholder="Keterangan..." />`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="space-y-2">
            <Label>Nama Lengkap</Label>
            <Input placeholder="Contoh: Budi Santoso" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="email@domain.com" variant="primary" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Keterangan Tambahan</Label>
            <Textarea placeholder="Tuliskan detail pesanan Anda di sini..." className="min-h-[100px]" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <PasswordInput placeholder="Masukkan sandi" />
          </div>
          <div className="space-y-2">
            <Label>Pencarian</Label>
            <SearchInput placeholder="Cari data..." />
          </div>
        </div>
      </ComponentDoc>

      <ComponentDoc
        title="Rich Text Editor"
        description="Editor teks lengkap dengan format bold, italic, list, dan lainnya."
      >
        <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <RichTextEditor 
            value={rteValue}
            onChange={setRteValue}
          />
        </div>
      </ComponentDoc>

      <ComponentDoc
        title="Specialized Inputs"
        description="Input khusus untuk data telepon, waktu, dan pencarian select."
        usage={`<PhoneInput value={phone} onChange={setPhone} />
<TimeInput value={time} onChange={setTime} />
<SearchableSelect options={options} />`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="space-y-2">
            <Label>Nomor Telepon</Label>
            <PhoneInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="812xxx" />
          </div>
          <div className="space-y-2">
            <Label>Waktu</Label>
            <TimeInput value={time} onChange={setTime} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Searchable Select</Label>
            <SearchableSelect 
              value={searchableValue}
              onValueChange={setSearchableValue}
              options={[
                { value: 'react', label: 'React' },
                { value: 'vue', label: 'Vue' },
                { value: 'angular', label: 'Angular' },
                { value: 'svelte', label: 'Svelte' },
                { value: 'nextjs', label: 'Next.js' },
              ]}
              placeholder="Pilih framework..."
            />
          </div>
        </div>
      </ComponentDoc>

      <ComponentDoc
        title="Upload Components"
        description="Komponen untuk mengunggah berkas dan gambar."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          <div className="space-y-4">
            <Label>Unggah Foto Profil</Label>
            <ImageUpload 
              id="photo-upload"
              onChange={(file) => console.log('Image uploaded:', file)} 
              value={null}
            />
          </div>
          <div className="space-y-4">
            <Label>Unggah Berkas (PDF, DOC, dll)</Label>
            <FileUpload onFilesSelected={(f) => console.log(f)} />
          </div>
        </div>
      </ComponentDoc>

      <ComponentDoc
        title="Selection Controls"
        description="Checkbox, Radio, Switch, dan Select standar."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-slate-400">Checkbox & Switch</h4>
            <div className="flex items-center gap-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Setuju Syarat & Ketentuan</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="notif" />
              <Label htmlFor="notif">Terima Notifikasi</Label>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-slate-400">Radio Group</h4>
            <RadioGroup defaultValue="opt-1">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="opt-1" id="r1" />
                <Label htmlFor="r1">Opsi Satu</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="opt-2" id="r2" />
                <Label htmlFor="r2">Opsi Dua</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Pilih Kategori</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Pilih satu..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="it">Teknologi Informasi</SelectItem>
                <SelectItem value="fin">Keuangan</SelectItem>
                <SelectItem value="med">Kesehatan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ComponentDoc>

      <ComponentDoc title="Advanced Inputs" description="Slider, Rating, Counter, dan Upload.">
        <div className="space-y-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Rating Produk ({rating}/5)</Label>
              <Rating value={rating} onChange={setRating} />
            </div>
            <div className="space-y-2">
              <Label>Jumlah ({slider})</Label>
              <Slider value={slider} onChange={setSlider} max={100} />
            </div>
            <div className="space-y-2">
              <Label>Quantity Counter</Label>
              <Counter value={count} onChange={setCount} min={1} max={10} />
            </div>
          </div>
          
          <div className="space-y-4">
            <Label>Unggah Berkas</Label>
            <FileUpload onFilesSelected={(f) => console.log(f)} />
          </div>
        </div>
      </ComponentDoc>
    </div>
  );
}
