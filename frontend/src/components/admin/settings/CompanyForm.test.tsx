import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyForm } from './CompanyForm';
import { useSettings } from '@/hooks/useSettings';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

// Mock hook
vi.mock('@/hooks/useSettings', () => ({
  useSettings: vi.fn(),
}));

describe('CompanyForm', () => {
  let queryClient: QueryClient;
  const mockMutate = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();

    (useSettings as any).mockReturnValue({
      useCompany: () => ({
        data: { kode: '01', nama: 'Test Company' },
        isLoading: false,
      }),
      useUpdateCompany: () => ({
        mutate: mockMutate,
        isPending: false,
      }),
    });
  });

  it('renders correctly with default data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CompanyForm />
      </QueryClientProvider>
    );

    // Wait for the form to populate
    await waitFor(() => {
      const codeInput = screen.getByLabelText('Code') as HTMLInputElement;
      expect(codeInput.value).toBe('01');
    });

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    expect(nameInput.value).toBe('Test Company');
  });

  it('shows loading spinner when data is loading', () => {
    (useSettings as any).mockReturnValue({
      useCompany: () => ({
        data: undefined,
        isLoading: true,
      }),
      useUpdateCompany: () => ({
        mutate: mockMutate,
        isPending: false,
      }),
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <CompanyForm />
      </QueryClientProvider>
    );
    
    // Based on the Spinner component rendering an SVG typically
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
