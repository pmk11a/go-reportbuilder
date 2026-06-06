import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui'
import { SessionsTab } from './SessionsTab'
import type { IDbflpass } from '@/types/user'

interface IUserSessionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: IDbflpass | null
}

/**
 * UserSessionsModal displays a modal dialog showing all active sessions
 * for a specific user. Provides options to revoke individual sessions
 * or all sessions at once.
 */
export function UserSessionsModal({
  open,
  onOpenChange,
  user,
}: IUserSessionsModalProps) {
  const { t } = useTranslation(['users', 'sessions', 'common'])

  const userId = user?.user_id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('sessions:title', 'Active Sessions')}
          </DialogTitle>
          <DialogDescription>
            {t('users:dialog.session_description', 'View and manage active sessions for this user.')}
            {user?.full_name && ` (${user.full_name})`}
          </DialogDescription>
        </DialogHeader>

        {userId && <SessionsTab userId={userId} />}
      </DialogContent>
    </Dialog>
  )
}
