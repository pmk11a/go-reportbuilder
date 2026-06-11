import { createFileRoute } from '@tanstack/react-router';
import { useTheme } from '@/shared/stores/themeStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Code } from '@/shared/ui';

export const Route = createFileRoute('/(public)/docs/theme')({
  component: ThemeSection,
});

function ThemeSection() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-extrabold mb-3">Panduan Tema</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">Konfigurasi warna, tipografi, dan mode gelap aplikasi.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mengubah Tema Warna Utama</CardTitle>
          <CardDescription>Aplikasi mendukung multiple color presets yang dikelola via CSS variables.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Buka file <Code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">frontend/src/styles/globals.css</Code> untuk melihat daftar tema yang tersedia:</p>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border">
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Cari blok <Code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">:root</Code> di bagian atas file.</li>
                <li>Comment out tema yang aktif saat ini (misal: Orange).</li>
                <li>Uncomment tema yang diinginkan (misal: Blue atau Purple).</li>
                <li>Simpan file, dan aplikasi akan otomatis menggunakan skema warna baru.</li>
              </ol>
            </div>
            <Code className="block p-4 bg-slate-900 text-slate-100 whitespace-pre overflow-auto">{`/* Contoh di globals.css */
:root {
  /* THEME 1: BLUE (Aktifkan dengan uncomment) */
  --color-primary-500: rgb(14, 165, 233);
  --gradient-from: rgb(147, 197, 253);

  /* THEME 3: ORANGE (Comment untuk menonaktifkan) */
  /* --color-primary-500: rgb(249, 115, 22); */
}`}</Code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Light & Dark Mode</CardTitle>
          <CardDescription>Sistem tema mendukung transisi otomatis antara mode terang dan gelap.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-900/50">
            <div className="flex-1">
              <p className="font-semibold text-primary-900 dark:text-primary-100">Coba Toggle Sekarang</p>
              <p className="text-sm text-primary-700 dark:text-primary-300">Mode saat ini: <strong>{theme.toUpperCase()}</strong></p>
            </div>
            <Button onClick={toggleTheme}>Ganti Mode</Button>
          </div>
          
          <h4 className="font-semibold mt-4">Penggunaan dalam Kode</h4>
          <p className="text-sm">Gunakan hook <Code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">useTheme()</Code> untuk mendapatkan state tema saat ini.</p>
          <Code className="block p-4 bg-slate-900 text-slate-100 whitespace-pre overflow-auto">{`import { useTheme } from '@/shared/stores/themeStore';

const { theme, toggleTheme, isDark } = useTheme();`}</Code>
          
          <h4 className="font-semibold mt-4">Utility Classes</h4>
          <p className="text-sm">Gunakan prefix <Code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">dark:</Code> untuk memberikan gaya khusus pada mode gelap.</p>
          <Code className="block p-4 bg-slate-900 text-slate-100 whitespace-pre overflow-auto">{`<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
  Konten Adaptif
</div>`}</Code>
        </CardContent>
      </Card>
    </div>
  );
}
