import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NumberingForm } from './NumberingForm';
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

describe('NumberingForm', () => {
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

    const stableData = { nobkk: 'BKK-PREFIX', bkk: 123 };
    (useSettings as any).mockReturnValue({
      useNumbering: () => ({
        data: stableData,
        isLoading: false,
      }),
      useUpdateNumbering: () => ({
        mutate: mockMutate,
        isPending: false,
      }),
    });
  });

  it('renders correctly with default data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NumberingForm />
      </QueryClientProvider>
    );

    // Wait for the form to populate
    await waitFor(() => {
      expect(screen.getByDisplayValue('BKK-PREFIX')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('123')).toBeInTheDocument();
  });

  it('shows loading spinner when data is loading', () => {
    (useSettings as any).mockReturnValue({
      useNumbering: () => ({
        data: undefined,
        isLoading: true,
      }),
      useUpdateNumbering: () => ({
        mutate: mockMutate,
        isPending: false,
      }),
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <NumberingForm />
      </QueryClientProvider>
    );
    
    // Skeleton renders divs with animate-pulse class
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
