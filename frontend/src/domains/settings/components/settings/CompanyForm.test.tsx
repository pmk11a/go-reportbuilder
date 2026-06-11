import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyForm } from './CompanyForm';
import { useSettings } from '@/domains/settings/hooks/useSettings';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

// Mock hook
vi.mock('@/shared/hooks/useSettings', () => ({
  useSettings: vi.fn(),
}));

describe('CompanyForm', () => {
  let queryClient: QueryClient;
  const mockMutate = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: 0,
          retry: false,
        },
      },
    });
    vi.clearAllMocks();

    const stableData = { kode: '01', nama: 'Test Company' };
    (useSettings as any).mockReturnValue({
      useCompany: () => ({
        data: stableData,
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
      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    });
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
    
    // Skeleton renders divs with animate-pulse class
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
