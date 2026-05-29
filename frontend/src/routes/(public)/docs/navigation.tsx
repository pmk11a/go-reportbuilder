import { createFileRoute } from '@tanstack/react-router';
import { Tabs, Breadcrumb, Steps, Pagination, DataPagination } from '@/components/ui';
import { SectionHeading, ComponentDoc } from './-components/doc-utils';

export const Route = createFileRoute('/(public)/docs/navigation')({
  component: NavigationSection,
});

function NavigationSection() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeading title="Navigation Components" description="Membantu pengguna berpindah antar halaman atau konten." />

      <ComponentDoc
        title="Tabs"
        description="Mengatur konten dalam grup navigasi horizontal."
        usage={`<Tabs
  tabs={[
    { label: 'Tab 1', value: '1', content: 'Konten 1' },
    { label: 'Tab 2', value: '2', content: 'Konten 2' }
  ]}
/>`}
      >
        <Tabs
          tabs={[
            { label: 'Ringkasan', value: 'overview', content: 'Ini adalah konten ringkasan umum.' },
            { label: 'Detail', value: 'details', content: 'Informasi mendalam tentang entitas ini.' },
            { label: 'Log Riwayat', value: 'logs', content: 'Daftar aktivitas terakhir yang tercatat.' }
          ]}
          className="w-full"
        />
      </ComponentDoc>

      <ComponentDoc title="Breadcrumb" description="Menunjukkan hirarki lokasi halaman saat ini.">
        <Breadcrumb items={[
          { label: 'Beranda', href: '/' },
          { label: 'Manajemen', href: '/admin' },
          { label: 'Daftar Pengguna' }
        ]} />
      </ComponentDoc>

      <ComponentDoc title="Steps" description="Indikator tahapan pada proses multi-langkah.">
        <Steps
          steps={[
            { label: 'Data Diri', description: 'Input biodata', completed: true },
            { label: 'Verifikasi', description: 'Cek dokumen', current: true },
            { label: 'Selesai', description: 'Akun aktif' }
          ]}
        />
      </ComponentDoc>

      <ComponentDoc title="Pagination & Data Pagination" description="Navigasi untuk membagi data dalam beberapa halaman.">
        <div className="flex flex-col items-center gap-12 w-full">
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs font-semibold text-slate-400 uppercase">Standard Pagination</p>
            <Pagination currentPage={1} totalPages={10} onPageChange={() => {}} />
          </div>
          
          <div className="flex flex-col gap-4 w-full">
            <p className="text-xs font-semibold text-slate-400 uppercase text-center">Data Pagination (with limit)</p>
            <DataPagination 
              currentPage={1} 
              totalPages={10} 
              itemsPerPage={10}
              onPageChange={() => {}} 
            />
          </div>
        </div>
      </ComponentDoc>
    </div>
  );
}
