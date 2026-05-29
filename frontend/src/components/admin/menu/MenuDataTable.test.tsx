import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MenuDataTable } from './MenuDataTable'
import React from 'react'

// Mock custom hooks
vi.mock('@/hooks/useMenu', () => ({
  useMenus: vi.fn(() => ({
    data: { data: [{ KODEMENU: 'M01', Keterangan: 'Test Menu', L0: 0, ACCESS: 0, OL: 0, Icon: 'home' }] },
    isLoading: false
  })),
  useDeleteMenu: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false
  })),
  menuKeys: { all: ['menus'] }
}))

// Mock Dialog Form to avoid rendering complexities
vi.mock('./MenuFormDialog', () => ({
  MenuFormDialog: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div data-testid="mock-dialog">Dialog</div> : null
}))

// Mock matchMedia for Radix UI
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('MenuDataTable Component', () => {
  const queryClient = new QueryClient()

  it('renders table headers correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MenuDataTable />
      </QueryClientProvider>
    )
    expect(screen.getByText('Kode Menu')).toBeInTheDocument()
    expect(screen.getByText('Keterangan')).toBeInTheDocument()
    expect(screen.getByText('Level (L0)')).toBeInTheDocument()
  })

  it('renders data from useMenus hook', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MenuDataTable />
      </QueryClientProvider>
    )
    expect(screen.getByText('M01')).toBeInTheDocument()
    expect(screen.getByText('Test Menu')).toBeInTheDocument()
  })
})
