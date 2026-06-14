import { createFileRoute } from '@tanstack/react-router';
import { 
  Button, Dialog, DialogTrigger, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter, DialogClose, 
  Accordion, Popover, PopoverTrigger, PopoverContent, 
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
  Badge, Tag, TagGroup, Chip, Sheet, SheetTrigger, SheetContent,
  SheetHeader, SheetTitle, SheetDescription, SheetFooter,
  ScrollArea, Divider
} from '@/shared/ui';
import { SectionHeading, ComponentDoc } from './-components/doc-utils';
import { Layers, User, Settings, Info, Bell } from 'lucide-react';

export const Route = createFileRoute('/(public)/docs/overlay')({
  component: OverlaySection,
});

function OverlaySection() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeading title="Overlay Components" description="Komponen yang muncul di atas konten utama untuk interaksi tambahan." />

      <ComponentDoc
        title="Button"
        description="Elemen interaktif utama dengan berbagai varian dan status."
      >
        <div className="flex flex-wrap gap-4">
          <Button className="shadow-lg shadow-primary-500/20">Primary Shadow</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading className="shadow-lg shadow-primary-500/20">Loading</Button>
        </div>
      </ComponentDoc>

      <ComponentDoc
        title="Badge, Tag & Chip"
        description="Komponen kecil untuk label, kategori, dan status."
      >
        <div className="flex flex-col gap-8 w-full">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Badges</p>
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Urgent</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags</p>
            <TagGroup>
              <Tag variant="primary">Next.js</Tag>
              <Tag variant="secondary">React</Tag>
              <Tag variant="default">TypeScript</Tag>
              <Tag variant="outline">Tailwind</Tag>
            </TagGroup>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chips</p>
            <div className="flex flex-wrap gap-3">
              <Chip label="John Doe" icon={<User className="w-3 h-3" />} />
              <Chip label="Settings" variant="filled" icon={<Settings className="w-3 h-3" />} onRemove={() => {}} />
              <Chip label="Information" variant="outlined" icon={<Info className="w-3 h-3" />} />
            </div>
          </div>
        </div>
      </ComponentDoc>

      <ComponentDoc title="Sheet (Slide-out)" description="Panel yang muncul dari sisi layar untuk menu atau detail data.">
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 w-full flex justify-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="lg" className="rounded-xl shadow-sm">Buka Profil IUser</Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-0 p-0">
              <div className="p-8 pb-4">
                <SheetHeader>
                  <SheetTitle>Profil Pengguna</SheetTitle>
                  <SheetDescription>
                    Informasi lengkap mengenai identitas dan preferensi akun Anda.
                  </SheetDescription>
                </SheetHeader>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-8 space-y-8">
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="h-28 w-28 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 border-4 border-white dark:border-slate-800 shadow-xl">
                      <User className="h-14 w-14" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-xl font-bold">Budi Santoso</h4>
                      <p className="text-sm text-slate-500">Senior Web Developer</p>
                    </div>
                    <Badge variant="secondary" className="px-4 py-1">Verified Member</Badge>
                  </div>

                  <Divider />

                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informasi Kontak</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Email</span>
                        <span className="font-medium">budi@example.com</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Telepon</span>
                        <span className="font-medium">+62 812 3456 7890</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pengaturan Cepat</h5>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="ghost" className="justify-start gap-3 rounded-xl px-4 h-12">
                        <Settings className="w-4 h-4" /> Edit Profil
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 rounded-xl px-4 h-12">
                        <Bell className="w-4 h-4" /> Notifikasi
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-8 border-t dark:border-slate-800">
                <SheetFooter>
                  <Button variant="outline" className="rounded-xl px-6">Logout</Button>
                  <Button className="rounded-xl px-8 shadow-lg shadow-primary-500/20">Simpan Perubahan</Button>
                </SheetFooter>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </ComponentDoc>

      <ComponentDoc title="Dialog (Modal)" description="Window popup untuk interaksi kritikal atau form tambahan.">
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 w-full flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg shadow-primary-500/20">Buka Modal Interaktif</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-2xl">Konfirmasi Aksi Penting</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Apakah Anda yakin ingin melanjutkan proses ini? Data yang sudah diinput akan diproses secara permanen ke sistem.
                </DialogDescription>
              </DialogHeader>
              <div className="py-10 border-y border-slate-100 dark:border-slate-800 my-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/50 rounded-xl">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4 text-primary-600 dark:text-primary-400">
                  <Layers className="w-8 h-8" />
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 italic text-center px-6">
                  Anda bisa meletakkan form, tabel, atau komponen apapun di dalam area konten modal ini.
                </span>
              </div>
              <DialogFooter className="gap-3">
                <DialogClose asChild>
                  <Button variant="ghost" className="rounded-xl px-6">Batal</Button>
                </DialogClose>
                <Button className="rounded-xl px-8 shadow-lg shadow-primary-500/25">Lanjutkan Proses</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ComponentDoc>

      <ComponentDoc title="Accordion" description="Menampilkan konten dalam panel yang dapat diciutkan dengan gaya bersih.">
        <div className="w-full max-w-2xl mx-auto">
          <Accordion
            items={[
              { id: 'item-1', title: 'Bagaimana cara instalasi sistem ini?', content: 'Anda dapat menggunakan npm atau yarn untuk menginstal paket-paket yang dibutuhkan. Pastikan Anda sudah memiliki Node.js v18 ke atas terinstal di mesin Anda.' },
              { id: 'item-2', title: 'Apakah mendukung Framework modern?', content: 'Ya, seluruh komponen dibangun menggunakan React, TypeScript, dan Tailwind CSS untuk performa maksimal dan kemudahan kustomisasi.' },
              { id: 'item-3', title: 'Bagaimana dengan dukungan Dark Mode?', content: 'Sistem ini mendukung dark mode secara native. Anda bisa melakukan toggle tema dan seluruh komponen akan beradaptasi secara otomatis.' }
            ]}
            className="w-full"
          />
        </div>
      </ComponentDoc>

      <ComponentDoc title="Popover & Tooltip" description="Menampilkan informasi tambahan saat elemen diklik atau di-hover.">
        <div className="flex flex-col sm:flex-row gap-12 items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 w-full">
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Click Trigger</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" className="rounded-xl px-6 shadow-sm">Buka Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <Layers className="w-5 h-5" />
                    <h4 className="font-bold">Informasi Detail</h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Ini adalah <strong>Popover</strong>. Berbeda dengan Tooltip, Popover lebih cocok untuk konten yang interaktif atau lebih panjang.
                  </p>
                  <Button size="sm" variant="outline" className="w-full mt-2 rounded-lg">Pahami Lebih Lanjut</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-px h-12 bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Hover Trigger</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-help shadow-sm text-sm font-medium hover:border-primary-500 transition-colors">
                    Arahkan Mouse Ke Sini
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Ini adalah info bantuan Tooltip!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </ComponentDoc>
    </div>
  );
}
