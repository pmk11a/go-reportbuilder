import React, { useState, useEffect } from 'react';
import { SearchableSelect } from '@/shared/ui/form/searchable-select';
import { sharedFilterService } from '@/shared/services/sharedFilterService';

interface Props {
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}

export function KasBankSelect({ value, onChange, type = 'KAS', placeholder = 'Pilih Kelompok Kas/Bank...' }: Props) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    let active = true;
    const fetchOptions = async () => {
      try {
        const data = await sharedFilterService.getKelompokKas(type, search);
        if (active) {
          setOptions(data.map(d => ({
            value: d.id,
            label: d.text
          })));
        }
      } catch (error) {
        console.error(error);
      }
    };

    const timer = setTimeout(() => {
      fetchOptions();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, type]);

  return (
    <SearchableSelect
      value={value}
      onValueChange={onChange}
      options={options}
      onSearchChange={setSearch}
      placeholder={placeholder}
      searchPlaceholder={`Cari ${type}...`}
    />
  );
}
