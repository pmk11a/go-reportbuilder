import { createFileRoute } from '@tanstack/react-router';
import { Stat, Timeline, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/shared/ui';
import { SectionHeading, ComponentDoc } from './-components/doc-utils';
import { Users, DollarSign, Activity, CheckCircle2, Mail, Rocket } from 'lucide-react';

export const Route = createFileRoute('/(public)/docs/data')({
  component: DataSection,
});

function DataSection() {
  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <SectionHeading title="Data Display" description="Visualisasi informasi dan data statistik dengan desain premium yang sinkron dengan tema." />

      {/* Stats Section */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Stat Cards</h3>
        <ComponentDoc title="Metrics & Analytics" description="Menampilkan metrik utama dengan desain modern, gradient, dan tren perubahan.">
          <div className="p-8 bg-primary-50/30 dark:bg-primary-900/5 rounded-3xl border border-primary-100/50 dark:border-primary-900/10 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Stat 
                variant="primary"
                label="Total IUser" 
                value="1,234" 
                change={{ value: 12, positive: true }} 
                icon={<Users className="w-6 h-6 text-white" />}
              />
              <Stat 
                variant="secondary"
                label="Pendapatan" 
                value="Rp 45.2M" 
                change={{ value: 2, positive: false }} 
                icon={<DollarSign className="w-6 h-6 text-white" />}
              />
              <Stat 
                variant="accent"
                label="Aktif Sekarang" 
                value="560" 
                icon={<Activity className="w-6 h-6 text-white" />}
              />
              <Stat 
                label="Server Uptime" 
                value="99.99%" 
                icon={<Activity className="w-6 h-6 text-primary-600" />}
              />
            </div>
          </div>
        </ComponentDoc>
      </section>

      {/* Table Section */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Data Tables</h3>
        <ComponentDoc title="Modern Table" description="Menampilkan data terstruktur dengan header berwarna solid sesuai tema dan desain baris yang elegan.">
          <div className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>Nama Pengguna</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Terakhir Aktif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { rank: '01', name: 'Budi Santoso', email: 'budi@example.com', role: 'Administrator', status: 'active', active: '2 menit yang lalu' },
                  { rank: '02', name: 'Siti Aminah', email: 'siti@example.com', role: 'Editor', status: 'pending', active: '1 jam yang lalu' },
                  { rank: '03', name: 'Andi Wijaya', email: 'andi@example.com', role: 'Viewer', status: 'active', active: 'Baru saja' },
                ].map((row) => (
                  <TableRow key={row.rank} className="group cursor-pointer">
                    <TableCell className="font-bold text-slate-400 group-hover:text-primary-600 transition-colors">
                      {row.rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white">{row.name}</span>
                        <span className="text-xs text-slate-500">{row.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{row.role}</span>
                    </TableCell>
                    <TableCell>
                      {row.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs font-bold border border-green-100 dark:border-green-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-500 dark:text-slate-400">
                      {row.active}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ComponentDoc>
      </section>

      {/* Timeline Section */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Activity Timeline</h3>
        <ComponentDoc
          title="Interactive Timeline"
          description="Menampilkan rangkaian kejadian dengan desain yang lebih hidup dan berwarna."
        >
          <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full">
            <Timeline
              items={[
                { 
                  title: 'Pendaftaran Akun', 
                  description: 'IUser melakukan registrasi awal melalui portal pengajuan berkas digital.', 
                  time: '12 Okt 2023',
                  variant: 'primary',
                  icon: <Rocket className="w-4 h-4" />
                },
                { 
                  title: 'Verifikasi Email', 
                  description: 'Sistem memverifikasi alamat email pengguna melalui tautan aktivasi otomatis.', 
                  time: '12 Okt 2023',
                  variant: 'success',
                  icon: <Mail className="w-4 h-4" />
                },
                { 
                  title: 'Aktivasi Layanan', 
                  description: 'Seluruh layanan telah dapat digunakan oleh user secara penuh tanpa batasan.', 
                  time: '13 Okt 2023',
                  variant: 'success',
                  icon: <CheckCircle2 className="w-4 h-4" />
                }
              ]}
              className="w-full"
            />
          </div>
        </ComponentDoc>
      </section>
    </div>
  );
}
