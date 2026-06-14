import { createFileRoute } from '@tanstack/react-router';
import { Alert, AlertTitle, AlertDescription, Spinner, Progress, Skeleton, LoadingState } from '@/shared/ui';
import { SectionHeading, ComponentDoc } from './-components/doc-utils';

export const Route = createFileRoute('/(public)/docs/feedback')({
  component: FeedbackSection,
});

function FeedbackSection() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeading title="Feedback Components" description="Komponen untuk memberikan status dan umpan balik kepada pengguna." />

      <ComponentDoc title="Loading State" description="Overlay loading yang menarik untuk transisi data.">
        <div className="w-full p-12 bg-white dark:bg-slate-900 border rounded-2xl">
          <LoadingState isLoading={true} />
        </div>
      </ComponentDoc>

      <ComponentDoc title="Alerts" description="Pesan informasi penting bagi pengguna.">
        <div className="space-y-4 w-full">
          <Alert variant="info">
            <AlertTitle>Informasi</AlertTitle>
            <AlertDescription>Sistem akan melakukan maintenance pada pukul 23.00 WIB malam ini.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <AlertTitle>Berhasil</AlertTitle>
            <AlertDescription>Data profil Anda telah diperbarui dengan sukses.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Gagal</AlertTitle>
            <AlertDescription>Terjadi kesalahan saat menghubungkan ke server. Silakan coba lagi.</AlertDescription>
          </Alert>
        </div>
      </ComponentDoc>

      <ComponentDoc title="Loading Indicators" description="Status loading saat data sedang diproses.">
        <div className="space-y-8 w-full">
          <div className="flex gap-8 items-center justify-center p-8 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Spinner size="sm" />
            <Spinner />
            <Spinner size="lg" />
          </div>
          
          <div className="space-y-4">
            <p className="text-sm font-medium">Progress Bar</p>
            <Progress value={45} />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">Skeleton (Placeholder)</p>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
        </div>
      </ComponentDoc>
    </div>
  );
}
