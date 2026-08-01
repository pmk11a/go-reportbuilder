import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kasbankService } from '@/domains/accounting/services/kasbankService';
import { sharedFilterService } from '@/shared/services/sharedFilterService';
import type {
  IKasBankHeader,
  IKasBankListParams,
  IKasBankListResponse,
  ICreateKasBankPayload,
  IUpdateKasBankPayload,
  IOtorisasiRequest,
  IPerkiraan,
  IKasBankDetail,
} from '@/domains/accounting/types/kasbank';

export const kasbankKeys = {
  all: ['kasbank'] as const,
  paginated: (params: IKasBankListParams) => ['kasbank', 'list', params] as const,
  detail: (noBukti: string) => ['kasbank', 'detail', noBukti] as const,
  noBukti: (tipe: string, devisi: string) => ['kasbank', 'nobukti', tipe, devisi] as const,
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

export function useSetOtorisasi(noBukti: string, onSuccess?: () => void, onError?: (msg: string) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IOtorisasiRequest) => kasbankService.setOtorisasi(noBukti, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kasbankKeys.all });
      qc.invalidateQueries({ queryKey: kasbankKeys.detail(noBukti) });
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Gagal memproses otorisasi';
      onError?.(msg);
    },
  });
}

export function useBatalOtorisasi(noBukti: string, onSuccess?: () => void, onError?: (msg: string) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IOtorisasiRequest) => kasbankService.batalOtorisasi(noBukti, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kasbankKeys.all });
      qc.invalidateQueries({ queryKey: kasbankKeys.detail(noBukti) });
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Gagal memproses pembatalan otorisasi';
      onError?.(msg);
    },
  });
}

export function useGenerateNoBukti(tipe: string, devisi?: string) {
  return useQuery({
    queryKey: kasbankKeys.noBukti(tipe, devisi ?? ''),
    queryFn: () => kasbankService.generateNoBuktiPreview(tipe),
    // Only fire once tipe is known — uses the preview endpoint so no counter
    // is consumed while the user is filling in the form.
    enabled: !!tipe,
  });
}

export function useLookupPerkiraan(q: string, kelompokKas: boolean = false) {
  return useQuery({
    queryKey: ['kasbank', 'perkiraan', q, kelompokKas] as const,
    queryFn: () => kasbankService.lookupPerkiraan(q, kelompokKas ? 'Y' : 'N'),
    // Always fetch so the dropdown is populated on first open. The 5-minute
    // staleTime keeps the cached list reusable across keystrokes.
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}

// useLookupPerkiraanShared uses the shared FilterService which is the
// canonical Perkiraan lookup endpoint (POSTHUTPIUT/Kelompok aware).
// Prefer this over the legacy kasbank-specific lookup for new code.
// The optional `without` parameter excludes a specific account (e.g. the
// already-selected Perkiraan) from the results — useful for the Lawan
// dropdown so users cannot pick the same account as both Perkiraan and Lawan.
export function useLookupPerkiraanShared(
  q: string,
  posthutpiut: string = 'Y',
  without?: string,
) {
  return useQuery({
    queryKey: ['shared', 'perkiraan', q, posthutpiut, without ?? null] as const,
    queryFn: () => sharedFilterService.getPerkiraan(q, without, posthutpiut),
    // Always fetch so the dropdown is populated on first open. The 5-minute
    // staleTime keeps the cached list reusable across keystrokes.
    enabled: true,
    staleTime: 5 * 60 * 1000,
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
export function useResolveSubTransaction(perkiraan: string, dk: string) {
  return useQuery({
    queryKey: ["kasbank", "resolve-subtrans", perkiraan, dk],
    queryFn: async () => {
      if (!perkiraan || !dk) return null;
      const res = await kasbankService.resolveSubTransaction(perkiraan, dk);
      return res ?? null;
    },
    enabled: !!perkiraan && !!dk,
  });
}

export function useLookupDevisi() {
  return useQuery({
    queryKey: ['devisi', 'lookup'],
    queryFn: async () => {
      const res = await kasbankService.lookupDevisi();
      return res ?? [];
    },
  });
}
