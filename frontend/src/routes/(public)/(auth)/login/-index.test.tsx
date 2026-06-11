// @ts-nocheck
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { LoginPage } from './index'
import { useAuth } from '@/domains/auth/hooks/use-auth'

// Mock dependencies
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({
    useSearch: () => ({ redirect: '' })
  }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/domains/auth/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
      },
    }
  },
}))

vi.mock('@/shared/stores/authStore', () => {
  const useAuthStore = vi.fn().mockImplementation((selector) => {
    if (typeof selector === 'function') {
      return selector({ isInitialized: true, user: null });
    }
    return { isInitialized: true, user: null };
  });
  useAuthStore.getState = () => ({ user: { role: 'employee' } });
  return { useAuthStore };
});

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
