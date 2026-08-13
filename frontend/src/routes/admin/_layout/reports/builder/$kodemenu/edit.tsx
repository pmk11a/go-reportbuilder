import { createFileRoute } from '@tanstack/react-router';
import { ReportBuilder } from '@/domains/reports/components/reports/builder';

export const Route = createFileRoute('/admin/_layout/reports/builder/$kodemenu/edit')({
  component: ReportBuilderPage,
});

function ReportBuilderPage() {
  const { kodemenu } = Route.useParams();
  
  return (
    <div className="w-full h-screen">
      <ReportBuilder kodeMenu={kodemenu} />
    </div>
  );
}
