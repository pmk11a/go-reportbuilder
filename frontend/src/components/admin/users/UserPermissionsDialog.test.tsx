import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserPermissionsDialog } from './UserPermissionsDialog'
import { useUsers } from '@/hooks/useUsers'

// ─── i18n stub: return the part after the last "." for compact assertions ───
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: any) => {
      if (typeof fallback === 'string') return fallback
      const parts = key.split('.')
      return parts[parts.length - 1]
    },
  }),
}))

// ─── Mock the Tabs component so all tab contents render at once.
//      Without this, the "menu" tab is the only one mounted by default and
//      we'd be testing only it. Keeping the simpler form is fine here because
//      we are validating the Read column behaviour in the menu tab.
vi.mock('@/components/ui', async (orig) => {
  const actual = await orig<any>()
  return {
    ...actual,
    // Dialog primitives mocked because Radix's portal+presence triggers
    // an infinite update loop under JSDOM.
    Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
    DialogContent: ({ children, className }: any) => (
      <div data-testid="dialog-content" className={className}>{children}</div>
    ),
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    Tabs: ({ tabs, onValueChange }: any) => (
      <div>
        {tabs.map((tab: any) => (
          <button
            key={tab.value}
            data-testid={`tab-${tab.value}`}
            onClick={() => onValueChange?.(tab.value)}
          >
            {tab.label}
          </button>
        ))}
        {tabs.map((tab: any) => (
          <div key={`content-${tab.value}`} data-testid={`tab-content-${tab.value}`}>
            {tab.content}
          </div>
        ))}
      </div>
    ),
  }
})

// ─── Mock useUsers ───
vi.mock('@/hooks/useUsers', () => ({
  useUsers: vi.fn(),
}))

const mockMenuRow = {
  kodemenu: 'MENU-001',
  keterangan: 'Sample Menu',
  l0: 0,
  l1: 0,
  l2: 0,
  l3: 0,
  icon: '',
  routename: null,
  checked: 0,
  aktif: 0,
  access: 0,
  has_access: 0,
  is_create: 0,
  is_update: 0,
  is_delete: 0,
  is_print: 0,
  is_export: 0,
  is_approve_1: 0,
  is_approve_2: 0,
  is_approve_3: 0,
  is_approve_4: 0,
  is_approve_5: 0,
}

// Stable references so the useEffect in the dialog doesn't loop on
// renderer-recreated arrays.
const STABLE_MENU_DATA = [mockMenuRow]
const STABLE_REPORT_DATA: typeof STABLE_MENU_DATA = []
const STABLE_COA_DATA: any[] = []

describe('UserPermissionsDialog — Read column bug fix (TASK-009)', () => {
  let queryClient: QueryClient
  const mockMutate = vi.fn()
  const mockUpdate = { mutate: mockMutate, isPending: false }

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    vi.clearAllMocks()

    vi.mocked(useUsers).mockReturnValue({
      useUsersList: vi.fn() as any,
      useCreateUser: vi.fn() as any,
      useUpdateUser: vi.fn() as any,
      useDeleteUser: vi.fn() as any,
      useUserMenuPermissions: ((_id: any, _opts: any) => ({
        data: STABLE_MENU_DATA,
        isLoading: false,
      })) as any,
      useUserReportPermissions: ((_id: any, _opts: any) => ({
        data: STABLE_REPORT_DATA,
        isLoading: false,
      })) as any,
      useUserCoaAccess: ((_id: any, _opts: any) => ({
        data: STABLE_COA_DATA,
        isLoading: false,
      })) as any,
      useUpdateUserPermissions: (() => mockUpdate) as any,
    })
  })

  it('Read column writes to has_access (not is_create) and the save payload reflects that', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserPermissionsDialog
          open={true}
          onOpenChange={vi.fn()}
          user={{ user_id: 'U-1', full_name: 'Test User' }}
        />
      </QueryClientProvider>
    )

    // The first row in the menu tab has 11 permission checkboxes (Read +
    // Create + Update + Delete + Print + Export + Approve_1..5).
    // We assert the Read column toggles a *different* field than Create.
    const menuContent = screen.getByTestId('tab-content-menu')
    const checkboxes = within(menuContent).getAllByRole('checkbox')

    // First checkbox in the row = Read (has_access). Click it.
    expect(checkboxes.length).toBeGreaterThanOrEqual(11)
    const readCheckbox = checkboxes[0]
    fireEvent.click(readCheckbox)

    // Save and inspect what got dispatched to the mutation.
    fireEvent.click(screen.getByText('save_changes'))

    expect(mockMutate).toHaveBeenCalledTimes(1)
    const payload = mockMutate.mock.calls[0][0]
    expect(payload.id).toBe('U-1')
    expect(payload.data.menu).toHaveLength(1)

    const savedRow = payload.data.menu[0]
    // The bug fix asserts: clicking Read flips `checked` (NOT `is_create`).
    expect(savedRow.checked).toBe(1)
    expect(savedRow.is_create).toBe(0)
  })

  it('Create column still writes to is_create (regression check)', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserPermissionsDialog
          open={true}
          onOpenChange={vi.fn()}
          user={{ user_id: 'U-1', full_name: 'Test User' }}
        />
      </QueryClientProvider>
    )

    const menuContent = screen.getByTestId('tab-content-menu')
    const checkboxes = within(menuContent).getAllByRole('checkbox')
    // Second checkbox in the row = Create (is_create).
    fireEvent.click(checkboxes[1])

    fireEvent.click(screen.getByText('save_changes'))

    expect(mockMutate).toHaveBeenCalledTimes(1)
    const savedRow = mockMutate.mock.calls[0][0].data.menu[0]
    expect(savedRow.is_create).toBe(1)
    expect(savedRow.checked).toBe(0)
  })
})
