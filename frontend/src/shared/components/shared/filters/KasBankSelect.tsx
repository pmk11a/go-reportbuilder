import { useState, useEffect, useMemo } from 'react';
import { SearchableSelect } from '@/shared/ui/form/searchable-select';
import { sharedFilterService } from '@/shared/services/sharedFilterService';

/**
 * Maps Bukti Kas/Bank type codes to DBPOSTHUTPIUT.Kode values.
 *
 * BKM/BKK (Kas Masuk/Keluar) → Kas + Bank
 * BBM/BBK (Bank Masuk/Keluar) → Bank only
 *
 * Direct type values (KAS/BANK) are forwarded as-is for backward-compatibility.
 */
const TIPE_TO_TYPES: Record<string, string[]> = {
  BKM: ['KAS', 'BANK'],
  BKK: ['KAS', 'BANK'],
  BBM: ['BANK'],
  BBK: ['BANK'],
};

interface Props {
  value?: string;
  onChange: (value: string) => void;
  /** Legacy single-type selector (e.g. "KAS", "BANK"). Mutually exclusive with `tipeTrans`. */
  type?: string;
  /** Bukti Kas/Bank type code (BKM/BKK/BBM/BBK). Auto-maps to Kas+Bank or Bank-only. */
  tipeTrans?: string;
  placeholder?: string;
}

export function KasBankSelect({
  value,
  onChange,
  type = 'KAS',
  tipeTrans,
  placeholder = 'Pilih Kelompok Kas/Bank...',
}: Props) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [search, setSearch] = useState('');

  // Determine effective types: tipeTrans overrides type if provided.
  const effectiveTypes = useMemo(() => {
    if (tipeTrans && TIPE_TO_TYPES[tipeTrans]) {
      return TIPE_TO_TYPES[tipeTrans];
    }
    return [type];
  }, [type, tipeTrans]);

  useEffect(() => {
    let active = true;
    const fetchOptions = async () => {
      try {
        const data = await sharedFilterService.getKelompokKasMulti(effectiveTypes, search);
        if (active) {
          setOptions(
            data.map((d) => ({
              value: d.id,
              label: d.text,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch Kelompok Kas:', error);
      }
    };

    const timer = setTimeout(fetchOptions, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [effectiveTypes, search]);

  return (
    <SearchableSelect
      value={value}
      onValueChange={onChange}
      options={options}
      onSearchChange={setSearch}
      placeholder={placeholder}
      searchPlaceholder={`Cari ${effectiveTypes.join('/')}...`}
    />
  );
}
