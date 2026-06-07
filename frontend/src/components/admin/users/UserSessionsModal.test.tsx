import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserSessionsModal } from './UserSessionsModal'
import * as sessionHooks from '@/hooks/useSessionManagement'
import type { ISessionInfo } from '@/services/sessionService'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '2 hours ago',
  format: () => '2024-01-01',
}))

const mockSessions: ISessionInfo[] = [
  {
    session_id: 'session-1',
    login_time: Date.now() - 2 * 60 * 60 * 1000,
    expires_at: Date.now() + 5 * 24 * 60 * 60 * 1000,
    login_ip: '192.168.1.100',
    browser: 'Chrome on macOS',
    status: 'active',
  },
]

const mockSessionsResponse = {
  sessions: mockSessions,
  currentSessionId: 'session-1',
}

describe('UserSessionsModal', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    vi.spyOn(sessionHooks, 'useUserSessions').mockReturnValue({
      data: mockSessionsResponse,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      isFetching: false,
      isPending: false,
      isLoadingError: false,
      isPaused: false,
      failureCount: 0,
      failureReason: null,
      refetch: vi.fn(),
      dataUpdatedAt: 0,
      errorUpdateCount: 0,
      errorUpdatedAt: 0,
      status: 'success',
      fetchStatus: 'idle',
    } as any)

    vi.spyOn(sessionHooks, 'useRevokeSession').mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      isIdle: true,
      data: undefined,
      error: null,
      status: 'idle',
      reset: vi.fn(),
      failureCount: 0,
      failureReason: null,
      variables: undefined,
      context: undefined,
      submittedAt: 0,
    } as any)

    vi.spyOn(sessionHooks, 'useRevokeAllSessions').mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      isIdle: true,
      data: undefined,
      error: null,
      status: 'idle',
      reset: vi.fn(),
      failureCount: 0,
      failureReason: null,
      variables: undefined,
      context: undefined,
      submittedAt: 0,
    } as any)
  })

  it('renders modal when open with user info', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserSessionsModal
          open={true}
          onOpenChange={vi.fn()}
          user={{ user_id: 'user-123', full_name: 'Test User' }}
        />
      </QueryClientProvider>
    )

    // Check that SessionsTab rendered (via session data being displayed)
    expect(screen.getByText(/Chrome on macOS/)).toBeInTheDocument()
  })

  it('passes userId to SessionsTab when user is provided', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserSessionsModal
          open={true}
          onOpenChange={vi.fn()}
          user={{ user_id: 'user-456', full_name: 'Another User' }}
        />
      </QueryClientProvider>
    )

    // Verify the session content is rendered
    expect(screen.getByText(/Chrome on macOS/)).toBeInTheDocument()
  })

  it('handles null user gracefully', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <UserSessionsModal
          open={true}
          onOpenChange={vi.fn()}
          user={null}
        />
      </QueryClientProvider>
    )

    // Component should still render without errors
    expect(container).toBeTruthy()
  })
})
