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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/form/select";
import { useTranslation } from "react-i18next";
import { kasbankService } from "../../../services/kasbankService";
import type { IAktiva } from "../../../types/kasbank";

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
  const [loading, setLoading] = useState(false);

  // Description states (like Delphi's Label26, Label30, Label32, Label2, Label8)
  const [perkiraanDesc, setPerkiraanDesc] = useState("");
  const [bagianDesc, setBagianDesc] = useState("");
  const [devisiDesc, setDevisiDesc] = useState("");
  const [akumulasiDesc, setAkumulasiDesc] = useState("");
  const [biayaDesc, setBiayaDesc] = useState("");

  // Lookup handlers - Delphi style: Enter to lookup, show description label
  const handlePerkiraanKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.perkiraan) {
      setLoading(true);
      try {
        const res = await kasbankService.lookupPerkiraanByKode(formData.perkiraan);
        if (res && res.keterangan) {
          setPerkiraanDesc(`[ ${res.keterangan} ]`);
        } else {
          setPerkiraanDesc("");
          alert("Perkiraan tidak ditemukan!");
        }
      } catch (err) {
        setPerkiraanDesc("");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBagianKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.kodebag) {
      setLoading(true);
      try {
        const res = await kasbankService.lookupBagianByKode(formData.kodebag);
        if (res && res.namabag) {
          setBagianDesc(`[ ${res.namabag} ]`);
        } else {
          setBagianDesc("");
          alert("Bagian tidak ditemukan!");
        }
      } catch (err) {
        setBagianDesc("");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDevisiKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.devisi) {
      setLoading(true);
      try {
        const res = await kasbankService.lookupDevisiByKode(formData.devisi);
        if (res && res.namadevisi) {
          setDevisiDesc(`[ ${res.namadevisi} ]`);
        } else {
          setDevisiDesc("");
          alert("Devisi tidak ditemukan!");
        }
      } catch (err) {
        setDevisiDesc("");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAkumulasiKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.akumulasi) {
      setLoading(true);
      try {
        const res = await kasbankService.lookupAkumulasiByKode(formData.akumulasi);
        if (res && res.keterangan) {
          setAkumulasiDesc(`[ ${res.keterangan} ]`);
        } else {
          setAkumulasiDesc("");
          alert("Akumulasi tidak ditemukan!");
        }
      } catch (err) {
        setAkumulasiDesc("");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBiayaKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, biayaField: 'biaya' | 'biaya2' | 'biaya3') => {
    if (e.key === 'Enter' && formData[biayaField]) {
      setLoading(true);
      try {
        const res = await kasbankService.lookupBiayaByKode(formData[biayaField] as string);
        if (res && res.keterangan) {
          setBiayaDesc(`[ ${res.keterangan} ]`);
        } else {
          setBiayaDesc("");
          alert("Biaya tidak ditemukan!");
        }
      } catch (err) {
        setBiayaDesc("");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };


  useEffect(() => {
    if (open) {
      setFormData({
        perkiraan: perkiraan || "",
        kelompok: 0,
        nobelakang: "",
        nobelakang2: "",
        tglpengakuan: new Date().toISOString().split("T")[0],
        tipeaktiva: 0,
        keterangan: "",
        kuantum: 1,
        persen: 0,
        metode: "L",
        akumulasi: "",
        biaya: "",
        persenbiaya1: 0,
        biaya2: "",
        persenbiaya2: 0,
        biaya3: "",
        persenbiaya3: 0,
        xsusut: 1,
        perlakuanaktiva: 0,
        kodebag: "",
        devisi: devisi || "",
      });
    }
  }, [open, perkiraan, devisi]);

  const handleChange = (field: keyof IAktiva, value: string | number) => {
    setFormData((prev: Partial<IAktiva>) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    if (!formData.perkiraan) {
      alert("Perkiraan harus diisi!");
      return;
    }
    onConfirm(formData as IAktiva);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sub-Form Aktiva Tetap</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Row 1: Perkiraan & Kelompok */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Perkiraan (Group Aktiva)</Label>
                {perkiraanDesc && <span className="text-sm text-muted-foreground">{perkiraanDesc}</span>}
              </div>
              <Input
                value={formData.perkiraan || ""}
                onChange={(e) => handleChange("perkiraan", e.target.value)}
                onKeyDown={handlePerkiraanKeyDown}
                placeholder="Kode perkiraan, tekan Enter"
              />
            </div>
            <div className="space-y-2">
              <Label>Kelompok</Label>
              <Select
                value={String(formData.kelompok ?? 0)}
                onValueChange={(v) => handleChange("kelompok", parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Header Aktiva</SelectItem>
                  <SelectItem value="1">Sub Aktiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: No. Urut & No. Urut 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>No. Urut</Label>
              <Input
                value={formData.nobelakang || ""}
                onChange={(e) => handleChange("nobelakang", e.target.value)}
                maxLength={5}
                placeholder="5 digit"
              />
            </div>
            <div className="space-y-2">
              <Label>No. Urut 2 (Sub Aktiva)</Label>
              <Input
                value={formData.nobelakang2 || ""}
                onChange={(e) => handleChange("nobelakang2", e.target.value)}
                maxLength={5}
                placeholder="5 digit"
              />
            </div>
          </div>

          {/* Row 3: Tanggal Perolehan & Tipe Aktiva */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Perolehan</Label>
              <Input
                type="date"
                value={formData.tglpengakuan || ""}
                onChange={(e) => handleChange("tglpengakuan", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipe Aktiva</Label>
              <Select
                value={String(formData.tipeaktiva ?? 0)}
                onValueChange={(v) => handleChange("tipeaktiva", parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Aktiva Tetap</SelectItem>
                  <SelectItem value="1">Aktiva Yang Dibiayakan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Keterangan */}
          <div className="space-y-2">
            <Label>Keterangan</Label>
            <Input
              value={formData.keterangan || ""}
              onChange={(e) => handleChange("keterangan", e.target.value)}
              placeholder="Keterangan aktiva"
            />
          </div>

          {/* Row 5: Kuantum, % Susut, Metode Penyusutan */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Kuantum</Label>
              <Input
                type="number"
                value={formData.kuantum ?? 1}
                onChange={(e) => handleChange("kuantum", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>% Susut</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.persen ?? 0}
                onChange={(e) => handleChange("persen", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Metode Penyusutan</Label>
              <Select
                value={formData.metode || "L"}
                onValueChange={(v) => handleChange("metode", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">[L]urus</SelectItem>
                  <SelectItem value="M">[M]enurun</SelectItem>
                  <SelectItem value="P">[P]ajak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 6: Akumulasi Penyusutan */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Akumulasi Penyusutan (Perkiraan)</Label>
              {akumulasiDesc && <span className="text-sm text-muted-foreground">{akumulasiDesc}</span>}
            </div>
            <Input
              value={formData.akumulasi || ""}
              onChange={(e) => handleChange("akumulasi", e.target.value)}
              onKeyDown={handleAkumulasiKeyDown}
              placeholder="Kode akun, tekan Enter"
            />
          </div>

          {/* Row 7: Biaya Penyusutan 1 & % */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Biaya Penyusutan 1 (Perkiraan)</Label>
                {biayaDesc && <span className="text-sm text-muted-foreground">{biayaDesc}</span>}
              </div>
              <Input
                value={formData.biaya || ""}
                onChange={(e) => handleChange("biaya", e.target.value)}
                onKeyDown={(e) => handleBiayaKeyDown(e, 'biaya')}
                placeholder="Kode akun, tekan Enter"
              />
            </div>
            <div className="space-y-2">
              <Label>% Susut Biaya 1</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.persenbiaya1 ?? 0}
                onChange={(e) => handleChange("persenbiaya1", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Row 8: Biaya Penyusutan 2 & % */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Biaya Penyusutan 2 (Perkiraan)</Label>
              <Input
                value={formData.biaya2 || ""}
                onChange={(e) => handleChange("biaya2", e.target.value)}
                onKeyDown={(e) => handleBiayaKeyDown(e, 'biaya2')}
                placeholder="Kode akun, tekan Enter"
              />
            </div>
            <div className="space-y-2">
              <Label>% Susut Biaya 2</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.persenbiaya2 ?? 0}
                onChange={(e) => handleChange("persenbiaya2", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Row 9: Biaya Penyusutan 3 & % */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Biaya Penyusutan 3 (Perkiraan)</Label>
              <Input
                value={formData.biaya3 || ""}
                onChange={(e) => handleChange("biaya3", e.target.value)}
                onKeyDown={(e) => handleBiayaKeyDown(e, 'biaya3')}
                placeholder="Kode akun, tekan Enter"
              />
            </div>
            <div className="space-y-2">
              <Label>% Susut Biaya 3</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.persenbiaya3 ?? 0}
                onChange={(e) => handleChange("persenbiaya3", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Row 10: x Susut Bulan ini & Perlakuan Aktiva */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>x Susut Bulan Ini</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.xsusut ?? 1}
                onChange={(e) => handleChange("xsusut", parseFloat(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Perlakuan Aktiva</Label>
              <Select
                value={String(formData.perlakuanaktiva ?? 0)}
                onValueChange={(v) => handleChange("perlakuanaktiva", parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">-</SelectItem>
                  <SelectItem value="1">Jual</SelectItem>
                  <SelectItem value="2">Keluar Aktiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hidden fields display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Bagian (Kode)</Label>
                {bagianDesc && <span className="text-sm text-muted-foreground">{bagianDesc}</span>}
              </div>
              <Input
                value={formData.kodebag || ""}
                onChange={(e) => handleChange("kodebag", e.target.value)}
                onKeyDown={handleBagianKeyDown}
                placeholder="Kode bagian, tekan Enter"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Divisi</Label>
                {devisiDesc && <span className="text-sm text-muted-foreground">{devisiDesc}</span>}
              </div>
              <Input
                value={formData.devisi || ""}
                onChange={(e) => handleChange("devisi", e.target.value)}
                onKeyDown={handleDevisiKeyDown}
                placeholder="Kode devisi, tekan Enter"
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
