import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kasbankService } from '@/domains/accounting/services/kasbankService';
import type {
  IKasBankHeader,
  IKasBankListParams,
  IKasBankListResponse,
  ICreateKasBankPayload,
  IUpdateKasBankPayload,
  IOtorisasiRequest,
  IPerkiraan,
  IKasBankDetail,
} from '@/domains/accounting/kasbank';

export const kasbankKeys = {
  all: ['kasbank'] as const,
  paginated: (params: IKasBankListParams) => ['kasbank', 'list', params] as const,
  detail: (noBukti: string) => ['kasbank', 'detail', noBukti] as const,
  noBukti: (tipe: string) => ['kasbank', 'nobukti', tipe] as const,
};

export function useKasBankList(params: IKasBankListParams) {
  return useQuery({
    queryKey: kasbankKeys.paginated(params),
    queryFn: async () => {
      const res = await kasbankService.getPaginated(params);
      return res;
    },
  });
}

export function useKasBank(noBukti: string) {
  return useQuery({
    queryKey: kasbankKeys.detail(noBukti),
    queryFn: () => kasbankService.getByNoBukti(noBukti),
    enabled: !!noBukti,
  });
}

export function useCreateKasBank(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateKasBankPayload) => kasbankService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kasbankKeys.all });
      onSuccess?.();
    },
  });
}

export function useUpdateKasBank(noBukti: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IUpdateKasBankPayload) => kasbankService.update(noBukti, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kasbankKeys.all });
      qc.invalidateQueries({ queryKey: kasbankKeys.detail(noBukti) });
      onSuccess?.();
    },
  });
}

export function useDeleteKasBank(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noBukti: string) => kasbankService.delete(noBukti),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kasbankKeys.all });
      onSuccess?.();
    },
  });
}

export function useSetOtorisasi(noBukti: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IOtorisasiRequest) => kasbankService.setOtorisasi(noBukti, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kasbankKeys.all });
      qc.invalidateQueries({ queryKey: kasbankKeys.detail(noBukti) });
      onSuccess?.();
    },
  });
}

export function useBatalOtorisasi(noBukti: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IOtorisasiRequest) => kasbankService.batalOtorisasi(noBukti, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kasbankKeys.all });
      qc.invalidateQueries({ queryKey: kasbankKeys.detail(noBukti) });
      onSuccess?.();
    },
  });
}

export function useGenerateNoBukti(tipe: string) {
  return useQuery({
    queryKey: kasbankKeys.noBukti(tipe),
    queryFn: () => kasbankService.generateNoBukti(tipe),
    enabled: !!tipe,
  });
}

export function useLookupPerkiraan(q: string, kelompokKas: boolean = false) {
  return useQuery({
    queryKey: ['kasbank', 'perkiraan', q, kelompokKas] as const,
    queryFn: () => kasbankService.lookupPerkiraan(q, kelompokKas),
    enabled: q.length >= 2,
  });
}

export function useDownloadKasBankPdf(noBukti: string) {
  return useMutation({
    mutationFn: () => kasbankService.downloadPdf(noBukti),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${noBukti}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}