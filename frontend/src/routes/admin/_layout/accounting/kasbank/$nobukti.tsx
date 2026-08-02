import { createFileRoute } from '@tanstack/react-router';
// import {} from 'react';
// import {} from '@/domains/accounting/types/kasbank';
import { KasBankDetailPage } from '@/domains/accounting/components/accounting/kasbank/KasBankDetailPage';

export const Route = createFileRoute('/admin/_layout/accounting/kasbank/$nobukti')({
  component: KasBankDetailRoute,
});

function KasBankDetailRoute() {
  const { nobukti } = Route.useParams();
  return <KasBankDetailPage nobukti={nobukti} />;
}
