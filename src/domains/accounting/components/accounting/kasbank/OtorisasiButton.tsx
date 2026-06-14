import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IKasBankHeader } from '@/domains/accounting/kasbank';
import { useSetOtorisasi, useBatalOtorisasi } from '@/domains/accounting/hooks/useKasBank';
import { Button } from '@/shared/ui/overlay/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/shared/ui/overlay/alert-dialog';
import { CheckCircle, XCircle, Undo2 } from 'lucide-react';

interface OtorisasiButtonProps {
  voucher: IKasBankHeader;
  onSuccess?: () => void;
}

export function OtorisasiButton({ voucher, onSuccess }: OtorisasiButtonProps) {
  const { t } = useTranslation(['accounting', 'common']);
  const [showBatal, setShowBatal] = useState(false);
  const setOto = useSetOtorisasi(voucher.nobukti, onSuccess);
  const batalOto = useBatalOtorisasi(voucher.nobukti, onSuccess);

  const handleOtorisasi = (level: 1 | 2) => {
    setOto.mutate({ level, action: 'set' });
  };

  const handleBatal = (level: 1 | 2) => {
    batalOto.mutate({ level, action: 'cancel' });
    setShowBatal(false);
  };

  if (voucher.locked) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle className="h-3 w-3" />
          {t('otorisasi.locked')}
        </span>
        <AlertDialog open={showBatal} onOpenChange={setShowBatal}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Undo2 className="h-3 w-3 mr-1" />
              {t('actions.batal_otorisasi')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('actions.batal_otorisasi')}</AlertDialogTitle>
              <AlertDialogDescription>{t('messages.confirm_batal')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleBatal(1)}>
                {t('otorisasi.level1')}
              </AlertDialogAction>
              <AlertDialogAction onClick={() => handleBatal(2)}>
                {t('otorisasi.level2')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {voucher.otorisasi1 ? (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium dark:bg-blue-900/30 dark:text-blue-400">
          <CheckCircle className="h-3 w-3" />
          {t('otorisasi.level1')}
        </span>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400">
              {t('actions.otorisasi1')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('actions.otorisasi1')}</AlertDialogTitle>
              <AlertDialogDescription>{t('messages.confirm_otorisasi1')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleOtorisasi(1)}>
                {t('actions.otorisasi1')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {voucher.otorisasi1 && !voucher.otorisasi2 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400">
              {t('actions.otorisasi2')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('actions.otorisasi2')}</AlertDialogTitle>
              <AlertDialogDescription>{t('messages.confirm_otorisasi2')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleOtorisasi(2)}>
                {t('actions.otorisasi2')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {!voucher.otorisasi1 && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium dark:bg-slate-800 dark:text-slate-400">
          <XCircle className="h-3 w-3" />
          {t('otorisasi.pending')}
        </span>
      )}
    </div>
  );
}