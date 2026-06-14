import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/overlay/button'
import { Loader2 } from 'lucide-react'

export interface IUserFormActionsProps {
  onCancel: () => void
  isSubmitting: boolean
  submitLabel: string
  icon?: React.ReactNode
}

export const UserFormActions: React.FC<IUserFormActionsProps> = ({
  onCancel,
  isSubmitting,
  submitLabel,
  icon,
}) => {
  const { t } = useTranslation()
  return (
    <div className="flex justify-end gap-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        {t('common.cancel')}
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : icon}
        {submitLabel}
      </Button>
    </div>
  )
}
