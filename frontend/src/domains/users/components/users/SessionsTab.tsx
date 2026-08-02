import  { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { id, enUS } from 'date-fns/locale'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { Loader2, AlertCircle } from 'lucide-react'
import { useUserSessions, useRevokeSession, useRevokeAllSessions } from '@/domains/auth/hooks/useSessionManagement'
import { Each, Show } from '@/shared/ui/layout/Render'
import type { ISessionInfo } from '@/domains/auth/services/sessionService'

interface ISessionsTabProps {
  userId: string | number
}

/**
 * SessionsTab renders the active sessions list for a user within the User Detail Modal.
 * Users can revoke individual sessions or all sessions at once with confirmation dialogs.
 * Shows session metadata: login time, expiry, IP address, browser, status.
 */
export function SessionsTab({ userId }: ISessionsTabProps) {
  const { t, i18n } = useTranslation(['sessions', 'common'])
  const dateLocale = i18n.language === 'id' ? id : enUS

  const { data: sessionsResponse, isLoading, isError, error } = useUserSessions(userId)
  const sessions = sessionsResponse?.sessions
  const currentSessionId = sessionsResponse?.currentSessionId
  const revokeSession = useRevokeSession(userId)
  const revokeAll = useRevokeAllSessions(userId)

  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false)
  const [revokeAllConfirmOpen, setRevokeAllConfirmOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-red-700 dark:text-red-300">
          {t('common.error', 'Error')}: {error?.message || t('sessions.loadingFailed', 'Failed to load sessions')}
        </div>
      </div>
    )
  }

  const now = Date.now()

  // Determine if session is expiring soon (less than 1 hour remaining)
  const isExpiringKoon = (expiresAt: number): boolean => {
    return expiresAt - now > 0 && expiresAt - now < 1 * 60 * 60 * 1000
  }

  // Determine if session is already expired
  const isExpired = (expiresAt: number): boolean => {
    return now > expiresAt
  }

  // Mask IP address for privacy: show only first 3 octets
  function maskIP(ip: string): string {
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.***`
    }
    return ip
  }

  // Get badge variant based on session status
  function getStatusBadgeVariant(session: ISessionInfo): 'success' | 'warning' | 'secondary' {
    if (isExpired(session.expires_at)) {
      return 'secondary'
    }
    if (isExpiringKoon(session.expires_at)) {
      return 'warning'
    }
    return 'success'
  }

  // Get status label based on session status
  function getStatusLabel(session: ISessionInfo): string {
    if (isExpired(session.expires_at)) {
      return t('sessions.expired', 'Expired')
    }
    if (isExpiringKoon(session.expires_at)) {
      return t('sessions.expiringKoon', 'Expiring Soon')
    }
    return t('sessions.active', 'Active')
  }

  return (
    <div className="space-y-4 p-4">
      {/* Bulk Revoke All Sessions Button */}
      <Show when={(sessions?.length ?? 0) > 0}>
        <AlertDialog open={revokeAllConfirmOpen} onOpenChange={setRevokeAllConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              {t('sessions.revokeAll', 'Logout All Sessions')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>
              {t('sessions.confirmRevokeAll', 'Logout All Sessions?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('sessions.revokeAllDescription', 'This will immediately logout the user from all {{count}} active sessions. They will need to log in again.', {
                count: sessions?.length || 0,
              })}
            </AlertDialogDescription>
            <div className="flex gap-2 justify-end pt-4">
              <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  revokeAll.mutate(undefined, {
                    onSuccess: () => setRevokeAllConfirmOpen(false),
                  })
                }}
                disabled={revokeAll.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {revokeAll.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('sessions.confirm', 'Confirm')}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </Show>

      {/* Session List Table */}
      <Show
        when={(sessions?.length ?? 0) > 0}
        fallback={
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            {t('sessions.noActiveSessions', 'No active sessions')}
          </div>
        }
      >
        <div className="rounded-lg border border-primary-300 dark:border-white/5 overflow-hidden">
          <Table>
            <TableHeader className="bg-primary-600 dark:bg-white/5 border-b-2 border-primary-700 dark:border-white/10 [&_tr]:hover:bg-transparent">
              <TableRow>
                <TableHead className="text-white dark:text-primary-400 uppercase text-xs tracking-wider">{t('sessions.session', 'Session')}</TableHead>
                <TableHead className="text-white dark:text-primary-400 uppercase text-xs tracking-wider">{t('sessions.status', 'Status')}</TableHead>
                <TableHead className="text-white dark:text-primary-400 uppercase text-xs tracking-wider">{t('sessions.loginTime', 'Login Time')}</TableHead>
                <TableHead className="text-white dark:text-primary-400 uppercase text-xs tracking-wider">{t('sessions.expiresAt', 'Expires')}</TableHead>
                <TableHead className="text-white dark:text-primary-400 uppercase text-xs tracking-wider">{t('sessions.ipAddress', 'IP Address')}</TableHead>
                <TableHead className="text-white dark:text-primary-400 uppercase text-xs tracking-wider">{t('sessions.browser', 'Browser')}</TableHead>
                <TableHead className="text-right text-white dark:text-primary-400 uppercase text-xs tracking-wider">{t('common.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Each of={sessions || []}>
                {(session: ISessionInfo) => (
                  <TableRow key={session.session_id} className="border-b border-primary-300 dark:border-white/5 hover:bg-primary-50/50 dark:hover:bg-white/5 transition-colors">
                    {/* Session indicator */}
                    <TableCell>
                      <Show
                        when={session.session_id === currentSessionId}
                        fallback={<span className="block w-2 h-2" />}
                      >
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                          </span>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            {t('sessions.current', 'Current')}
                          </span>
                        </div>
                      </Show>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(session)}>
                        {getStatusLabel(session)}
                      </Badge>
                    </TableCell>

                    {/* Login Time */}
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {format(new Date(session.login_time), 'dd MMM yyyy, HH:mm:ss', { locale: dateLocale })}
                    </TableCell>

                    {/* Expires At */}
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {format(new Date(session.expires_at), 'dd MMM yyyy, HH:mm:ss', { locale: dateLocale })}
                    </TableCell>

                    {/* IP Address (masked) */}
                    <TableCell className="font-mono text-slate-500 dark:text-slate-400">
                      {maskIP(session.login_ip)}
                    </TableCell>

                    {/* Browser */}
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {session.browser || '-'}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <AlertDialog open={revokeConfirmOpen} onOpenChange={setRevokeConfirmOpen}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isExpired(session.expires_at) || revokeSession.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            {t('sessions.revoke', 'Logout')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogTitle>
                            {t('sessions.confirmRevoke', 'Logout This Session?')}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('sessions.revokeDescription', 'This will immediately logout the user from this device.')}
                          </AlertDialogDescription>
                          <div className="flex gap-2 justify-end pt-4">
                            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                revokeSession.mutate(session.session_id, {
                                  onSuccess: () => setRevokeConfirmOpen(false),
                                })
                              }}
                              disabled={revokeSession.isPending}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {revokeSession.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              {t('sessions.confirm', 'Confirm')}
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )}
              </Each>
            </TableBody>
          </Table>
        </div>
      </Show>
    </div>
  )
}
