import { createFileRoute } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, ScrollArea, Divider, Separator } from '@/shared/ui';
import { SectionHeading, ComponentDoc } from './-components/doc-utils';

export const Route = createFileRoute('/(public)/docs/layout')({
  component: LayoutSection,
});

function LayoutSection() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeading title="Layout Components" description="Komponen untuk mengatur struktur dan tata letak konten." />
      
      <ComponentDoc
        title="Card"
        description="Container serbaguna untuk mengelompokkan konten terkait."
        props={[
          { name: 'children', type: 'ReactNode', description: 'Isi dari card' },
          { name: 'className', type: 'string', description: 'Class tambahan' },
        ]}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Deskripsi singkat card.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Ini adalah konten utama di dalam card. Anda bisa memasukkan apa saja di sini.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Aksi Utama</Button>
            </CardFooter>
          </Card>
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-dashed">
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Card tanpa footer dan dengan style tambahan.</p>
            </CardContent>
          </Card>
        </div>
      </ComponentDoc>

      <ComponentDoc
        title="ScrollArea"
        description="Container dengan scrollbar kustom yang konsisten di semua browser."
        usage={`<ScrollArea className="h-40 w-full border p-4 rounded-md">
  {/* Konten panjang */}
</ScrollArea>`}
      >
        <ScrollArea className="h-40 w-full border rounded-md p-4 bg-white dark:bg-slate-900">
          <div className="space-y-4">
            <h4 className="font-bold">Prinsip Desain</h4>
            <p className="text-sm italic text-slate-500">Scroll down to see more...</p>
            {Array.from({ length: 10 }).map((_, i) => (
              <p key={i} className="text-sm">Baris konten ke-{i + 1}. Menunjukkan bagaimana scrollbar kustom bekerja dengan lancar di dalam area terbatas ini.</p>
            ))}
          </div>
        </ScrollArea>
      </ComponentDoc>

      <ComponentDoc
        title="Divider & Separator"
        description="Garis pemisah untuk memberikan struktur hirarki pada konten."
      >
        <div className="space-y-6 w-full">
          <div className="p-4 border rounded-lg bg-white dark:bg-slate-900">
            <p className="font-medium mb-2">Divider (Garis Penuh)</p>
            <Divider />
            <p className="mt-2 text-sm text-slate-500">Konten setelah divider.</p>
          </div>
          <div className="p-4 border rounded-lg bg-white dark:bg-slate-900 flex items-center gap-4">
            <span className="text-sm font-medium">Bagian A</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium text-slate-500">Bagian B</span>
          </div>
        </div>
      </ComponentDoc>
    </div>
  );
}
