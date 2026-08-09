import { createFileRoute } from '@tanstack/react-router';
import { ReportBuilder } from '@/domains/reports/components/reports/builder';

export const Route = createFileRoute('/admin/_layout/reports/builder')({
  component: ReportBuilderPage,
});

function ReportBuilderPage() {
  return (
    <div className="w-full h-screen">
      <ReportBuilder />
    </div>
  );
}
