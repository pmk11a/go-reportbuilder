import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/overlay/dialog";
import { Button } from "@/shared/ui/overlay/button";
import { Input } from "@/shared/ui/form/input";
import { Label } from "@/shared/ui/form/label";
import { kasbankService } from "../../../services/kasbankService";
import { IOutstandingHutPiut, ICustSupp } from "../../../types/kasbank";
import { SearchableSelect, SearchableSelectOption } from "@/shared/ui/form/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/data/table";
import { Checkbox } from "@/shared/ui/form/checkbox";

interface HutangPiutangSubFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perkiraan: string;
  kodeCustSupp?: string;
  isPiutang: boolean; // true for Piutang, false for Hutang (can be determined by trigger/kode)
  onSave: (selected: any[]) => void;
  // If editing an existing detail row that already has selected HutPiut items
  initialData?: any[];
}

export function HutangPiutangSubForm({
  open,
  onOpenChange,
  perkiraan,
  kodeCustSupp: initialKodeCustSupp,
  isPiutang,
  onSave,
}: HutangPiutangSubFormProps) {
  const [kodeCustSupp, setKodeCustSupp] = useState(initialKodeCustSupp ?? "");
  const [invoices, setInvoices] = useState<IOutstandingHutPiut[]>([]);
  const [loading, setLoading] = useState(false);
  const [custSuppOptions, setCustSuppOptions] = useState<SearchableSelectOption[]>([]);
  const [custSuppLoading, setCustSuppLoading] = useState(false);

  // Search CustSupp - loads options based on search text
  const handleCustSuppSearch = useCallback(async (search: string) => {
    if (!search || search.length < 2) {
      setCustSuppOptions([]);
      return;
    }
    setCustSuppLoading(true);
    try {
      const res: ICustSupp[] = await kasbankService.lookupCustSupp(search);
      const options = res.map((c) => ({
        label: `${c.kode} - ${c.nama}`,
        value: c.kode,
      }));
      setCustSuppOptions(options);
    } catch (err) {
      console.error(err);
      setCustSuppOptions([]);
    } finally {
      setCustSuppLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setKodeCustSupp("");
      setInvoices([]);
    }
  }, [open]);

  useEffect(() => {
    if (kodeCustSupp && perkiraan) {
      loadInvoices(kodeCustSupp, perkiraan);
    }
  }, [kodeCustSupp, perkiraan]);

  const loadInvoices = async (custSupp: string, perk: string) => {
    setLoading(true);
    try {
      const res: IOutstandingHutPiut[] = await kasbankService.getOutstandingHutPiut(custSupp, perk);
      // Map them to local state with jmlbayar = 0 by default
      const mapped = res.map(inv => {
        const saldo = (inv.kredit || 0) - (inv.debet || 0); // Outstanding
        return {
          ...inv,
          jmlbayar: 0,
          saldo: Math.abs(saldo)
        };
      });
      setInvoices(mapped);
    } catch (error) {
      console.error("Failed to load invoices", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInvoice = (index: number, checked: boolean) => {
    const newInv = [...invoices];
    if (checked) {
      // Auto pay full
      const saldo = newInv[index].saldo || 0;
      newInv[index] = { ...newInv[index], jmlbayar: saldo };
    } else {
      newInv[index] = { ...newInv[index], jmlbayar: 0 };
    }
    setInvoices(newInv);
  };

  const handleJmlBayarChange = (index: number, val: string) => {
    const newInv = [...invoices];
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    const saldo = newInv[index].saldo || 0;
    if (num > saldo) num = saldo;
    newInv[index] = { ...newInv[index], jmlbayar: num };
    setInvoices(newInv);
  };

  const handleSave = () => {
    const selected = invoices.filter(i => (i.jmlbayar || 0) > 0).map(i => {
      // Create DBHUTPIUT payload for Pelunasan
      // If Piutang (Kredit balances Piutang/Debet), we set Kredit.
      // If Hutang (Debet balances Hutang/Kredit), we set Debet.
      const payload: any = {
        nofaktur: i.nofaktur,
        kodecustsupp: kodeCustSupp,
        perkiraan: perkiraan,
        debet: isPiutang ? 0 : i.jmlbayar,
        kredit: isPiutang ? i.jmlbayar : 0,
      };
      // Preserve saldo for frontend display/editing purposes
      payload.saldo = i.saldo;
      return payload;
    });

    if (selected.length === 0) {
      alert("Pilih minimal satu tagihan untuk dilunasi!");
      return;
    }

    onSave(selected);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pelunasan {isPiutang ? "Piutang" : "Hutang"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="w-1/2">
            <Label>Pilih Customer / Supplier</Label>
            <SearchableSelect
              value={kodeCustSupp}
              onValueChange={(val) => {
                setKodeCustSupp(val ?? "");
              }}
              onSearchChange={handleCustSuppSearch}
              placeholder={custSuppLoading ? "Mencari..." : "Ketik untuk mencari..."}
              options={custSuppOptions}
              disabled={custSuppLoading}
            />
          </div>

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">Pilih</TableHead>
                  <TableHead>No. Faktur</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Total Hutang</TableHead>
                  <TableHead className="text-right">Sisa (Saldo)</TableHead>
                  <TableHead className="w-48 text-right">Jml Bayar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      Memuat data tagihan...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      Tidak ada tagihan tertunda untuk pilihan ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv, idx) => {
                    const isChecked = (inv.jmlbayar || 0) > 0;
                    return (
                      <TableRow key={inv.nofaktur}>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => toggleInvoice(idx, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>{inv.nofaktur}</TableCell>
                        <TableCell>{inv.tanggal?.split("T")[0]}</TableCell>
                        <TableCell>{inv.jatuhtempo?.split("T")[0]}</TableCell>
                        <TableCell className="text-right">
                           {((inv.kredit || 0) - (inv.debet || 0)).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {(inv.saldo || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="text-right h-8"
                            value={inv.jmlbayar || ""}
                            onChange={(e) => handleJmlBayarChange(idx, e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={invoices.length === 0 || loading}>
              Simpan Pelunasan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
