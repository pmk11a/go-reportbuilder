import React, { useState, useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/form/searchable-select';
import { sharedFilterService } from '@/services/sharedFilterService';

interface Props {
  value?: string;
  onChange: (value: string) => void;
  without?: string;
  posthutpiut?: string;
  placeholder?: string;
}

export function PerkiraanSelect({ value, onChange, without, posthutpiut, placeholder = 'Pilih Perkiraan...' }: Props) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    let active = true;
    const fetchOptions = async () => {
      try {
        const data = await sharedFilterService.getPerkiraan(search, without, posthutpiut);
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
  }, [search, without, posthutpiut]);

  return (
    <SearchableSelect
      value={value}
      onValueChange={onChange}
      options={options}
      onSearchChange={setSearch}
      placeholder={placeholder}
      searchPlaceholder="Cari keterangan atau kode perkiraan..."
    />
  );
}
