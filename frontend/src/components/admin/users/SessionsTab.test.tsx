import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionsTab } from './SessionsTab'
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
  {
    session_id: 'session-2',
    login_time: Date.now() - 30 * 60 * 1000,
    expires_at: Date.now() + 30 * 60 * 1000,
    login_ip: '10.0.0.50',
    browser: 'Firefox on Windows',
    status: 'active',
  },
  {
    session_id: 'session-3',
    login_time: Date.now() - 10 * 24 * 60 * 60 * 1000,
    expires_at: Date.now() - 1 * 60 * 60 * 1000,
    login_ip: '172.16.0.1',
    browser: 'Safari on iOS',
    status: 'expired',
  },
]

describe('SessionsTab', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    vi.spyOn(sessionHooks, 'useUserSessions').mockReturnValue({
      data: mockSessions,
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

  it('renders session list with all sessions', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SessionsTab userId="user-1" />
      </QueryClientProvider>
    )

    expect(screen.getByText(/Chrome on macOS/)).toBeInTheDocument()
    expect(screen.getByText(/Firefox on Windows/)).toBeInTheDocument()
    expect(screen.getByText(/Safari on iOS/)).toBeInTheDocument()
  })

  it('masks IP addresses for privacy', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SessionsTab userId="user-1" />
      </QueryClientProvider>
    )

    expect(screen.getByText('192.168.1.***')).toBeInTheDocument()
    expect(screen.getByText('10.0.0.***')).toBeInTheDocument()
    expect(screen.getByText('172.16.0.***')).toBeInTheDocument()
  })

  it('shows "No active sessions" when empty', () => {
    vi.spyOn(sessionHooks, 'useUserSessions').mockReturnValue({
      data: [],
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

    render(
      <QueryClientProvider client={queryClient}>
        <SessionsTab userId="user-1" />
      </QueryClientProvider>
    )

    expect(screen.getByText(/No active sessions/)).toBeInTheDocument()
  })

  it('displays status badges correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SessionsTab userId="user-1" />
      </QueryClientProvider>
    )

    // Check that status badges are rendered
    const badges = screen.getAllByRole('generic').filter(
      (el) => el.textContent === 'Active' || el.textContent === 'Expiring Soon' || el.textContent === 'Expired'
    )
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it('shows "Logout All Sessions" button when sessions exist', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SessionsTab userId="user-1" />
      </QueryClientProvider>
    )

    const logoutAllButton = screen.queryByRole('button', { name: /Logout All Sessions/i })
    expect(logoutAllButton).toBeTruthy()
  })
})
