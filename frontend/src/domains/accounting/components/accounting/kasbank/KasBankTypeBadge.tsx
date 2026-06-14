import { KasBankTipe } from '@/domains/accounting/types/kasbank';
import { Badge } from '@/shared/ui';

const TIPE_CONFIG: Record<KasBankTipe, { label: string; className: string }> = {
  BKM: { label: 'BKM', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  BKK: { label: 'BKK', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
  BBM: { label: 'BBM', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  BBK: { label: 'BBK', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
};

interface KasBankTypeBadgeProps {
  tipe: string;
  label?: string;
}

export function KasBankTypeBadge({ tipe, label }: KasBankTypeBadgeProps) {
  const config = TIPE_CONFIG[tipe as KasBankTipe] ?? { label: tipe, className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
  return (
    <Badge className={config.className}>
      {label ?? config.label}
    </Badge>
  );
}