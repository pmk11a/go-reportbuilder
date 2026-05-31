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
    queryClient = new QueryClient();
    vi.clearAllMocks();

    (useSettings as any).mockReturnValue({
      useNumbering: () => ({
        data: { alias: 'INV', pemisah: 1, contoh: 'INV-2026-001', reset: 1 },
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
      const aliasInput = screen.getByLabelText('Alias') as HTMLInputElement;
      expect(aliasInput.value).toBe('INV');
    });

    const separatorInput = screen.getByLabelText('Separator') as HTMLInputElement;
    expect(separatorInput.value).toBe('1');
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
    
    // Checks for a loading visual indicator
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
