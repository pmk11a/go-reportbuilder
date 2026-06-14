import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/overlay/dialog';
import { Button } from '@/shared/ui';
import { sharedFilterService, CustomerData } from '@/shared/services/sharedFilterService';

interface Props {
  jenis: 0 | 1; // 0: Hutang, 1: Piutang
  label?: string;
  modalTitle?: string;
  value?: CustomerData | null;
  onChange: (customer: CustomerData | null) => void;
}

export function CustomerPicker({ jenis, label = 'Pilih Customer', modalTitle = 'Data Customer', value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await sharedFilterService.getCustomers(jenis, search, page);
        if (active) {
          setData(res.data || []);
          setTotalPages(res.last_page || 1);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
    
    return () => { active = false; };
  }, [isOpen, search, page, jenis]);

  const handleSelect = (customer: CustomerData) => {
    onChange(customer);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-3">
      {value && (
        <div className="text-sm font-medium bg-accent px-3 py-1.5 rounded-md border flex items-center gap-2">
          <span>{value.KODECUSTSUPP} - {value.NAMACUSTSUPP}</span>
          <button 
            type="button" 
            onClick={() => onChange(null)}
            className="text-muted-foreground hover:text-destructive rounded-full p-0.5"
            title="Clear selection"
          >
            &times;
          </button>
        </div>
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" type="button">
            {label}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Cari nama atau kode..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-background"
              />
            </div>
            
            <div className="border rounded-md overflow-hidden bg-card">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Kode</th>
                    <th className="px-4 py-2 font-medium">Nama</th>
                    <th className="px-4 py-2 font-medium">Alamat</th>
                    <th className="px-4 py-2 font-medium hidden sm:table-cell">Kota</th>
                    <th className="px-4 py-2 font-medium w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Memuat data...</td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Data tidak ditemukan.</td></tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.KODECUSTSUPP} className="hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-2 font-mono text-xs">{item.KODECUSTSUPP}</td>
                        <td className="px-4 py-2 font-medium">{item.NAMACUSTSUPP}</td>
                        <td className="px-4 py-2 text-muted-foreground truncate max-w-[150px]">{item.ALAMAT1}</td>
                        <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">{item.Kota}</td>
                        <td className="px-4 py-2">
                          <Button size="sm" onClick={() => handleSelect(item)} type="button" variant="secondary">Pilih</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between items-center text-sm pt-2">
              <span className="text-muted-foreground">Page {page} of {totalPages || 1}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} type="button">
                  Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} type="button">
                  Next
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
