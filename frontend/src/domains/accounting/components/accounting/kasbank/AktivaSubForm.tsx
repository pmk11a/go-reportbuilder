import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/overlay/dialog";
import { Button } from "@/shared/ui/overlay/button";
import { Input } from "@/shared/ui/form/input";
import { Label } from "@/shared/ui/form/label";
import { useTranslation } from "react-i18next";

export interface IAktiva {
  tipe: string;
  kodebag: string;
  nomuka: string;
  akumulasi: string;
  biaya: string;
  quantity: number;
  persen: number;
  perkiraan: string;
  devisi: string;
}

interface AktivaSubFormProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (aktiva: IAktiva) => void;
  perkiraan: string;
  devisi: string;
}

export function AktivaSubForm({ open, onClose, onConfirm, perkiraan, devisi }: AktivaSubFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<IAktiva>>({});

  useEffect(() => {
    if (open) {
      setFormData({
        tipe: "",
        kodebag: "",
        nomuka: "",
        akumulasi: "",
        biaya: "",
        quantity: 1,
        persen: 0,
        perkiraan,
        devisi,
      });
    }
  }, [open, perkiraan, devisi]);

  const handleChange = (field: keyof IAktiva, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    if (!formData.tipe) {
      alert("Tipe aktiva harus diisi!");
      return;
    }
    onConfirm(formData as IAktiva);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sub-Form Aktiva Tetap</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Perkiraan</Label>
              <Input value={perkiraan} disabled />
            </div>
            <div className="space-y-2">
              <Label>Tipe Aktiva</Label>
              <Input
                value={formData.tipe || ""}
                onChange={(e) => handleChange("tipe", e.target.value)}
                placeholder="Contoh: Kendaraan"
              />
            </div>
            <div className="space-y-2">
              <Label>Lokasi (Kode Bagian)</Label>
              <Input
                value={formData.kodebag || ""}
                onChange={(e) => handleChange("kodebag", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={formData.quantity || 1}
                onChange={(e) => handleChange("quantity", parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Nilai Residu (%)</Label>
              <Input
                type="number"
                value={formData.persen || 0}
                onChange={(e) => handleChange("persen", parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>No Muka (Perkiraan Uang Muka)</Label>
              <Input
                value={formData.nomuka || ""}
                onChange={(e) => handleChange("nomuka", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Akumulasi (Perkiraan)</Label>
              <Input
                value={formData.akumulasi || ""}
                onChange={(e) => handleChange("akumulasi", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Biaya (Perkiraan Beban)</Label>
              <Input
                value={formData.biaya || ""}
                onChange={(e) => handleChange("biaya", e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleConfirm}>Simpan Aktiva</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
