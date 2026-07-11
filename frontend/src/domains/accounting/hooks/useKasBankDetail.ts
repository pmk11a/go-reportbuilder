import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kasbankService } from '@/domains/accounting/services/kasbankService';
import type { IKasBankDetail, IAddDetailPayload, IUpdateDetailPayload } from '@/domains/accounting/types/kasbank';
import { kasbankKeys } from './useKasBank';

export function useKasBankDetailList(noBukti: string) {
  return useQuery({
    queryKey: [...kasbankKeys.detail(noBukti), 'lines'] as const,
    queryFn: async () => {
      const res = await kasbankService.getDetailList(noBukti);
      // Unwrap IAPIResponse wrapper so callers get { header, details } directly
      return (res as any).data as { header: any; details: any[] };
    },
    enabled: !!noBukti,
  });
}


export function useKasBankDetail(noBukti: string, urut: number) {
  return useQuery({
    queryKey: [...kasbankKeys.detail(noBukti), 'line', urut] as const,
    queryFn: () => kasbankService.getDetail(noBukti, urut),
    enabled: !!noBukti && urut > 0,
  });
}

export function useAddDetail(noBukti: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IAddDetailPayload) => kasbankService.addDetail(noBukti, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kasbankKeys.detail(noBukti) });
      onSuccess?.();
    },
  });
}

export function useUpdateDetail(noBukti: string, urut: number, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IUpdateDetailPayload) => kasbankService.updateDetail(noBukti, urut, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kasbankKeys.detail(noBukti) });
      onSuccess?.();
    },
  });
}

export function useDeleteDetail(noBukti: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (urut: number) => kasbankService.deleteDetail(noBukti, urut),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kasbankKeys.detail(noBukti) });
      onSuccess?.();
    },
  });
}