// @ts-nocheck
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { LoginPage } from './index'
import { useAuth } from '@/hooks/use-auth'

// Mock dependencies
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({}),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      user: { role: 'employee' },
    }),
  },
}))

describe('LoginPage', () => {
  it('updates username and password fields', async () => {
    const mockLogin = vi.fn().mockResolvedValue({})
    vi.mocked(useAuth).mockReturnValue({ login: mockLogin } as any)

    render(<LoginPage />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)

    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(usernameInput).toHaveValue('admin')
    expect(passwordInput).toHaveValue('password123')
  })
})
