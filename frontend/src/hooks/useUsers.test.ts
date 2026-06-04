import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import {
  useUsers,
  USER_PERMISSION_STALE_TIME,
  USER_PERMISSION_GC_TIME,
} from './useUsers'
import { userService } from '@/services/userService'

// Stub out the toast hook so onSuccess / onError don't blow up in tests.
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

// Stub the network layer; we only care that the hooks call the right methods
// and configure the right cache keys.
vi.mock('@/services/userService', () => ({
  userService: {
    getUserMenuPermissions: vi.fn(),
    getUserReportPermissions: vi.fn(),
    getUserCoaAccess: vi.fn(),
    updatePermissions: vi.fn(),
  },
}))

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client }, children)
  return { wrapper, client }
}

describe('useUsers — per-tab permission hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(userService.getUserMenuPermissions).mockResolvedValue({
      success: true,
      message: 'ok',
      data: [],
    } as any)
    vi.mocked(userService.getUserReportPermissions).mockResolvedValue({
      success: true,
      message: 'ok',
      data: [],
    } as any)
    vi.mocked(userService.getUserCoaAccess).mockResolvedValue({
      success: true,
      message: 'ok',
      data: [],
    } as any)
    vi.mocked(userService.updatePermissions).mockResolvedValue({
      success: true,
      message: 'ok',
      data: null as any,
    } as any)
  })

  it('exposes the cache-time constants at 10 / 15 minutes', () => {
    expect(USER_PERMISSION_STALE_TIME).toBe(10 * 60 * 1000)
    expect(USER_PERMISSION_GC_TIME).toBe(15 * 60 * 1000)
  })

  it('useUserMenuPermissions calls the menu service and uses the menu cache key', async () => {
    const { wrapper, client } = makeWrapper()

    const { result } = renderHook(
      () => useUsers().useUserMenuPermissions('U-1', { enabled: true }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(userService.getUserMenuPermissions).toHaveBeenCalledWith('U-1')
    expect(userService.getUserReportPermissions).not.toHaveBeenCalled()
    expect(userService.getUserCoaAccess).not.toHaveBeenCalled()

    // Cache key shape: ['user-permissions', id, 'menu']
    const queries = client.getQueryCache().findAll({
      queryKey: ['user-permissions', 'U-1', 'menu'],
    })
    expect(queries.length).toBe(1)

    const opts = queries[0].options as unknown as {
      staleTime?: number
      gcTime?: number
    }
    expect(opts.staleTime).toBe(USER_PERMISSION_STALE_TIME)
    expect(opts.gcTime).toBe(USER_PERMISSION_GC_TIME)
  })

  it('useUserReportPermissions uses the report cache key', async () => {
    const { wrapper, client } = makeWrapper()

    const { result } = renderHook(
      () => useUsers().useUserReportPermissions('U-2', { enabled: true }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(userService.getUserReportPermissions).toHaveBeenCalledWith('U-2')
    const queries = client.getQueryCache().findAll({
      queryKey: ['user-permissions', 'U-2', 'report'],
    })
    expect(queries.length).toBe(1)
    const opts = queries[0].options as unknown as { staleTime?: number }
    expect(opts.staleTime).toBe(USER_PERMISSION_STALE_TIME)
  })

  it('useUserCoaAccess uses the coa cache key', async () => {
    const { wrapper, client } = makeWrapper()

    const { result } = renderHook(
      () => useUsers().useUserCoaAccess('U-3', { enabled: true }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(userService.getUserCoaAccess).toHaveBeenCalledWith('U-3')
    const queries = client.getQueryCache().findAll({
      queryKey: ['user-permissions', 'U-3', 'coa'],
    })
    expect(queries.length).toBe(1)
    const opts = queries[0].options as unknown as { staleTime?: number }
    expect(opts.staleTime).toBe(USER_PERMISSION_STALE_TIME)
  })

  it('useUpdateUserPermissions invalidates ALL three per-tab caches on success', async () => {
    const { wrapper, client } = makeWrapper()
    const spy = vi.spyOn(client, 'invalidateQueries')

    // Wrap the hook so we expose both the mutation and the underlying client.
    const { result } = renderHook(() => useUsers().useUpdateUserPermissions(), {
      wrapper,
    })

    await result.current.mutateAsync({
      id: 'U-9',
      data: { menu: [], report: [], coa: [] },
    })

    const calls = spy.mock.calls.map((c) => c[0]?.queryKey)
    expect(calls).toEqual(
      expect.arrayContaining([
        ['user-permissions', 'U-9', 'menu'],
        ['user-permissions', 'U-9', 'report'],
        ['user-permissions', 'U-9', 'coa'],
      ])
    )
  })
})
