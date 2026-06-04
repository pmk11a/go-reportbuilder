import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserFormDialog } from './UserFormDialog'
import { useUsers } from '@/hooks/useUsers'

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      if (key.includes('full_name_label') || key.includes('full_name')) return 'Full Name'
      if (key.includes('username_label') || key.includes('username')) return 'Username'
      if (key.includes('password_label') || key.includes('password')) return 'Password'
      if (key === 'add_user') return 'Add User'
      if (key === 'edit_user') return 'Edit User'
      return fallback || key
    },
  }),
}))

// Mock hooks
vi.mock('@/hooks/useUsers', () => ({
  useUsers: vi.fn(),
}))

// Mock standard select component (radix select needs a portal/layout mock occasionally in JSDOM)
vi.mock('@/components/ui', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    Select: ({ children, onValueChange, value }: any) => (
      <select data-testid="select" value={value} onChange={(e) => onValueChange(e.target.value)}>
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  }
})

describe('UserFormDialog', () => {
  let queryClient: QueryClient
  const mockCreateMutate = vi.fn()
  const mockUpdateMutate = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: 0,
          retry: false,
        },
      },
    })
    vi.clearAllMocks()

    vi.mocked(useUsers).mockReturnValue({
      useUsersList: vi.fn() as any,
      useCreateUser: () => ({
        mutate: mockCreateMutate,
        isPending: false,
      }) as any,
      useUpdateUser: () => ({
        mutate: mockUpdateMutate,
        isPending: false,
      }) as any,
      useDeleteUser: vi.fn() as any,
      useUserMenuPermissions: vi.fn() as any,
      useUserReportPermissions: vi.fn() as any,
      useUserCoaAccess: vi.fn() as any,
      useUpdateUserPermissions: vi.fn() as any,
    })
  })

  it('renders standard fields correctly when creating a user', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserFormDialog open={true} onOpenChange={vi.fn()} user={null} />
      </QueryClientProvider>
    )

    expect(screen.getByText('Add User')).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('renders pre-filled fields correctly when editing a user', () => {
    const mockUser = {
      username: 'johndoe',
      full_name: 'John Doe',
      tingkat: '2',
      status: '1',
      user_id: 'ADMIN',
    }

    render(
      <QueryClientProvider client={queryClient}>
        <UserFormDialog open={true} onOpenChange={vi.fn()} user={mockUser} />
      </QueryClientProvider>
    )

    expect(screen.getByText('Edit User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ADMIN')).toBeInTheDocument()
  })
})
