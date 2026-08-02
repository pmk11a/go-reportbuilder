import { useEffect, useState } from "react";
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
// using any for now as they are not defined in types/kasbank
import { SearchableSelect } from "@/shared/ui/form/searchable-select";
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
  isPiutang: boolean; // true for Piutang, false for Hutang (can be determined by trigger/kode)
  onSave: (selected: any[]) => void;
  // If editing an existing detail row that already has selected HutPiut items
  initialData?: any[];
}

export function HutangPiutangSubForm({
  open,
  onOpenChange,
  perkiraan,
  isPiutang,
  onSave,
// @ts-expect-error - unused variable
  initialData = [],
}: HutangPiutangSubFormProps) {
  const [kodeCustSupp, setKodeCustSupp] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Search CustSupp
  const loadCustSupp = async (q: string) => {
    try {
      const res: any[] = await (kasbankService as any).lookupCustSupp(q);
      return res.map((c) => ({
        label: `${c.kodecustsupp} - ${c.namacustsupp}`,
        value: c.kodecustsupp,
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

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
      const res: any[] = await (kasbankService as any).getOutstandingHutPiut(custSupp, perk);
      // Map them to local state with jmlBayar = 0 by default
      const mapped = res.map(inv => {
        const saldo = (inv.kredit || 0) - (inv.debet || 0); // Outstanding
        return {
          ...inv,
          jmlBayar: 0,
          saldo: Math.abs(saldo)
        };
      });
      setInvoices(mapped as any);
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
      newInv[index].jmlBayar = (newInv[index] as any).saldo;
    } else {
      newInv[index].jmlBayar = 0;
    }
    setInvoices(newInv);
  };

  const handleJmlBayarChange = (index: number, val: string) => {
    const newInv = [...invoices];
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    if (num > ((newInv[index] as any).saldo || 0)) num = ((newInv[index] as any).saldo || 0);
    newInv[index].jmlBayar = num;
    setInvoices(newInv);
  };

  const handleSave = () => {
    const selected = invoices.filter(i => (i.jmlBayar || 0) > 0).map(i => {
      // Create DBHUTPIUT payload for Pelunasan
      // If Piutang (Kredit balances Piutang/Debet), we set Kredit. 
      // If Hutang (Debet balances Hutang/Kredit), we set Debet.
      const payload: any = {
        nofaktur: i.nofaktur,
        kodecustsupp: kodeCustSupp,
        perkiraan: perkiraan,
        debet: isPiutang ? 0 : i.jmlBayar,
        kredit: isPiutang ? i.jmlBayar : 0,
        // The backend CreateHeader will fill NoBukti and Urut
      };
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
              onChange={(val) => setKodeCustSupp(val ?? "")}
              loadOptions={loadCustSupp}
              placeholder="Ketik untuk mencari..."
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
                    const isChecked = (inv.jmlBayar || 0) > 0;
                    return (
                      <TableRow key={inv.nofaktur}>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(c) => toggleInvoice(idx, !!c)}
                          />
                        </TableCell>
                        <TableCell>{inv.nofaktur}</TableCell>
                        <TableCell>{inv.tanggal?.split("T")[0]}</TableCell>
                        <TableCell>{inv.jatuhtempo?.split("T")[0]}</TableCell>
                        <TableCell className="text-right">
                           {/* Simplified display, depending on original debet/kredit logic */}
                           {(Math.abs((inv.kredit || 0) + (inv.debet || 0))).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {((inv as any).saldo || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="text-right h-8"
                            value={inv.jmlBayar || ""}
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
