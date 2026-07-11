import { useQuery } from '@tanstack/react-query';
import { settingService } from '@/domains/settings/services/settingService';

export const featureFlagKeys = {
  all: ['feature-flags'] as const,
};

export function useFeatureFlags() {
  return useQuery({
    queryKey: featureFlagKeys.all,
    queryFn: async () => {
      const res = await settingService.getFeatures();
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
