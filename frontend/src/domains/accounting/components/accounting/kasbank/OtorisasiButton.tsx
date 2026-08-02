import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IKasBankHeader } from '@/domains/accounting/types/kasbank';
import { useAuthStore } from '@/shared/stores/authStore';
import { useSetOtorisasi, useBatalOtorisasi } from '@/domains/accounting/hooks/useKasBank';
import { Button } from '@/shared/ui/overlay/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/overlay/alert-dialog';
import { Each, Show } from '@/shared/ui/layout/Render';
import { Ban, CheckCircle, MinusCircle, ShieldCheck, Undo2,  } from 'lucide-react';
import { CustomTooltip } from '@/shared/ui/feedback/custom-tooltip';
import { useToast } from '@/shared/hooks/use-toast';

export type TOtorisasiLevel = 1 | 2 | 3 | 4 | 5;

/* ===== Shared helpers ===== */

function isLevelApproved(voucher: IKasBankHeader, level: TOtorisasiLevel): boolean {
  switch (level) {
    case 1: return voucher.otorisasi1;
    case 2: return voucher.otorisasi2;
    case 3: return voucher.otorisasi3;
    case 4: return voucher.otorisasi4;
    case 5: return voucher.otorisasi5;
    default: return false;
  }
}

function getOtorisasiUser(voucher: IKasBankHeader, level: TOtorisasiLevel): string {
  switch (level) {
    case 1: return voucher.otouser1;
    case 2: return voucher.otouser2;
    case 3: return voucher.otouser3;
    case 4: return voucher.otouser4;
    case 5: return voucher.otouser5;
    default: return '';
  }
}

function getOtorisasiDate(voucher: IKasBankHeader, level: TOtorisasiLevel): string | null {
  switch (level) {
    case 1: return voucher.tgloto1;
    case 2: return voucher.tgloto2;
    case 3: return voucher.tgloto3;
    case 4: return voucher.tgloto4;
    case 5: return voucher.tgloto5;
    default: return null;
  }
}

function formatOtorisasiDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID');
}

/* ===== Auth level logic hook — reusable by both table and detail views ===== */

function useAuthLevelState(voucher: IKasBankHeader, level: TOtorisasiLevel) {
  const approved = isLevelApproved(voucher, level);
  const user = getOtorisasiUser(voucher, level);
  const date = getOtorisasiDate(voucher, level);
  const formattedDate = formatOtorisasiDate(date);

  let isNext = false;
  if (!approved && !voucher.locked) {
    isNext = true;
    for (let i = 1; i < level; i++) {
      const prev = i as TOtorisasiLevel;
      if (!isLevelApproved(voucher, prev)) {
        isNext = false;
        break;
      }
    }
  }

  const isFullyLocked = voucher.locked && approved;
  return { approved, user, formattedDate, isNext, isFullyLocked };
}

/* ===== Shared badge/renderer for a single authorization level ===== */

export function AuthLevelBadge({ voucher, level }: { voucher: IKasBankHeader; level: TOtorisasiLevel }) {
  const { t } = useTranslation(['accounting', 'common']);
  const { approved, user, formattedDate, isNext, isFullyLocked } = useAuthLevelState(voucher, level);

  if (isFullyLocked) {
    return (
      <div className="flex items-center justify-center gap-1 py-0.5">
        <CustomTooltip
          rows={[
            { label: t('otorisasi.approved_by'), value: user || '-' },
            { label: t('otorisasi.approved_at'), value: formattedDate },
          ]}
        >
          <span className="inline-flex items-center justify-center h-6 min-w-[48px] rounded-md border border-emerald-200 bg-emerald-50 px-1.5 text-xs font-medium text-emerald-700 cursor-help dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3 mr-0.5 shrink-0" />
            <span className="truncate ml-0.5">{user || '?'}</span>
          </span>
        </CustomTooltip>
        <CancelLevelButton level={level} voucher={voucher} otouser={user} />
      </div>
    );
  }

  if (voucher.locked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <MinusCircle className="h-3 w-3" />
        —
      </span>
    );
  }

  if (approved) {
    return (
      <div className="flex items-center justify-center gap-1 py-0.5">
        <CustomTooltip
          rows={[
            { label: t('otorisasi.approved_by'), value: user || '-' },
            { label: t('otorisasi.approved_at'), value: formattedDate },
          ]}
        >
          <span className="inline-flex items-center justify-center h-6 min-w-[48px] rounded-md border border-emerald-200 bg-emerald-50 px-1.5 text-xs font-medium text-emerald-700 cursor-help dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3 mr-0.5 shrink-0" />
            {user ? (
              <span className="truncate ml-0.5">{user}</span>
            ) : (
              <span className="ml-0.5">{formattedDate}</span>
            )}
          </span>
        </CustomTooltip>
        <CancelLevelButton level={level} voucher={voucher} otouser={user} />
      </div>
    );
  }

  if (isNext) {
    return <AuthorizeLevelButton level={level} voucher={voucher} />;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-400 dark:bg-slate-800">
      <span>—</span>
    </span>
  );
}

/* ===== Table cell renderer — wraps badge in <td> ===== */

export function AuthLevelCell({ voucher, level }: { voucher: IKasBankHeader; level: TOtorisasiLevel }) {
  return (
    <td className="whitespace-nowrap px-2 py-1.5 text-center align-middle">
      <AuthLevelBadge voucher={voucher} level={level} />
    </td>
  );
}

/* ===== Export hook for detail page reuse ===== */
export { useAuthLevelState };

/* ===== Cancel authorization icon button — hidden if not the authorizer ===== */

function CancelLevelButton({
  level,
  voucher,
  otouser,
}: {
  level: TOtorisasiLevel;
  voucher: IKasBankHeader;
  otouser: string;
}) {
  const { t } = useTranslation(['accounting', 'common']);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const batalOto = useBatalOtorisasi(
    voucher.nobukti,
    () => {
      setOpen(false);
      toast({ title: t('messages.otorisasi_canceled'), variant: 'success' });
    },
    (msg) => {
      setOpen(false);
      toast({ title: msg, variant: 'destructive' });
    },
  );

  const currentUser = useAuthStore(s => s.user);
  const isAuthorizer = currentUser?.username === otouser || currentUser?.user_id === otouser;

  if (!isAuthorizer) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-500">
          <Ban className="h-3 w-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('actions.cancel_authorization')}</AlertDialogTitle>
          <AlertDialogDescription>{t('messages.confirm_batal_level', { level })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => batalOto.mutate({ level, action: 'cancel' })} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
            {t('actions.yes_cancel')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ===== Authorize icon button ===== */

function AuthorizeLevelButton({ level, voucher }: { level: TOtorisasiLevel; voucher: IKasBankHeader }) {
  const { t } = useTranslation(['accounting', 'common']);
  const { toast } = useToast();
  const setOto = useSetOtorisasi(
    voucher.nobukti,
    () => {
      toast({ title: t('messages.otorisasi_level_success', { level }), variant: 'success' });
    },
    (msg) => {
      toast({ title: msg, variant: 'destructive' });
    },
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('actions.authorize_level', { level })}</AlertDialogTitle>
          <AlertDialogDescription>{t('messages.confirm_otorisasi_level', { level })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => setOto.mutate({ level, action: 'set' })}>
            {t('actions.confirm_auth')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ===== Legacy wrapper: used for locked-state global Batal Otorisasi button ===== */

interface OtorisasiButtonProps {
  voucher: IKasBankHeader;
  onSuccess?: () => void;
}

export function OtorisasiButton({ voucher, onSuccess }: OtorisasiButtonProps) {
  const { t } = useTranslation(['accounting', 'common']);
  const [showBatal, setShowBatal] = useState(false);
  const { toast } = useToast();
  const batalOto = useBatalOtorisasi(
    voucher.nobukti,
    () => {
      setShowBatal(false);
      toast({ title: t('messages.otorisasi_canceled'), variant: 'success' });
      onSuccess?.();
    },
    (msg) => {
      setShowBatal(false);
      toast({ title: msg, variant: 'destructive' });
    },
  );
  const currentUser = useAuthStore(s => s.user);

  const approvedLevels = Array.from({ length: voucher.maxol }, (_, i) => (i + 1) as TOtorisasiLevel)
    .filter((level) => {
      if (!isLevelApproved(voucher, level)) return false;
      const levelUser = getOtorisasiUser(voucher, level);
      // Only include if current user matches the authorizer
      return currentUser?.username === levelUser || currentUser?.user_id === levelUser;
    });

  const canCancel = approvedLevels.length > 0;

  return (
    <div className="flex items-center gap-2">
      <Show when={voucher.locked}>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle className="h-3 w-3" />
          {t('otorisasi.locked')}
        </span>
        <Show when={canCancel}>
          <AlertDialog open={showBatal} onOpenChange={setShowBatal}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('actions.batal_otorisasi')}</AlertDialogTitle>
              <AlertDialogDescription>{t('messages.confirm_batal')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
              <Each of={approvedLevels}>
                {(level) => (
                  <AlertDialogAction onClick={() => batalOto.mutate({ level, action: 'cancel' })}>
                    {t('otorisasi.level', { level })}
                  </AlertDialogAction>
                )}
              </Each>
            </AlertDialogFooter>
          </AlertDialogContent>
          </AlertDialog>
        </Show>
      </Show>
    </div>
  );
}

/* Export shared helpers for reuse in DataTable */
export { isLevelApproved, getOtorisasiUser, getOtorisasiDate, formatOtorisasiDate };
