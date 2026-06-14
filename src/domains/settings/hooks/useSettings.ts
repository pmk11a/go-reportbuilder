import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingService } from '@/domains/settings/services/settingService';
import type { ISettingsCompany, ISettingsNumbering } from '@/domains/settings/settings';
import { useToast } from '@/shared/hooks/use-toast';
import { formatAPIError } from '@/shared/utils/errorMapper';

export const useSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const useCompany = () => useQuery({
    queryKey: ['settings', 'company'],
    queryFn: async () => {
      const response = await settingService.getCompany();
      if (!response.success) throw new Error(response.message || 'Failed to fetch company settings');
      return response.data;
    },
  });

  const useUpdateCompany = () => useMutation({
    mutationFn: async (data: ISettingsCompany) => {
      const response = await settingService.updateCompany(data);
      if (!response.success) throw new Error(response.message || 'Failed to update company settings');
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Company profile updated successfully', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['settings', 'company'] });
    },
    onError: (error: any) => {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update company settings';
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    },
  });

  const useNumbering = () => useQuery({
    queryKey: ['settings', 'numbering'],
    queryFn: async () => {
      const response = await settingService.getNumbering();
      if (!response.success) throw new Error(response.message || 'Failed to fetch numbering settings');
      return response.data;
    },
  });

  const useUpdateNumbering = () => useMutation({
    mutationFn: async (data: ISettingsNumbering) => {
      const response = await settingService.updateNumbering(data);
      if (!response.success) throw new Error(response.message || 'Failed to update numbering settings');
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Numbering format updated successfully', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['settings', 'numbering'] });
    },
    onError: (error: any) => {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update numbering settings';
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    },
  });

  return {
    useCompany,
    useUpdateCompany,
    useNumbering,
    useUpdateNumbering,
  };
};
