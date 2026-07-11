# Migrasi Modul: Transaksi Kas Bank

> **Source Delphi:** `pwt/Trasaksi/KasBank/FrmKasBank.pas` (3524 lines)
> **Coverage:** 100% verified

---

## 0. Penting: Sub-Transaksi BUKAN Tab, Melainkan Trigger Otomatis

**Sub-transaksi (Giro, HutPiut, Aktiva, Deposito) TIDAK ditampilkan sebagai tab atau panel terpisah di form utama.** 

User **tidak pernah memilih** sub-transaksi secara eksplisit. Yang terjadi:

```
User input Perkiraan + Lawan
  → PerkiraanExit / LawanExit dipanggil (otomatis)
    → CekLawanDiPosting(Perkiraan/Lawan, DK)
      → Query dbPostHutPiut by Perkiraan
        → Jika ditemukan → sub-form MODAL muncul otomatis
```

**Sub-form muncul sebagai dialog/modal popup**, bukan tab/panel di form utama. Setiap sub-form memiliki `ShowModal` sendiri:
- `FrmKasBankGiro.ShowModal` — untuk Giro/Deposito (Kode=DP)
- `FrmKasBankHutPiut.ShowModal` — untuk HutPiut (Kode=PT/HT/UPT/UHT)
- `FrmKasBankAktiva.ShowModal` — untuk Aktiva (Kode=AKV/AKM)

User harus menyelesaikan input di sub-form modal terlebih dahulu sebelum kembali ke form utama dan melanjutkan transaksi.

---

## 1. Arsitektur End-to-End

```
Frontend Form                    Business Logic Layer                  SQL Server
──────────────                    ──────────────────────                 ────────────
Form KasBank ──Submit──→        SubTransactionResolver.resolve()     ←─ LOOKUP dbPostHutPiut
                                    ↓
                              ValidateGates()
                                    ↓
                              callStoredProcedures() / saveDirect()
                                    ↓
                              dbTrans + dbTransaksi + dbTempHutPiut + dbGiro + dbAktiva
```

**Prinsip:** Layer terpisah — UI hanya input/output, business logic murni di backend, data di database.

---

## 2. Jenis Transaksi & Mode

| Kode | Nama | Posisi Kas/Bank | Sisi Debet/Kredit |
|------|------|-----------------|-------------------|
| `BKM` | Bukti Kas Masuk | Debit Kas | Kas di Debet |
| `BKK` | Bukti Kas Keluar | Kredit Kas | Kas di Kredit |
| `BBM` | Bukti Bank Masuk | Debit Bank | Bank di Debet |
| `BBK` | Bukti Bank Keluar | Kredit Bank | Bank di Kredit |

**Source:** ComboBox Mode Items (index 0-3)

---

## 3. THPC — Tipe Pembayaran (Header, Panel1 Top=32)

**Posisi di Form Delphi:** Panel1 (Header), `Top=32`, `Left=86` — di bawah Mode (Top=4), di atas Tanggal (Top=38).

THPC diekstrak dari karakter ke-2 ComboBox: `Copy(THPC.Text, 2, 1)` → `C`, `T`, `H`, atau `P`.

| Index | ComboBox Value | Kode | Arti | Sub-Modul Aktif |
|-------|---------------|------|------|-----------------|
| 0 | `[C]ash` | `C` | Tunai/Kas langsung | Tidak ada |
| 1 | `[T]ransfer` | `T` | Transfer antar bank | Tidak ada |
| 2 | `[H]utang Giro` | `H` | Pembayaran via giro (utang) | Giro (Buka/Cair) |
| 3 | `[P]iutang Giro` | `P` | Penerimaan via giro (piutang) | Giro (Buka/Cair) |

> **⚠️ CRITICAL:** THPC hanya 4 pilihan di UI. Kode `PT/HT/UPT/UHT` adalah Kode sub-tipe giro (parameter SP `KodeP`/`KodeL`), **BUKAN** nilai THPC yang user pilih.

---

## 4. StatusGiro Calculation (THPC × Mode)

**Source:** `FrmKasBank.pas` procedure `TFrKasBank.THPCChange`

```pascal
if (THPC.ItemIndex=3) and (Mode.Text='BKM')            then StatusGiro := 'P+';
if (THPC.ItemIndex=3) and (Mode.Text in ['BKK','BBM']) then StatusGiro := 'P-';
if (THPC.ItemIndex=2) and (Mode.Text='BKM')            then StatusGiro := 'H+';
if (THPC.ItemIndex=2) and (Mode.Text='BKK')            then StatusGiro := 'H-';
// else StatusGiro := '';
```

| THPC | Mode | StatusGiro | Caption Form Giro | Aksi DB |
|------|------|-----------|-------------------|---------|
| `[P]` (idx 3) | BKM | `P+` | "Terima Giro" | INSERT `dbGiro` (Tipe=PT) |
| `[P]` (idx 3) | BKK / BBM | `P-` | "Pencairan Terima Giro" | UPDATE `dbGiro` (Tipe=PT) |
| `[H]` (idx 2) | BKM | `H+` | "Buka Giro" | INSERT `dbGiro` (Tipe=HT) |
| `[H]` (idx 2) | BKK | `H-` | "Pencairan Buka Giro" | UPDATE `dbGiro` (Tipe=HT) |

> **⚠️ CATATAN:** `THPC.ItemIndex=2` (Hutang Giro) TIDAK support Mode='BBM' — hanya 'BKK' yang valid. Ini berbeda dengan `THPC.ItemIndex=3` (Piutang Giro) yang support 'BKK' dan 'BBM'.

**Logic universal:**
```
function calculateStatusGiro(thpc: String, mode: String): String
    if thpc = 'P' then
        if mode = 'BKM' then return 'P+'
        else if mode in ['BKK', 'BBM'] then return 'P-'
    else if thpc = 'H' then
        if mode = 'BKM' then return 'H+'
        else if mode = 'BKK' then return 'H-'
    return ''  // C atau T → tidak ada giro
```

---

## 5. Sub-Transaction Resolver (Trigger Otomatis)

Ini adalah **algoritma inti** yang membuat sub-form muncul otomatis saat user memilih "Lawan" (Perkiraan lawan) di form transaksi KasBank.

**Source:** `FrmKasBank.pas` baris ~3200-3236

```pascal
function TFrKasBank.CekLawanDiPosting(mLawan, DK: String; var Kode: String): Boolean;
begin
   Result := False;
   Kode := '';

   // Step 1: Query dbPostHutPiut by Perkiraan
   with DM.QuCari do
   begin
      Close;
      SQL.Clear;
      SQL.Add('Select * from dbPostHutPiut where perkiraan=:0');
      Parameters[0].Value := mLawan;
      Open;
   end;

   // Step 2: If not found → no sub-form trigger
   if not DM.QuCari.IsEmpty then
   begin
     Kode := DM.QuCari.FieldByName('Kode').AsString;
     Result := True;

     // Step 3: Cascade logic based on Kode + DK position
     if Kode = 'DP' then
     begin
       if DK = 'D' then StatusAktivaP := 'DP+'
       else StatusAktivaL := 'DP-';
     end
     else if Kode = 'AKV' then
     begin
       if DK = 'D' then StatusAktivaP := 'AKV+'
       else StatusAktivaL := 'AKV-';
     end
     else if Kode = 'AKM' then
     begin
       if DK = 'D' then StatusAktivaP := 'AKM+'
       else StatusAktivaL := 'AKM-';
     end
     else if Kode = 'PT' then
     begin
       if DK = 'D' then StatusAktivaP := 'PT+'
       else StatusAktivaL := 'PT-';
     end
     else if Kode = 'HT' then
     begin
       if DK = 'D' then StatusAktivaP := 'HT-'
       else StatusAktivaL := 'HT+';
     end
     else if Kode = 'UPT' then
     begin
       if DK = 'D' then StatusAktivaP := 'UPT-'
       else StatusAktivaL := 'UPT+';
     end
     else if Kode = 'UHT' then
     begin
       if DK = 'D' then StatusAktivaP := 'UHT+'
       else StatusAktivaL := 'UHT-';
     end;

     // Step 4: Based on Kode, trigger sub-form di UI
     if Kode = 'AKV' or Kode = 'AKM' then
       FrmKasBankAktiva.ShowModal  // Aktiva sub-form
     else if Kode in ['PT', 'HT', 'UPT', 'UHT'] then
       FrmKasBankHutPiut.ShowModal // HutPiut modal popup
     else if Kode = 'DP' then
       FrmKasBankGiro.ShowModal    // Giro sub-form
   end;
end;
```

**Mapping Kode → Sub-Form:**

| Kode | Nama | Sub-Form Trigger | Field DB yang Digunakan |
|------|------|------------------|------------------------|
| `DP` | Deposito | `FrmKasBankGiro` | `dbDeposito` (status P+/P-) |
| `PT` | Piutang Dagang | `FrmKasBankHutPiut` | `dbTempHutPiut` → `dbHutPiut` |
| `HT` | Hutang Dagang | `FrmKasBankHutPiut` | `dbTempHutPiut` → `dbHutPiut` |
| `UPT` | Uang Muka Piutang | `FrmKasBankHutPiut` | `dbTempHutPiut` → `dbHutPiut` |
| `UHT` | Uang Muka Hutang | `FrmKasBankHutPiut` | `dbTempHutPiut` → `dbHutPiut` |
| `AKV` | Aktiva Tetap | `FrmKasBankAktiva` | `dbAktiva` + `dbAktivaDet` |
| `AKM` | Akumulasi Penyusutan | `FrmKasBankAktiva` | `dbAktiva` + `dbAktivaDet` |

**Logic universal:**
```
function resolveSubTransaction(perkiraan: String, dk: String): SubTransactionResult
    row = DB.query("SELECT * FROM dbPostHutPiut WHERE Perkiraan = ?", perkiraan)
    
    if row is empty then
        return { trigger: null, kode: null, statusP: null, statusL: null }
    
    kode = row.Kode
    statusP = ""
    statusL = ""
    
    switch kode:
        case "DP": statusP = (dk == "D") ? "DP+" : "DP-"
        case "PT": statusP = (dk == "D") ? "PT+" : "PT-"
        case "HT": statusP = (dk == "D") ? "HT-" : "HT+"
        case "UPT": statusP = (dk == "D") ? "UPT-" : "UPT+"
        case "UHT": statusP = (dk == "D") ? "UHT+" : "UHT-"
        case "AKV": statusP = (dk == "D") ? "AKV+" : "AKV-"
        case "AKM": statusP = (dk == "D") ? "AKM+" : "AKM-"
    
    if kode in ["AKV", "AKM"] then trigger = "aktiva"
    else if kode in ["PT", "HT", "UPT", "UHT"] then trigger = "hutpiut"
    else if kode = "DP" then trigger = "giro"
    else trigger = null
    
    return { trigger, kode, statusP, statusL }
```

> **⚠️ GAP KRITIS:** trade-exchange TIDAK mengimplementasikan trigger ini — semua nilai di-hardcode (`'HT-'`, `'BANK'`).

---

## 6. DK (Debet/Kredit) Calculation

DK.Text dihitung otomatis berdasarkan Mode transaksi:

| Mode | DK di Perkiraan | DK di Lawan |
|------|-----------------|-------------|
| BKK / BBK | `D` (Debet) | — |
| BKM / BBM | — | `D` (Debet) |

**Source:** `FrmKasBank.pas` baris 2490-2510

```pascal
if Mode.Text in ['BKK','BBK'] then DK.Text := 'D'  // Debet di Perkiraan
else DK.Text := 'K';  // BKM/BBM → Debet di Lawan
```

**Logic universal:**
```
function calculateDK(mode: String): String
    if mode in ['BKK', 'BBK'] then return 'D'
    else return 'K'
```

---

## 6.5 Sub-Transaction Fields — Cara Pengisian Per Sub-Transaksi

Field-field ini **tidak diisi manual oleh user** — semuanya otomatis dari `CekLawanDiPosting` dan sub-form masing-masing sub-transaksi. Field disimpan di `dbTransaksi` sebagai `CustSuppP`, `CustSuppL`, `KodeP`, `KodeL`, `NoAktivaP`, `NoAktivaL`, `StatusAktivaP`, `StatusAktivaL`, `StatusGiro`.

**Trigger:** `Perkiraan-Lawan` terdaftar di `dbPostHutPiut` → `CekLawanDiPosting` set field sesuai Kode + DK.

### 6.5.1 Giro (Kode = DP, StatusGiro)

| Field | DB Column | Dipakai Oleh | Cara Pengisian |
|-------|-----------|-------------|----------------|
| `StatusGiro` | `StatusGiro` | `dbGiro` | Otomatis dari `THPCChange`: `THPC.ItemIndex × Mode` → `P+`, `P-`, `H+`, `H-` |

```pascal
// Dari THPCChange — otomatis saat user pilih THPC
if (THPC.ItemIndex=3) and (Mode.Text='BKM') then StatusGiro := 'P+';  // Terima Giro
if (THPC.ItemIndex=3) and (Mode.Text in ['BKK','BBM']) then StatusGiro := 'P-';  // Pencairan Terima Giro
if (THPC.ItemIndex=2) and (Mode.Text='BKM') then StatusGiro := 'H+';  // Buka Giro
if (THPC.ItemIndex=2) and (Mode.Text='BKK') then StatusGiro := 'H-';  // Pencairan Buka Giro
```

> **⚠️ CATATAN:** `StatusGiro` TIDAK ada di `dbPostHutPiut` — ini khusus untuk sub-form Giro. Saat user pilih THPC `[H]Hutang Giro` atau `[P]Piutang Giro`, sub-form Giro otomatis muncul dan `StatusGiro` di-set dari THPC × Mode.

### 6.5.2 HutPiut (KodeP, KodeL, CustSuppP, CustSuppL)

| Field | DB Column | Dipakai Oleh | Cara Pengisian |
|-------|-----------|-------------|----------------|
| `KodeP` | `KodeP` | `dbHutPiut` (sisi Perkiraan) | Dari `CekLawanDiPosting(Perkiraan, 'D')` → `dbPostHutPiut.Kode` |
| `KodeL` | `KodeL` | `dbHutPiut` (sisi Lawan) | Dari `CekLawanDiPosting(Lawan, 'K')` → `dbPostHutPiut.Kode` |
| `CustSuppP` | `CustSuppP` | `dbHutPiut` (sisi Perkiraan) | Dari FrBrows saat TampilHutPiut — KodeCustSuppP.Text |
| `CustSuppL` | `CustSuppL` | `dbHutPiut` (sisi Lawan) | Dari FrBrows saat TampilHutPiut — KodeCustSuppL.Text |

**Mapping Kode → Status HutPiut dari `CekLawanDiPosting`:**

| Kode dbPostHutPiut | DK='D' (Perkiraan Debet) | DK='K' (Lawan Kredit) |
|---|---|---|
| `PT` | `StatusAktivaP = 'PT+'` | `StatusAktivaL = 'PT-'` |
| `HT` | `StatusAktivaP = 'HT-'` | `StatusAktivaL = 'HT+'` |
| `UPT` | `StatusAktivaP = 'UPT-'` | `StatusAktivaL = 'UPT+'` |
| `UHT` | `StatusAktivaP = 'UHT+'` | `StatusAktivaL = 'UHT-'` |

**Cara pengisian CustSuppP/CustSuppL dari FrBrows:**

```pascal
// Dari TampilHutPiut — user pilih customer/supplier via FrBrows
FrBrows.KodeBrows := 1014;
FrBrows.NoKira := Perkiraan.Text;  // filter berdasarkan perkiraan
FrBrows.NoKira2 := '';
FrBrows.ShowModal;
if FrBrows.ModalResult = mrOk then
begin
  KodeCustSuppP.Text := FrBrows.HasilKode;  // → CustSuppP
  KodeCustSuppL.Text := FrBrows.HasilKode;  // → CustSuppL
end;
```

> **⚠️ CATATAN:** `KodeP` dan `KodeL` adalah **Kode dari `dbPostHutPiut`** (PT/HT/UPT/UHT), BUKAN DK. Field ini menentukan sub-tipe HutPiut. `CustSuppP` dan `CustSuppL` adalah **Kode Customer/Supplier** dari FrBrows (KodeBrows=1014), disimpan di `dbHutPiut.KodeCustSupp`.

### 6.5.3 Aktiva (StatusAktivaP, StatusAktivaL, NoAktivaP, NoAktivaL)

| Field | DB Column | Dipakai Oleh | Cara Pengisian |
|-------|-----------|-------------|----------------|
| `StatusAktivaP` | `StatusAktivaP` | `dbAktiva` (sisi Perkiraan) | Dari `CekLawanDiPosting(Perkiraan, 'D')` → `AKV+`, `AKM+`, `AKV-`, `AKM-` |
| `StatusAktivaL` | `StatusAktivaL` | `dbAktiva` (sisi Lawan) | Dari `CekLawanDiPosting(Lawan, 'K')` → `AKV+`, `AKM+`, `AKV-`, `AKM-` |
| `NoAktivaP` | `NoAktivaP` | `dbAktiva` (sisi Perkiraan) | Dari sub-form Aktiva — KodeAktiva.Text setelah user pilih aktiva |
| `NoAktivaL` | `NoAktivaL` | `dbAktiva` (sisi Lawan) | Dari sub-form Aktiva — KodeAktiva.Text setelah user pilih aktiva |

**Mapping Kode → Status Aktiva dari `CekLawanDiPosting`:**

| Kode dbPostHutPiut | DK='D' (Perkiraan Debet) | DK='K' (Lawan Kredit) |
|---|---|---|
| `AKV` | `StatusAktivaP = 'AKV+'` | `StatusAktivaL = 'AKV-'` |
| `AKM` | `StatusAktivaP = 'AKM+'` | `StatusAktivaL = 'AKM-'` |

**Cara pengisian NoAktivaP/NoAktivaL dari sub-form Aktiva:**

```pascal
// Dari PerkiraanExit / LawanExit
CekLawanDiPosting(Perkiraan.Text, 'D', KodeP);  // → set StatusAktivaP
Aktiva(StatusAktivaP, Perkiraan.Text, NoAktivaP);  // → buka sub-form Aktiva
// User pilih aktiva di sub-form → NoAktivaP diisi KodeAktiva.Text
```

> **⚠️ CATATAN:** `StatusAktivaP` dan `StatusAktivaL` menentukan tipe aktiva: `AKV+` = Aktiva Tetap Baru, `AKM+` = Akumulasi Penyusutan Baru, `AKV-` = Penjualan Aktiva, `AKM-` = Pembatalan Penyusutan. `NoAktivaP` dan `NoAktivaL` diisi dari sub-form Aktiva setelah user memilih/menginput aktiva.

### 6.5.4 Ringkasan Alur Pengisian Field

```
1. User pilih Mode (BKM/BKK/BBM/BBK)
2. User pilih THPC (C/T/H/P) → jika H atau P → StatusGiro di-set otomatis
3. User input Perkiraan + Lawan
4. PerkiraanExit / LawanExit dipanggil:
   a. CekLawanDiPosting(Perkiraan/Lawan, DK) → set KodeP/KodeL + StatusAktivaP/StatusAktivaL
   b. Jika Kode in [PT,HT,UPT,UHT] → TampilHutPiut → FrBrows → set CustSuppP/CustSuppL
   c. Jika Kode in [AKV,AKM] → Aktiva → sub-form → set NoAktivaP/NoAktivaL
5. User isi sub-form (Giro/HutPiut/Aktiva/Deposito) sesuai Kode
6. SimpanData → kirim semua field ke SP via Parameters[20-31]
```

**Parameter SP SimpanData:**

| Param | Field | Sumber |
|-------|-------|--------|
| [19] | THPC (1 char) | Copy(THPC.Text, 2, 1) |
| [20] | CustSuppP | KodeCustSuppP.Text (dari FrBrows) |
| [21] | CustSuppL | KodeCustSuppL.Text (dari FrBrows) |
| [23] | NoAktivaP | Dari sub-form Aktiva |
| [24] | NoAktivaL | Dari sub-form Aktiva |
| [25] | StatusAktivaP | Dari CekLawanDiPosting |
| [26] | StatusAktivaL | Dari CekLawanDiPosting |
| [27] | NoBon | NoBon.Text |
| [28] | KodeBag | KodeBag.Text (No. SPK) |
| [29] | KodeP | Dari CekLawanDiPosting (Kode dari dbPostHutPiut) |
| [30] | KodeL | Dari CekLawanDiPosting (Kode dari dbPostHutPiut) |
| [31] | StatusGiro | Dari THPCChange (THPC × Mode) |

---

---

## 6.6 Field dbHutPiut — Cara Pengisian Per Field

Setelah user menyelesaikan transaksi di sub-form HutPiut (`FrmKasBankHutPiut.pas`), data dipromote dari `dbTempHutPiut` → `dbHutPiut` via `SimpanDataHutPiut`. Berikut cara pengisian setiap field:

### 6.6.1 TipeTrans — Jenis Transaksi Asal

| Field | Tipe | Sumber | Keterangan |
|-------|------|--------|------------|
| `TipeTrans` | String | `vwHutPiut.TipeTrans` | Jenis transaksi asal dari invoice: `INV` (Invoice), `RET` (Retur), `DN` (Debit Note), dll. **DIISI OTOMATIS** dari view `vwHutPiut` saat `IsiTempHutPiut` dipanggil. |

**Cara pengisian:**
```sql
-- Dari IsiTempHutPiut — otomatis dari vwHutPiut
INSERT INTO dbTempHutPiut (TipeTrans, ...)
SELECT Y.TipeTrans, ...
FROM vwHutPiut Y
WHERE Y.KodeCustSupp = pKodeCustSupp
  AND Y.Perkiraan = pPerkiraan;
```

> **⚠️ CATATAN:** `TipeTrans` adalah **jenis transaksi asal** (INV/RET/DN), BUKAN jenis transaksi KasBank. Field ini menandai apakah tagihan berasal dari invoice biasa, retur, atau debit note.

### 6.6.2 NoBukti — Nomor Bukti KasBank

| Field | Tipe | Sumber | Keterangan |
|-------|------|--------|------------|
| `NoBukti` | String | `dbTempHutPiut.NoBukti` | Nomor bukti transaksi KasBank yang sedang diproses. **DIISI OTOMATIS** dari `NOBUKTI.Text` di form KasBank utama. |

**Cara pengisian:**
```sql
-- Dari IsiTempHutPiut — otomatis dari parameter pNoBukti
INSERT INTO dbTempHutPiut (NoBukti, ...)
SELECT Y.NoBukti, ...
FROM vwHutPiut Y
WHERE ...;
```

> **⚠️ CATATAN:** `NoBukti` merujuk ke **nomor bukti KasBank** (misal: `0001/BKM-ABC/202606`), bukan nomor faktur. Ini menghubungkan record HutPiut dengan transaksi KasBank yang membayarnya.

### 6.6.3 NoMsk — Nomor Skeduler

| Field | Tipe | Sumber | Keterangan |
|-------|------|--------|------------|
| `NoMsk` | Integer | `vwHutPiut.NoMsk` | Nomor skeduler dari `vwHutPiut`. **DIISI OTOMATIS** dari view. |

**Cara pengisian:**
```sql
-- Dari IsiTempHutPiut — otomatis dari vwHutPiut
INSERT INTO dbTempHutPiut (NoMsk, ...)
SELECT Y.NoMsk, ...
FROM vwHutPiut Y;
```

> **⚠️ CATATAN:** `NoMsk` (Nomor Skeduler) adalah nomor unik per-tagihan di `vwHutPiut`. Digunakan untuk mengidentifikasi record HutPiut secara unik bersama `NoBukti` dan `Urut`.

### 6.6.4 Urut — Nomor Urut

| Field | Tipe | Sumber | Keterangan |
|-------|------|--------|------------|
| `Urut` | Integer | `vwHutPiut.Urut` | Nomor urut detail transaksi. **DIISI OTOMATIS** dari view. |

**Cara pengisian:**
```sql
-- Dari IsiTempHutPiut — otomatis dari vwHutPiut
INSERT INTO dbTempHutPiut (Urut, ...)
SELECT Y.Urut, ...
FROM vwHutPiut Y;
```

### 6.6.5 Tipe — Kode Sub-Tipe HutPiut

| Field | Tipe | Sumber | Keterangan |
|-------|------|--------|------------|
| `Tipe` | String | `vwHutPiut.Tipe` | Kode sub-tipe: `PT`, `HT`, `UPT`, `UHT`. **DIISI OTOMATIS** dari view. Menentukan tipe HutPiut. |

**Cara pengisian:**
```sql
-- Dari IsiTempHutPiut — otomatis dari vwHutPiut
INSERT INTO dbTempHutPiut (Tipe, ...)
SELECT Y.Tipe, ...
FROM vwHutPiut Y;
```

> **⚠️ CATATAN:** `Tipe` adalah **kode sub-tipe HutPiut** (PT/HT/UPT/UHT), diambil dari `vwHutPiut.Tipe`. Berbeda dengan `KodeP`/`KodeL` di header `dbTransaksi` — `Tipe` adalah field di `dbHutPiut` yang menandai tipe tagihan spesifik.

### 6.6.6 Perkiraan — Akun Perkiraan

| Field | Tipe | Sumber | Keterangan |
|-------|------|--------|------------|
| `Perkiraan` | String | `vwHutPiut.Perkiraan` | Akun perkiraan HutPiut. **DIISI OTOMATIS** dari view. |

**Cara pengisian:**
```sql
-- Dari IsiTempHutPiut — otomatis dari vwHutPiut
INSERT INTO dbTempHutPiut (Perkiraan, ...)
SELECT Y.Perkiraan, ...
FROM vwHutPiut Y
WHERE Y.Perkiraan = pPerkiraan;  -- filter berdasarkan perkiraan
```

### 6.6.7 Ringkasan Alur Pengisian Field dbHutPiut

```
1. User pilih customer via FrBrows (KodeBrows=1014)
2. IsiTempHutPiut dipanggil → isi dbTempHutPiut dari vwHutPiut
   - TipeTrans, NoBukti, NoMsk, Urut, Tipe, Perkiraan → dari vwHutPiut
   - TipeDK → dari parameter pDK ('D' atau 'K')
3. User pilih invoice untuk dibayar di sub-form HutPiut
4. SimpanDataHutPiut dipanggil → promosikan dbTempHutPiut → dbHutPiut
   - DELETE dbHutPiut WHERE NoBukti=:0 AND NoMsk=:1
   - INSERT/UPDATE dbHutPiut dari dbTempHutPiut
```

**Semua field dbHutPiut diisi otomatis dari `vwHutPiut` — tidak ada field yang diisi manual oleh user.**

| Field | Sumber | Manual? |
|-------|--------|---------|
| `NoFaktur` | `vwHutPiut.NoFaktur` | Tidak |
| `NoRetur` | `vwHutPiut.NoRetur` | Tidak |
| `TipeTrans` | `vwHutPiut.TipeTrans` | Tidak |
| `KodeCustSupp` | `vwHutPiut.KodeCustSupp` | Tidak |
| `NoBukti` | `vwHutPiut.NoBukti` | Tidak |
| `NoMsk` | `vwHutPiut.NoMsk` | Tidak |
| `Urut` | `vwHutPiut.Urut` | Tidak |
| `Tanggal` | `vwHutPiut.Tanggal` | Tidak |
| `JatuhTempo` | `vwHutPiut.JatuhTempo` | Tidak |
| `Debet`/`Kredit` | `vwHutPiut.Debet`/`Kredit` | Tidak |
| `Valas`/`Kurs` | `vwHutPiut.Valas`/`Kurs` | Tidak |
| `Tipe` | `vwHutPiut.Tipe` | Tidak |
| `Perkiraan` | `vwHutPiut.Perkiraan` | Tidak |
| `Catatan` | `vwHutPiut.Catatan` | Tidak |

---

## 7. dbTempHutPiut — Staging Table Settlement

Pelunasan utang/piutang **tidak langsung** menulis ke tabel kartu. Sistem menggunakan `dbTempHutPiut` sebagai staging area — temporary table per-user yang menampung detail pembayaran sebelum di-finalize.

### Struktur dbTempHutPiut

| Field | Tipe | Keterangan |
|-------|------|------------|
| `NoFaktur` | String | Nomor faktur/tagihan asal |
| `NoRetur` | String | Nomor retur (kosong jika bukan retur) |
| `TipeTrans` | String | Jenis transaksi asal (INV, RET, dll) |
| `KodeCustSupp` | String | Kode customer/supplier |
| `NoBukti` | String | No. Bukti transaksi kasbank yang bayar |
| `NoMsk` | Integer | Nomor masuk (internal sequence) |
| `Urut` | Integer | Urutan pembayaran per faktur |
| `Tanggal` | Date | Tanggal transaksi |
| `JatuhTempo` | Date | Jatuh tempo faktur |
| `Debet` | Decimal | Nilai debit (untuk PT+, HT-) |
| `Kredit` | Decimal | Nilai kredit (untuk PT-, HT+) |
| `Saldo` | Decimal | Saldo berjalan per faktur |
| `Valas` | String | Mata uang transaksi |
| `Kurs` | Decimal | Kurs saat transaksi |
| `DebetD` | Decimal | Nilai debit dalam valuta asing |
| `KreditD` | Decimal | Nilai kredit dalam valuta asing |
| `SaldoD` | Decimal | Saldo dalam valuta asing |
| `Tipe` | String | Tipe sub-ledger (PT, HT, UPT, UHT) |
| `Perkiraan` | String | Akun COA yang terkait |
| `Catatan` | String | Catatan tambahan |
| `IDUser` | String | User yang input (untuk isolation per-user) |
| `StatusUID` | String | `'D'` = dihapus (soft-delete), `NULL` = aktif |
| `JumlahSaldo` | Decimal | Running balance total per faktur (computed) |
| `JumlahSaldoD` | Decimal | Running balance valas per faktur (computed) |
| `NoInvoice` | String | Nomor invoice referensi |
| `Valas_` | String | Mata uang faktur asal (bisa beda dengan Valas header) |
| `Kurs_` | Decimal | Kurs faktur asal |
| `TipeDK` | String | `D` = Debit (piutang), `K` = Kredit (utang) |

### Flow dbTempHutPiut

```
[Pilih supplier/customer di sub-ledger]
    → [Sistem insert tagihan terbuka ke dbTempHutPiut via QuHutPiut query]
    → [User pilih faktur → klik "Pelunasan"]
    → [Input nominal pembayaran]
    → [Sistem hitung: Dibayar vs Sisa vs Total]
    → [Klik "Tambah" → insert record baru ke dbTempHutPiut (Choice='I')]
    → [Record baru: TipeTrans='L' (Lunas), NoBukti=no bukti kasbank]
    → [Running balance JumlahSaldo di-update otomatis]
    → [Simpan transaksi kasbank → record dipromote dari dbTempHutPiut ke dbHutPiut]
```

### Partial Payment (Bertahap)

```
Faktur: INV-001, Saldo: Rp 10.000.000

Transaksi 1: BKK Rp 3.000.000 → insert ke dbTempHutPiut (Urut=1)
    → JumlahSaldo tersisa: Rp 7.000.000

Transaksi 2: BKK Rp 5.000.000 → insert ke dbTempHutPiut (Urut=2)
    → JumlahSaldo tersisa: Rp 2.000.000

Transaksi 3: BKK Rp 2.000.000 → insert ke dbTempHutPiut (Urut=3)
    → Faktur INV-001 LUNAS (JumlahSaldo = 0)
```

### Cross-Currency Settlement

Jika faktur dalam USD (kurs 15.500) tapi dibayar dalam IDR:
- `Valas_` = USD (mata uang faktur)
- `Kurs_` = 15.500 (kurs faktur)
- `Valas` = IDR (mata uang pembayaran)
- `Kurs` = 15.800 (kurs bayar)
- `JumlahD` = nominal dalam USD (konversi dari IDR)
- Selisih kurs dicatat sebagai selisih valuta asing

> **Penting:** Saat pembayaran dibatalkan (`StatusUID='D'`), record tetap ada di dbTempHutPiut tapi tidak masuk perhitungan running balance. Ini memungkinkan reaktivasi pembayaran tanpa kehilangan histori.

---

## 8. Validasi Gates (CRITICAL)

Setiap save **harus** jalankan 3 validation gates:

```
function validateSave(data):
    // Gate 1: CekPeriode
    if not isValidPeriod(data.Tanggal) then
        throw "Tanggal di luar periode aktif"
    
    // Gate 2: IsLockPeriode
    if isPeriodLocked(data.Tanggal) then
        throw "Periode terkunci, tidak bisa simpan transaksi"
    
    // Gate 3: IsOtorisasi (untuk U/D only, I tidak perlu)
    if data.Choice in ['U', 'D'] and isOtorisasiApplied(data.NoBukti) then
        throw "Transaksi sudah diotorisasi, tidak bisa diubah/hapus"
```

> **⚠️ CRITICAL:** Both `CekPeriode` AND `IsLockPeriode` harus di-check (independen gates). Missing either causes data integrity issues.

---

## 9. Dual-Mode Architecture (SP + Direct SQL)

```
function save(choice, data, userId):
    // 1. Validasi gates (always run)
    validateSave(data)
    
    // 2. Try Stored Procedure first (production behavior)
    try:
        callStoredProcedures(choice, data)
        return { success: true, savedVia: "sp" }
    catch (error):
        log.warning("SP unavailable, falling back to direct SQL", error)
    
    // 3. Fallback to direct SQL (dev/test behavior)
    return saveDirect(choice, data, userId)
```

> **PITFALL:** Jangan panggil stored procedure di try-catch tanpa logging. Production bisa silently fallback tanpa jejak audit.

---

## 10. Jurnal Biasa (Tanpa Sub-Proses)

Transaksi KasBank biasa hanya menulis ke tabel utama — **tidak ada sub-proses tambahan**:

```
Flow:
1. User isi header (BKM/BKK/BBM/BBK, tanggal, note, devisi)
2. User isi detail (valas, kurs, jumlah, keterangan, lawan)
3. CekLawanDiPosting(Lawan, DK) → lookup dbPostHutPiut → Kode = COS/HPP/BIAYA/LAINNYA
4. Klik Simpan → Sp_Transaksi.ExecProc → INSERT/UPDATE dbTransaksi
5. Selesai. Tidak ada tabel lain yang terpengaruh.
```

**Contoh:**
- BKM tunai dari customer (THPC=C, Lawan=BANK) → hanya `dbTransaksi`
- BKK transfer antar bank (THPC=T) → hanya `dbTransaksi`
- BBM penerimaan non-tunai tanpa sub-ledger → hanya `dbTransaksi`

**Cara deteksi:** `dbPostHutPiut` tidak punya record untuk perkiraan-lawan → `needsSubProcess = false`

> **⚠️ GAP KRITIS:** trade-exchange TIDAK membedakan jurnal biasa vs sub-proses — semua di-hardcode (`'HT-'`, `'BANK'`). be-fitur sudah mengimplementasikan via `SubTransactionResolver` yang lookup `dbPostHutPiut` sebelum memutuskan sub-proses mana yang dijalankan.

---

## 11. Sub-Proses: Giro (Kode = DP, StatusGiro = P+/P-/H+/H-)

Sub-proses Giro menangani pembukaan dan pencairan giro atas nama customer/supplier.

**Trigger:** `Perkiraan-Lawan` terdaftar di `dbPostHutPiut` dengan **Kode = DP** (Deposito/Piutang Giro).

**Sub-Form:** `FrmKasBankGiro.pas` (289 lines)

### 11.1 Flow Buka Giro (StatusGiro = P+ atau H+)

```
Flow:
1. User isi header KasBank (BKM/BKK + THPC + Mode)
2. CekLawanDiPosting → Kode = DP → sub-form Giro otomatis muncul
3. Isi field sub-form:
   - NoGiro (nomor giro)
   - Bank (nama bank)
   - TglGiro (tanggal buka giro)
   - KodeVls (valas)
   - Kurs
   - Nilai Giro (jumlah)
   - Keterangan (deskripsi)
4. Validasi: cek duplikat (NoGiro+Bank+TglGiro) di dbGiro
5. Klik Simpan (btnOKClick):
   
   a. INSERT ke dbGiro:
      - NoGiro = DetNoGiro.Text
      - Bank = DetBank.Text
      - TglGiro = DetTglGiro.Date
      - KodeVls, Kurs
      
   b. Isi field Debet/Kredit sesuai StatusGiro:
      
      Jika StatusGiro = 'P+' (BKM — giro masuk/piutang):
        - Tipe = 'PT'
        - Keterangan = DetKeterangan.Text
        - Jika KodeVls = 'IDR':
          * Debet = 0
          * Jumlah = 0
          * Kredit = 0
          * KreditRp = 0
        - Jika KodeVls != 'IDR':
          * Debet = NilaiGiro
          * Jumlah = NilaiGiro
          * DebetRp = NilaiGiro × Kurs
          * Kredit = 0
          * KreditRp = 0
          * JumlahRp = NilaiGiro × Kurs
        - BuktiBuka = NoBukti KasBank
        - urutBuktiBuka = mUrut
        - TglBuka = Tanggal KasBank
      
      Jika StatusGiro = 'H+' (BKK — giro keluar/hutang):
        - Tipe = 'HT'
        - Keterangan = DetKeterangan.Text
        - Jika KodeVls = 'IDR':
          * Kredit = 0
          * Jumlah = 0
          * Debet = 0
          * DebetRp = 0
        - Jika KodeVls != 'IDR':
          * Kredit = NilaiGiro
          * Jumlah = NilaiGiro
          * KreditRp = NilaiGiro × Kurs
          * Debet = 0
          * DebetRp = 0
          * JumlahRp = NilaiGiro × Kurs
        - BuktiBuka = NoBukti KasBank
        - urutBuktiBuka = mUrut
        - TglBuka = Tanggal KasBank
```

**Delphi source:** `FrmKasBankGiro.pas` procedure `TFrKasBankGiro.btnOKClick` (line 289)

**Validasi:**
- NoGiro dan Bank tidak boleh kosong
- Cek duplikat: `SELECT * FROM dbGiro WHERE NoGiro=:0 AND Bank=:1 AND TglGiro=:2 AND Tipe='PT'/'HT'`
- Cek duplikat di grid: `dxGiro.Locate('NoGiro;Bank;TglGiro', ...)`

**PENTING:** Jika valas = 'IDR', maka Debet, Kredit, Jumlah DISET KE 0. Hanya jika valas != 'IDR' maka Debet/Kredit diisi sesuai StatusGiro.

---

### 11.2 Flow Cairkan Giro (StatusGiro = P- atau H-)

```
Flow:
1. User isi header KasBank (BKM/BKK + THPC + Mode)
2. CekLawanDiPosting → Kode = DP → sub-form Giro otomatis muncul
3. Isi field sub-form:
   - NoGiro (nomor giro yang sudah ada)
   - Bank (nama bank)
   - TglGiro (tanggal cair giro)
   - KodeVls (valas)
   - Kurs
   - Nilai Giro (jumlah)
   - Keterangan Cair (deskripsi pencairan)
4. Klik Simpan (btnOKClick):
   
   a. UPDATE dbGiro (berdasarkan NoGiro+Bank+TglGiro):
   
      Jika StatusGiro = 'P-' (BKK — cairkan piutang):
        - Tipe = 'PT'
        - KeteranganCair = DetKeterangan.Text
        - Jika KodeVls = 'IDR':
          * Kredit = 0
          * Jumlah = 0
          * Debet = 0
          * DebetRp = 0
        - Jika KodeVls != 'IDR':
          * Kredit = NilaiGiro
          * Jumlah = NilaiGiro
          * KreditRp = NilaiGiro × Kurs
          * Debet = 0
          * DebetRp = 0
          * JumlahRp = NilaiGiro × Kurs
        - BuktiCair = NoBukti KasBank
        - urutBuktiCair = mUrut
        - TglCair = Tanggal KasBank
      
      Jika StatusGiro = 'H-' (BBK — cairkan hutang):
        - Tipe = 'HT'
        - KeteranganCair = DetKeterangan.Text
        - Jika KodeVls = 'IDR':
          * Debet = 0
          * Jumlah = 0
          * Kredit = 0
          * KreditRp = 0
        - Jika KodeVls != 'IDR':
          * Debet = NilaiGiro
          * Jumlah = NilaiGiro
          * DebetRp = NilaiGiro × Kurs
          * Kredit = 0
          * KreditRp = 0
          * JumlahRp = NilaiGiro × Kurs
        - BuktiCair = NoBukti KasBank
        - urutBuktiCair = mUrut
        - TglCair = Tanggal KasBank
```

**Delphi source:** `FrmKasBankGiro.pas` procedure `TFrKasBankGiro.btnOKClick` (line 289)

**Mapping StatusGiro → Action:**

| StatusGiro | THPC | Mode | Meaning | Action |
|-----------|------|------|---------|--------|
| `P+` | `C` | `BKM` | Buka Giro Piutang (kas masuk) | INSERT dbGiro, isi field Debet |
| `P-` | `C` | `BKK/BBM` | Cairkan Giro Piutang (kas keluar) | UPDATE dbGiro, isi field Kredit + BuktiCair |
| `H+` | `H` | `BKK` | Buka Giro Hutang (kas keluar) | INSERT dbGiro, isi field Kredit |
| `H-` | `H` | `BBK` | Cairkan Giro Hutang (kas masuk) | UPDATE dbGiro, isi field Debet + BuktiCair |

**Tabel:** `dbGiro`

**Fields ditulis:** `NoGiro`, `Bank`, `TglGiro`, `KodeVls`, `Kurs`, `Debet`, `Kredit`, `DebetRp`, `KreditRp`, `Jumlah`, `JumlahRp`, `Keterangan`, `KeteranganCair`, `Tipe`, `BuktiBuka`, `urutBuktiBuka`, `TglBuka`, `BuktiCair`, `urutBuktiCair`, `TglCair`, `KAS`

---

## 12. Sub-Proses: Deposito (Kode = DP, Status = DP+/DP-)

Sub-proses Deposito menangani pembukaan dan pencauran deposito berjangka. Struktur sama persis dengan Giro tetapi menggunakan tabel `dbDeposito`.

**Trigger:** `Perkiraan-Lawan` terdaftar di `dbPostHutPiut` dengan **Kode = DP** dan THPC menunjukkan Deposito.

**Sub-Form:** `FrmKasBankDeposito.pas` (253 lines)

### 12.1 Flow Buka Deposito (Status = DP+)

```
Flow:
1. User isi header KasBank
2. CekLawanDiPosting → Kode = DP → sub-form Deposito muncul
3. Isi field sub-form:
   - NoDeposito (nomor sertifikat deposito)
   - Bank (nama bank)
   - Tanggal (tanggal buka)
   - TglJatuhTempo (tanggal jatuh tempo)
   - KodeVls, Kurs
   - Nilai Giro (jumlah)
   - Keterangan
4. Validasi: cek duplikat (NoDeposito+Bank+Tgl) di dbDeposito
5. Klik Simpan (btnOKClick):
   
   a. INSERT ke dbDeposito:
      - NoDeposito, Bank, Tanggal
      - TglJatuhTempo
      - KodeVls, Kurs
      
   b. Isi field Debet/Kredit:
      - Keterangan = DetKeterangan.Text
      - Jika KodeVls = 'IDR':
        * Debet = 0
        * Jumlah = 0
        * Kredit = 0
        * KreditRp = 0
      - Jika KodeVls != 'IDR':
        * Debet = NilaiGiro
        * Jumlah = NilaiGiro
        * DebetRp = NilaiGiro × Kurs
        * Kredit = 0
        * KreditRp = 0
        * JumlahRp = NilaiGiro × Kurs
      - BuktiBuka = NoBukti KasBank
      - urutBuktiBuka = mUrut
      - TglBuka = Tanggal KasBank
```

**Delphi source:** `FrmKasBankDeposito.pas` procedure `TFrKasBankDeposito.btnOKClick` (line 253)

**Validasi:**
- NoDeposito dan Bank tidak boleh kosong
- Cek duplikat: `SELECT * FROM dbDeposito WHERE NoDeposito=:0 AND Bank=:1 AND Tanggal=:2`
- Cek duplikat di grid: `dxDeposito.Locate('NoDeposito;Bank;Tanggal', ...)`

**PENTING:** Jika valas = 'IDR', maka Debet, Kredit, Jumlah DISET KE 0. Hanya jika valas != 'IDR' maka Debet/Kredit diisi.

---

### 12.2 Flow Cairkan Deposito (Status = DP-)

```
Flow:
1. User isi header KasBank
2. CekLawanDiPosting → Kode = DP → sub-form Deposito muncul
3. Isi field sub-form (sama):
   - NoDeposito, Bank, Tanggal
   - TglJatuhTempo, Keterangan Cair, Nilai Giro
4. Klik Simpan (btnOKClick):
   
   a. UPDATE dbDeposito (berdasarkan NoDeposito+Bank+Tanggal):
      - KeteranganCair = DetKeterangan.Text
      - Jika KodeVls = 'IDR':
        * Kredit = 0
        * Jumlah = 0
        * Debet = 0
        * DebetRp = 0
      - Jika KodeVls != 'IDR':
        * Kredit = NilaiGiro
        * Jumlah = NilaiGiro
        * KreditRp = NilaiGiro × Kurs
        * Debet = 0
        * DebetRp = 0
        * JumlahRp = NilaiGiro × Kurs
      - Tipe = 'PT'
      - BuktiCair = NoBukti KasBank
      - urutBuktiCair = mUrut
      - TglCair = Tanggal KasBank
```

**Delphi source:** `FrmKasBankDeposito.pas` procedure `TFrKasBankDeposito.btnOKClick` (line 253)

**Tabel:** `dbDeposito`

**Fields ditulis:** `NoDeposito`, `Bank`, `Tanggal`, `TglJatuhTempo`, `KodeVls`, `Kurs`, `Debet`, `Kredit`, `DebetRp`, `KreditRp`, `Jumlah`, `JumlahRp`, `Keterangan`, `KeteranganCair`, `BuktiBuka`, `urutBuktiBuka`, `TglBuka`, `BuktiCair`, `urutBuktiCair`, `TglCair`

---

## 13. Sub-Proses: Hutang/Piutang (Kode = PT/HT/UPT/UHT)

Sub-proses Hutang/Piutang menangani pelunasan piutang customer, pelunasan hutang supplier, penambahan hutang baru, penambahan piutang baru, uang muka piutang, dan uang muka hutang. Menggunakan **staging table** `dbTempHutPiut` sebelum data dipromote ke `dbHutPiut`.

**Trigger:** `Perkiraan-Lawan` terdaftar di `dbPostHutPiut` dengan **Kode = PT** (Piutang Dagang), **HT** (Hutang Dagang), **UPT** (Uang Muka Piutang), atau **UHT** (Uang Muka Hutang).

**Sub-Form:** `FrmKasBankHutPiut.pas` (723 lines)

**SP:** `sp_TempHutPiut` (parameterized, 26 parameter)

---

### 13.1 TampilHutPiut — Memilih Customer/Supplier

Ini adalah **entry point** dari KasBank utama ke sub-form HutPiut. Fungsi ini menangani pemilihan customer/supplier melalui browser universal `FrBrows`.

```
procedure TampilHutPiut(xkode, xStatus, xPerkiraan, DK: String; Var xKodeCustSupp: TEdit)

Parameter:
- xkode: Tipe HutPiut ('PT', 'HT', 'UPT', 'UHT')
- xStatus: StatusHutPiut ('PT+', 'PT-', 'HT+', 'HT-', 'UPT+', 'UPT-', 'UHT+', 'UHT-')
- xPerkiraan: Kode perkiraan lawan
- DK: 'D' (Debet) atau 'K' (Kredit)
- xKodeCustSupp: Edit field yang diisi dengan KodeCustSupp terpilih

Flow:

1. Validasi xStatus IN ('PT+','PT-','HT+','HT-','UPT+','UPT-','UHT+','UHT-')

2. Jika Model='koreksi':
   - Cek: perkiraan-lawan cocok dengan detail KasBank (QuTransaksiPerkiraan / QuTransaksiLawan)
   - Cek: customer terdaftar di dbCustSupp dengan Perkiraan ini
   - HapusTempHutPiut(DK) → delete dbTempHutPiut WHERE TipeDK=:1

3. Buka browser universal FrBrows (Application.CreateForm(TFrBrows, FrBrows)):
   - KodeBrows = 1014 (konstanta untuk customer/supplier browser)
   - NoKira = xPerkiraan (filter: hanya customer/supplier dengan perkiraan ini)
   - NoKira2 = xkode (filter: tipe PT/HT/UPT/UHT)
   - IsiData = KodeCustSuppP/L.Text (tergantung DK):
     * Jika DK='D' → IsiData = KodeCustSuppP.Text (Customer)
     * Jika DK='K' → IsiData = KodeCustSuppL.Text (Supplier)
   - frbrows.ShowModal

4. Jika user memilih customer/supplier (FrBrows.ModalResult = mrOk):
   - xKodeCustSupp.Text = FrBrows.QuBrows.FieldByName('KodeCustSupp').AsString
   - Set sub-form properties:
     * Caption = "Pelunasan/Penambahan [Hutang/Piutang] " + xPerkiraan
     * StatusHutPiut = xStatus
     * Label1 = KodeCustSupp (display ID)
     * Label2 = NamaCustSupp (display nama)
     * Label3 = NoBukti KasBank (display no bukti)
     * TambahBtn.Enabled = (xStatus IN ('PT-','HT-','UPT-','UHT-')) → hanya pelunasan
     * SpeedButton2.Enabled = (xStatus IN ('PT+','HT+','UPT+','UHT+')) → hanya penambahan
   - IsiTempHutPiut(DK, xkode, NOBUKTI.Text, IntToStr(mUrut), Valas.Text, xKodeCustSupp.Text, xPerkiraan)
     → load data piutang/hutang yang belum lunas dari vwHutPiut ke dbTempHutPiut
   - FrKasBankHutPiut.ShowModal

5. Jika user batal (ModalResult <> mrOk):
   - FrKasBank.ActiveControl = xKodeCustSupp (kembali ke field sebelumnya)
```

**Delphi source:** `FrmKasBank.pas` procedure `TFrKasBank.TampilHutPiut`

**Key detail:** Browser FrBrows adalah komponen universal yang dipakai di seluruh PWT. Kode `1014` adalah konstanta yang mengidentifikasi customer/supplier browser. Filter `NoKira` (perkiraan) dan `NoKira2` (tipe) memastikan user hanya melihat customer/supplier yang relevan dengan transaksi ini.

---

### 13.2 Cara Menampilkan Nama Customer/Supplier di Sub-Form HutPiut

Setelah customer/supplier dipilih, nama ditampilkan melalui **Label2**:

```
Flow saat sub-form terbuka:
1. FrBrows.QuBrows berisi hasil pencarian customer/supplier
2. Field yang diambil:
   - KodeCustSupp → xKodeCustSupp.Text + Label1.Caption
   - NamaCustSupp → Label2.Caption (format: "[ Nama Customer/Supplier ]")
3. Saat user memilih customer, sub-form HutPiut dibuka:
   - FrKasBankHutPiut.Label1.Caption = KodeCustSupp (ID)
   - FrKasBankHutPiut.Label2.Caption = "[ " + dm.QuCari.FieldByName('NamaCustSupp').AsString + " ]"
   - FrKasBankHutPiut.Label3.Caption = NoBukti KasBank
```

**Delphi source:** `FrmKasBank.pas` procedure `TFrKasBank.TampilHutPiut` (baris `FrKasBankHutPiut.Label2.Caption:='[ '+dm.QuCari.fieldbyname('NamaCustSupp').AsString+' ]'`)

**Query untuk NamaCustSupp:** `dm.QuCari` — query yang dipanggil dari `IsiTempHutPiut` menggunakan `vwHutPiut` yang JOIN ke `dbCustSupp` untuk mengambil `NamaCustSupp`.

---

### 13.3 Flow Awal: Load Data dari dbHutPiut ke dbTempHutPiut

Sebelum user bisa memilih piutang/hutang, sistem mengisi `dbTempHutPiut` dari view `vwHutPiut`:

```
Procedure IsiTempHutPiut(pDK, pKode, pNoBukti, pUrut, pValas, pKodeCustSupp, pPerkiraan: String)

Flow:
1. DELETE semua record di dbTempHutPiut untuk IDUser ini (StatusUID kosong)
2. INSERT INTO dbTempHutPiut SELECT dari vwHutPiut:
   - JOIN dua langkah:
     a. Sub-query X: SELECT NoFaktur, KodeCustSupp, Perkiraan
        FROM vwHutPiut
        WHERE KodeCustSupp = ? AND Perkiraan = ?
          AND NoBukti+NoMsk <> NoBukti_KasBank_SaatIni
        GROUP BY NoFaktur, KodeCustSupp, Perkiraan
        HAVING sum(Kredit-Debet) > 0  (untuk HT/UPT IDR)
           sum(KreditD-DebetD) > 0  (untuk HT/UPT valas)
           sum(Debet-Kredit) > 0    (untuk PT/UHT IDR)
           sum(DebetD-KreditD) > 0  (untuk PT/UHT valas)
     b. LEFT OUTER JOIN vwHutPiut Y ON Y.NoFaktur=X.NoFaktur
        WHERE Y.NoBukti+NoMsk <> NoBukti_KasBank_SaatIni
   - Insert fields: NoFaktur, NoRetur, TipeTrans, KodeCustSupp, NoBukti, NoMsk,
     Urut, Tanggal, JatuhTempo, Debet, Kredit, Valas, Kurs, DebetD, KreditD,
     KodeSales, Tipe, Perkiraan, Catatan, IDUser, TipeDK, NoInvoice, Valas_, Kurs_, noso, nospb, kodebrgcust

3. Data di dbTempHutPiut = daftar piutang/hutang yang BELUM lunas untuk customer ini
```

**Delphi source:** `FrmKasBank.pas` procedure `TFrKasBank.IsiTempHutPiut`

**Key detail:** Query menggunakan `vwHutPiut` (view), bukan langsung `dbHutPiut`. View ini menggabungkan data historis dan saldo berjalan.

---

### 13.4 Flow Pelunasan (StatusHutPiut = PT-, HT-, UPT-, UHT-)

Ini adalah kasus ketika user **membayar lunas** piutang atau hutang yang sudah ada:

```
Flow:
1. User isi header KasBank (BKK untuk pelunasan hutang/piutang — kas keluar)
2. CekLawanDiPosting → Kode = PT/HT/UPT/UHT → sub-form HutPiut muncul
3. Sub-form load data dari dbTempHutPiut (hasil IsiTempHutPiut)
   - Tampilkan di dxDBhutPiut grid: NoFaktur, NoRetur, Tanggal, JatuhTempo, Debet, Kredit, Saldo
   - User pilih baris yang mau dilunasi
4. User klik TambahBtn (btnTambahHutPiutClick / SpeedButton1Click):
   - Set Model='write', mTransaksi='pelunasan'
   - Ambil NoFaktur dari baris terpilih
   - Hitung sisa = Sisa.Value (saldo yang belum lunas)
   - Set Jumlah = min(sisa, JumlahYgDibayar(NoFaktur)) — auto-fill sisa
   - Enable Panel input (NoBukti, TglBukti, TglJatuhTempo, Jumlah, Valas, Kurs)
   - Jika valas beda: tampilkan JumlahD (converted amount) dan KursBayar
5. User isi/konfirmasi Jumlah (nilai pelunasan)
6. User klik BitBtn1Click (simpan):
   
   Validasi:
   - CekPelunasanMax(NoFaktur, Jumlah, JmlHut, SisaPiut)
     → query dbHutPiut: sum(Case when Tipe='HT'/'UPT' then Kredit-Debet
                                when Tipe='PT'/'UHT' then Debet-Kredit end)
     → Jika JmlPelunasan > JmlHut → tolak, tampilkan sisa
   
   Aksi:
   - SimpanData('I') → INSERT ke dbTempHutPiut via sp_TempHutPiut:
     * Choice = 'I'
     * NoBukti = NoBukti KasBank
     * NoFaktur = dari baris terpilih
     * TipeTrans = 'L' (Lunas)
     * KodeCustSupp = Label1.Caption
     * NoMsk = mUrut
     * Urut = 1
     * Tanggal = TglBukti.Date
     * JatuhTempo = TglJatuhTempo.Date
     * Debet/Kredit (tergantung StatusHutPiut):
       - PT+, HT-, UPT- → Debet=Jumlah, Kredit=0
       - PT-, HT+, UPT+ → Debet=0, Kredit=Jumlah
     * Valas, Kurs
     * Tipe = StatusHutPiut (misal 'PT-')
     * Perkiraan = PerkiraanHutPiut
     * Catatan
     * IDUser
     * DK = pDK
     * NoInvoice, Valas_, Kurs_
     * Jika valas beda: DebetD/KreditD (converted amount)
   
   - TampilDataHutPiut → refresh grid
   - Hitung Dibayar = CariJumlahPembayaranHutPiut(StatusHutPiut, Valas)
     → sum(Kredit) dari dbTempHutPiut (jika HT+/PT-/UHT-/UPT+)
     → sum(Debet) dari dbTempHutPiut (jika lainnya)
     → WHERE IDUser=? AND StatusUID IN ('N','I','U')
   
   - Loop: user bisa tambah baris pelunasan lain (ulang step 4-6)
   
7. Saat transaksi KasBank disimpan (SimpanDataHutPiut di FrmKasBank.pas):
   - DELETE dbHutPiut WHERE nobukti=:0 AND nomsk=:1
   - Untuk setiap record di QuHutPiutP (filtered TipeTrans='L' AND NoBukti=:0):
     - INSERT/UPDATE dbHutPiut (cek dulu apakah sudah ada dengan NoFaktur yang sama)
     - Copy semua field dari QuHutPiutP ke dbHutPiut
```

**Delphi source:** `FrmKasBankHutPiut.pas` procedure `TFrKasBankHutPiut.BitBtn1Click` (line 578) + `SimpanData` (line 226)

---

### 13.5 Flow Penambahan Hutang/Piutang Baru (StatusHutPiut = PT+, HT+, UPT+, UHT+)

Ini adalah kasus ketika user **mencatat hutang/piutang baru** (belum ada di dbHutPiut):

```
Flow:
1. User isi header KasBank (BKM untuk penambahan piutang — kas masuk)
2. CekLawanDiPosting → Kode = PT/HT/UPT/UHT → sub-form HutPiut muncul
3. User klik SpeedButton2Click (tambah baru):
   - Set Model='write', mTransaksi='penambahan'
   - Enable Panel input (NoBukti, TglBukti, TglJatuhTempo, Jumlah)
   - Set Jumlah = Sisa.Value (saldo dari dbTempHutPiut)
   - NoBukti.Enabled = true (user isi manual)
4. User isi:
   - NoBukti (no faktur baru)
   - Tanggal Bukti
   - Tanggal Jatuh Tempo
   - Jumlah (nilai hutang/piutang baru)
   - Valas, Kurs
   - Catatan
5. User klik BitBtn1Click (simpan):
   
   Validasi:
   - Jumlah <= Sisa (tidak boleh lebih dari sisa)
   - NoBukti tidak boleh kosong
   
   Aksi:
   - SimpanData('I') → INSERT ke dbTempHutPiut via sp_TempHutPiut:
     * Choice = 'I'
     * NoBukti = dari input user
     * NoFaktur = '' (kosong, karena belum ada faktur)
     * NoRetur = ''
     * TipeTrans = 'L' (Lunas)
     * KodeCustSupp = Label1.Caption
     * NoMsk = mUrut
     * Urut = 1
     * Tanggal, JatuhTempo
     * Debet/Kredit (tergantung StatusHutPiut):
       - PT+, HT-, UPT- → Debet diisi, Kredit=0
       - PT-, HT+, UPT+ → Debet=0, Kredit diisi
     * Valas, Kurs
     * Tipe = StatusHutPiut
     * Perkiraan = PerkiraanHutPiut
     * Catatan
     * IDUser
     * DK
     * NoInvoice, Valas_, Kurs_
     * DebetD/KreditD (jika valas beda)
   
6. ClearDetailPanel → reset form untuk input berikutnya
7. Set Jumlah = Sisa (siap input berikutnya)
8. Saat transaksi KasBank disimpan: SimpanDataHutPiut → promote ke dbHutPiut
```

**Delphi source:** `FrmKasBankHutPiut.pas` procedure `TFrKasBankHutPiut.SpeedButton2Click` (line 457)

---

### 13.6 Flow Delete Record di dbTempHutPiut

```
Flow:
1. User pilih baris di dxDBhutPiut grid
2. User klik HapusBtn (HapusBtnClick):
   - Cek: QuTempHutPiutStatusUID <> '' (harus ada StatusUID)
   - Konfirmasi: MessageBox "Anda yakin akan menghapus No. Faktur X?"
   - Jika YES → SimpanData('D')
   
SimpanData('D'):
   - Choice = 'D'
   - Parameters: NoFaktur, NoRetur, TipeTrans, KodeCustSupp, NoBukti, NoMsk, Urut
   - Exec sp_TempHutPiut → DELETE dari dbTempHutPiut
```

**Delphi source:** `FrmKasBankHutPiut.pas` procedure `TFrKasBankHutPiut.HapusBtnClick` (line 488)

---

### 13.7 Flow Auto-Pay All (SpeedButton4Click)

```
Flow:
1. User klik SpeedButton4 (bayar semua yang sudah dibayar)
2. Validasi: Sisa <> 0
3. Set FrKasBank.Jumlah = Dibayar (total yang sudah dibayar)
4. Call BitBtn1.Click dua kali:
   - Pertama: XLebihBayar=False → simpan normal
   - Kedua: XLebihBayar=True → simpan dengan flag lebih bayar
   - Ketiga: XLebihBayar=False → reset flag
5. Tutup sub-form (btnTutupGiro.Click)
6. Refresh KasBank (SpeedButton1.Click)
```

---

### 13.8 Flow Hitung Sisa Saldo (SpeedButton5Click)

```
Flow:
1. User klik SpeedButton5 (hitung sisa saldo)
2. Query dbTempHutPiut:
   - Jika Tipe='HT': SELECT SUM(Kredit-Debet) FROM dbTempHutPiut
     WHERE NoFaktur=? AND KodeCustSupp=? AND Perkiraan=? AND StatusUID<>'D'
     GROUP BY NoFaktur, Perkiraan, KodeCustSupp
     HAVING SUM(Kredit-Debet) > 0
   - Jika Tipe='PT': SELECT SUM(Debet-Kredit) FROM dbTempHutPiut
     WHERE NoFaktur=? AND KodeCustSupp=? AND Perkiraan=? (Lawan) AND StatusUID<>'D'
     GROUP BY NoFaktur, Perkiraan, KodeCustSupp
     HAVING SUM(Debet-Kredit) > 0
3. Set SisaSaldo = hasil query
```

---

### 13.9 Mapping StatusHutPiut → Debet/Kredit

| StatusHutPiut | Meaning | Debet | Kredit |
|--------------|---------|-------|--------|
| `PT+` | Penambahan Piutang | Jumlah | 0 |
| `PT-` | Pelunasan Piutang | 0 | Jumlah |
| `HT+` | Penambahan Hutang | 0 | Jumlah |
| `HT-` | Pelunasan Hutang | Jumlah | 0 |
| `UPT+` | Penambahan Uang Muka Piutang | Jumlah | 0 |
| `UPT-` | Pelunasan Uang Muka Piutang | 0 | Jumlah |
| `UHT+` | Penambahan Uang Muka Hutang | 0 | Jumlah |
| `UHT-` | Pelunasan Uang Muka Hutang | Jumlah | 0 |

**Delphi source:** `FrmKasBankHutPiut.pas` procedure `TFrKasBankHutPiut.SimpanData` (line 226, parameter 11-12)

---

### 13.10 CariJumlahPembayaranHutPiut (Running Total)

```
function CariJumlahPembayaranHutPiut(pStatusHutPiut, pValas: String): Real

Flow:
1. Jika pValas = 'IDR':
   - Jika pStatusHutPiut IN ('HT+','PT-','UHT-','UPT+') → SUM(Kredit)
   - Else → SUM(Debet)
2. Jika pValas <> 'IDR':
   - Jika pStatusHutPiut IN ('HT+','PT-','UHT-','UPT+') → SUM(KreditD)
   - Else → SUM(DebetD)
3. WHERE IDUser = ? AND StatusUID IN ('N','I','U')
4. Return result (0 jika kosong)
```

**Delphi source:** `FrmKasBank.pas` procedure `TFrKasBank.CariJumlahPembayaranHutPiut`

---

### 13.11 Promosi dbTempHutPiut → dbHutPiut

```
procedure SimpanDataHutPiut (dipanggil saat transaksi KasBank disimpan)

Flow:
1. Jika QuHutPiutP tidak kosong (ada record TipeTrans='L'):
   - DELETE dbHutPiut WHERE nobukti=:0 AND nomsk=:1 (bersihkan record lama)
   - Loop QuHutPiutP.First → .Eof:
     - Cek: SELECT * FROM dbHutPiut WHERE nobukti=:0 AND nomsk=:1 AND Urut=:2 AND Nofaktur=:3
     - Jika ada → EDIT dbHutPiut
     - Jika tidak → APPEND dbHutPiut
     - Copy semua field dari QuHutPiutP ke dbHutPiut:
       NoFaktur, NoRetur, TipeTrans, KodeCustSupp, NoBukti, NoMsk, Urut,
       Tanggal, JatuhTempo, Debet, Kredit, Valas, Kurs, DebetD, KreditD,
       KodeSales, Tipe, Perkiraan, Catatan
     - Post
     - Next
2. Unfilter QuHutPiutP
```

**Delphi source:** `FrmKasBank.pas` procedure `TFrKasBank.SimpanDataHutPiut`

---

**Tabel:** `dbTempHutPiut` (staging) → `dbHutPiut` (final)

**Fields dbTempHutPiut:** `NoFaktur`, `NoRetur`, `TipeTrans`, `KodeCustSupp`, `NoBukti`, `NoMsk`, `Urut`, `Tanggal`, `JatuhTempo`, `Debet`, `Kredit`, `Valas`, `Kurs`, `DebetD`, `KreditD`, `KodeSales`, `Tipe`, `Perkiraan`, `Catatan`, `IDUser`, `TipeDK`, `NoInvoice`, `Valas_`, `Kurs_`, `noso`, `nospb`, `kodebrgcust`

**Fields dbHutPiut:** sama seperti dbTempHutPiut (field yang sama dipromote)

**View:** `vwHutPiut` — sumber data untuk IsiTempHutPiut

---

## 14. Sub-Proses: Aktiva Tetap (Kode = AKV/AKM)

Sub-proses Aktiva Tetap menangani pembelian/penjualan aktiva tetap (mesin, kendaraan, bangunan, dll) dan penyusutannya.

**Trigger:** `Perkiraan-Lawan` terdaftar di `dbPostHutPiut` dengan **Kode = AKV** (Aktiva Tetap) atau **AKM** (Akumulasi Penyusutan).

**Sub-Form:** `FrmKasBankAktiva.pas` (396 lines)

### 14.1 Flow Tambah Aktiva Baru

```
Flow:
1. User isi header KasBank (SEMUA Mode: BKM/BKK/BBM/BBK — bukan hanya pembelian)
2. CekLawanDiPosting → Kode = AKV → sub-form Aktiva muncul
3. Isi field sub-form:
   - KodeAktiva (perkiraan aktiva)
   - NoUrut, NoUrut2 (sub-perkiraan bertingkat)
   - Devisi (departemen)
   - Keterangan (deskripsi aktiva)
   - Kuantum (quantity)
   - Susut (persen penyusutan)
   - TglPengakuan (tanggal pengakuan aktiva)
   - Bagian (kode bagian)
   - BiayaSusut, PersenSusut1
   - BiayaSusut2, PersenSusut2
   - BiayaSusut3, PersenSusut3
   - TipeAktiva (jenis aktiva)
   - StatusAktiva
   - AkumulasiPenyusutan
4. Klik Simpan (BitBtn1Click):
   
   a. Cek duplikat: `dxAktiva.Locate('Perkiraan;kodebag;Devisi', ...)`
   b. INSERT ke dbAktiva:
      - Devisi, Perkiraan, Keterangan
      - Quantity = Kuantum
      - Persen = Susut
      - Tanggal = TglPengakuan
      - Tipe = Copy(LM.Text,2,1)
      - kodebag = Bagian
      - Akumulasi = AkSusut
      - NoMuka = Perkiraan.Text
      - Nobelakang = Nourut
      - Nobelakang2 = NoUrut2
      - Biaya, PersenBiaya1/2/3
      - TipeAktiva, Status
      - NoAKtivaHd (jika isHeader > 0)
      - Kelompok (isHeader.ItemIndex)
      - XSusut
      - PerlakuanAktiva
   c. Post ke grid
```

### 14.2 Flow Koreksi Aktiva

```
Flow:
1. User klik tombol koreksi di sub-form Aktiva
2. Sub-form load data aktiva yang sudah ada
3. User ubah field (misal: quantity, persen penyusutan, biaya)
4. Klik Simpan → UPDATE dbAktiva (bukan INSERT)
```

**Delphi source:** `FrmKasBankAktiva.pas` procedure `TfrKasBankAktiva.BitBtn1Click` (line 171)

**Tabel:** `dbAktiva` + `dbAktivaDet`

**Fields dbAktiva:** `Devisi`, `Perkiraan`, `Keterangan`, `Quantity`, `Persen`, `Tanggal`, `Tipe`, `kodebag`, `Akumulasi`, `NoMuka`, `Nobelakang`, `Nobelakang2`, `Biaya`, `PersenBiaya1`, `Biaya2`, `PersenBiaya2`, `Biaya3`, `PersenBiaya3`, `Biaya4`, `PersenBiaya4`, `TipeAktiva`, `Status`, `NoAKtivaHd`, `Kelompok`, `XSusut`, `PerlakuanAktiva`

---

## 15. Cara Mendeteksi di Backend

Saat menerima request save, backend harus cek apakah transaksi ini perlu sub-proses:

```
function needsSubProcess(perkiraan: String, dk: String): Boolean
    row = DB.query("SELECT Kode FROM dbPostHutPiut WHERE Perkiraan = ?", perkiraan)
    return row is not empty AND row.Kode in ['DP', 'PT', 'HT', 'UPT', 'UHT', 'AKV', 'AKM']
```

Jika `needsSubProcess = true`:
1. Simpan header ke `dbTransaksi` (via SP atau direct SQL)
2. Cek Kode → jalankan sub-proses sesuai kode
3. Semua dalam 1 transaksi atomic (`BEGIN TRANSACTION` → commit/rollback)

Jika `needsSubProcess = false`:
1. Simpan header ke `dbTransaksi` (via SP atau direct SQL)
2. Selesai. Tidak ada sub-proses.

---

## 16. Test Scenarios (Gherkin)

### Skenario 1: Buat transaksi BKM baru (kas masuk)
```gherkin
Given saya di Transaksi Kas Bank
When saya pilih jenis "BKM", tanggal "2026-06-26"
And tujuan "PT Maju Jaya"
And saya tambah detail: Valas "IDR", Jumlah "Rp 1.500.000", Lawan "Piutang Dagang"
And klik Simpan
Then transaksi tersimpan dengan nomor "0001/BKM-ABC/202606"
And posting: Debit Kas (1-1001) Rp 1.500.000
             Credit Piutang Dagang (1-1201) Rp 1.500.000
```

### Skenario 4: Bayar utang supplier (BKK + sub-ledger)
```gherkin
Given saya pilih BKK, supplier "PT Maju Jaya" punya utang Rp 5.000.000
When saya pilih Lawan "Utang Dagang" (2-1001)
Then sistem tampilkan daftar utang terbuka supplier
When saya klik "Pelunasan"
Then pilih invoice utang yang akan dilunasi
And klik Tutup → Simpan
Then jurnal terbentuk: Debit Utang Dagang / Credit Kas
And historis kartu utang supplier bertambah 1 record pelunasan
```

### Skenario 11: Buka Giro Supplier (H+)
```gherkin
Given saya input BKM dengan THPC = "[H]Hutang Giro"
When saya isi detail giro: Bank BCA, No Giro "BG-001/2026", Tgl Giro "2026-07-04", Nilai "Rp 10.000.000"
And klik Simpan
Then sistem set StatusGiro = 'H+'
And INSERT ke dbGiro: Tipe='HT', BuktiBuka=NoBukti, TglBuka=TANGGAL, Kredit=10.000.000, Debet=0
And sub-form GiroDialog menampilkan caption "Buka Giro"
```

### Skenario 15: Buka Deposito Baru (DP+)
```gherkin
Given saya input BBM dengan jenis deposito
When saya isi form DepositoDialog: Bank, NoDeposito, TglJatuhTempo, Nilai
And klik Simpan
Then sistem set xStatus = 'DP+'
And INSERT ke dbDeposito: Tipe='PT', BuktiBuka=NoBukti, TglBuka=TANGGAL, Debet=Nilai, Kredit=0
```

---

## 17. Field Mapping — Header

| Field UI (Delphi) | Tipe Delphi | DB Field (dbTransaksi) | Keterangan |
|------------------|-------------|----------------------|------------|
| `NOBUKTI` | TEdit | `NoBukti` (varchar) | Auto-generated: urut + separator + kode + bulan + tahun |
| `TANGGAL` | TDateEdit | `Tanggal` (datetime) | Tanggal transaksi |
| `Terima` | TEdit | `Note` (varchar) | Catatan singkat tujuan transaksi ("tulisan kepada") |
| `Devisi` | TEdit | `Devisi` (varchar) | Unit bisnis |
| `NoUrut` | TEdit | `Urut` (int) | Nomor urut per jenis transaksi |
| `KodeBag` | TEdit | `KodeBag` (varchar) | **Nomor SPK** — diisi via browsing `dbspk.nobukti` (KodeBrows=91117), bukan dari `dbBagian` |
|| `THPC` | TComboBox | `TPHC` (varchar) | Tipe pembayaran — 1 karakter: `C` (Cash), `T` (Transfer), `H` (Hutang Giro), `P` (Piutang Giro) |
| `NoBon` | TEdit | `NoBon` (varchar) | Nomor bon/referensi eksternal |
| `Lampiran` | Number | `Lampiran` (int) | Jumlah dokumen lampiran (hardcoded 0 di header) |
| `TglInput` | DateTime | `TglInput` (datetime) | Timestamp saat user simpan transaksi |
| `UserID` | String | `UserID` (varchar) | Kode user yang input transaksi |
| `NoReg` | String | `NoReg` (varchar) | Nomor registrasi internal |

---

## 18. Field Mapping — Detail Sub-Grid

| Field UI (Delphi) | Tipe Delphi | DB Field (dbTransaksi) | Keterangan |
|------------------|-------------|----------------------|------------|
| `Valas` | TEdit | `Valas` (varchar) | Kode mata uang (IDR/USD/SGD); kosong = IDR |
| `Kurs` | TPBNumEdit | `Kurs` (decimal) | Otomatis dari master valas; default 1 untuk IDR |
| `Jumlah` | TPBNumEdit | `Debet`/`Kredit` (decimal) | **Selalu positif** — penentuan D/K pakai `TipeDK`, bukan sign |
| `Sumber` | TEdit | `Sumber` (varchar) | Sumber dana |
| `Keterangan` | TEdit | `Keterangan` (text) | Tujuan penggunaan dana |
| `NoSPK` | TEdit | `KodeBag` (varchar) | Tanda minus jika tidak ada |
| `NamaSPK` | TEdit | `NamaSPK` (varchar) | Auto dari browsing SPK |
| `Lawan` | TComboBox | `Lawan` (varchar) | Akun debit/credit partner. Jika terdaftar di `dbPostHutPiut` → sub-form muncul otomatis |
| `Perkiraan` | TComboBox | `Perkiraan` (varchar) | Akun Kas/Bank (sisi utama transaksi) |
| `Lampiran` | Number | `Lampiran` (int) | Jumlah lampiran per baris (hardcoded 0) |
| `Flag` | String | `Flag` (varchar) | Status flag baris (A=aktif, D=soft-delete, R=revisi) |
| `KeyUrut` | String | Composite | `NoBukti + Tgl + Urut` — identifikasi unik per baris |

---

## 19. Event-Handler Mapping (Delphi → Universal)

| Event Handler | Delphi Method | Fungsi | Universal Equivalent |
|--------------|---------------|--------|---------------------|
| `SimpanClick` | `TFrKasBank.SimpanData` | Simpan transaksi ke dbTransaksi via SP | `save()` method |
| `THPCChange` | `TFrKasBank.THPCChange` | Aktifkan/nonaktifkan sub-modul giro/aktiva | `resolveWithThpc()` method |
| `CekLawanDiPosting` | `TFrKasBank.CekLawanDiPosting` | **Trigger sub-form otomatis** berdasarkan Perkiraan-Lawan | `SubTransactionResolver::resolve()` |
| `LawanKeyUp` | `TFrKasBank.LawanKeyUp` | Auto-complete akun lawan | `searchAccount()` method |
| `PerkiraanKeyUp` | `TFrKasBank.PerkiraanKeyUp` | Auto-complete perkiraan dari COA | `searchCOA()` method |
| `TerimaExit` | `TFrKasBank.TerimaExit` | Validasi Note tidak kosong | `validateSave()` method |
| `DevisiExit` | `TFrKasBank.DevisiExit` | Validasi Devisi tidak kosong | `validateSave()` method |

---

## 20. Prasyarat Setup (Wajib Sebelum Transaksi)

| Data | Modul | Wajib? | Keterangan |
|------|-------|--------|------------|
| COA (Perkiraan) | Master Accounting → Pergiroan | Ya | Semua akun kas, bank, lawan harus ada |
| Posting Perkiraan (dbPostHutPiut) | Setting → Posting → Post Perkiraan | Ya, untuk sub-ledger | Akun lawan harus terdaftar + centang "Kas dan Bank?" |
| Master Devisi | Master Accounting | Ya | Unit bisnis tujuan transaksi |
| Master Valas | Master Lain → Valas | Ya, kalau valas | Kurs otomatis dari sini |
| Master Supplier | Master → Supplier | Ya, untuk bayar hutang | Sub-detail akun supplier harus terisi |
| Master Customer | Master → Customer | Ya, untuk terima piutang | Sub-detail akun customer harus terisi |
| Saldo Awal | Master Accounting → Saldo Awal | Ya | Akun kas/bank harus punya saldo awal |

---

## 21. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Kurs valas belum di-setup untuk tanggal transaksi | Warning: "Kurs belum di-set, gunakan kurs terakhir?" |
| Jumlah = 0 | Tolak + pesan "Nominal tidak boleh 0" |
| Lawan = akun Kas yang sama (self-posting) | Tolak + pesan "Akun lawan harus berbeda" |
| Hapus transaksi yang sudah diotorisasi penuh | Tolak, harus Batal Otorisasi dulu |
| Sub-ledger kosong (tidak ada supplier/customer cocok) | Tampilkan "Tidak ditemukan data utang/piutang" |
| Tanggal transaksi beda periode | Tolak + minta koreksi tanggal |
| Transaksi multi-detail dengan total tidak balance | Tolak sebelum simpan |

---

## 22. Database Tables Affected

| Aksi | Tabel Affected | Posting Debit/Credit |
|------|---------------|---------------------|
| Tambah BKM | `dbTrans`, `dbTransaksi` | Debit Kas / Credit Lawan (via SP) |
| Tambah BKK | `dbTrans`, `dbTransaksi` | Debit Lawan / Credit Kas (via SP) |
| Pelunasan utang | `dbTempHutPiut`, `dbHutPiut` | Update saldo utang supplier |
| Pelunasan piutang | `dbTempHutPiut`, `dbHutPiut` | Update saldo piutang customer |
| Giro buka/cair | `dbGiro` | INSERT/UPDATE StatusGiro |
| Deposito buka/cair | `dbDeposito` | INSERT/UPDATE StatusGiro |
| Otorisasi | `dbTrans` | Update IsOtorisasi1-5 (via SP) |

---

## 23. Sub-Transaction Resolver Test Coverage

| Test | Kode | Trigger | StatusGiro |
|------|------|---------|------------|
| `test_resolve_returns_correct_trigger_for_each_kode` | DP | giro | — |
| | PT | hutpiut | — |
| | HT | hutpiut | — |
| | UPT | hutpiut | — |
| | UHT | hutpiut | — |
| | AKV | aktiva | — |
| | AKM | aktiva | — |
| `test_resolve_returns_no_match_for_unmapped_perkiraan` | N/A | null | — |
| `test_resolveWithThpc_calculates_status_giro_correctly` | P+BKM → P+ | P+ | — |
| | P+BKK → P- | P- | — |
| | P+BBM → P- | P- | — |
| | H+BKM → H+ | H+ | — |
| | H+BKK → H- | H- | — |

---

## 24. Version Log

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
|| 1.0 | 2026-07-07 | Initial — merged V1 kesesuaian + V3 specs ||
|| 1.1 | 2026-07-11 | Pure technical guide — framework-agnostic ||
|| 1.2 | 2026-07-11 | Removed invalid tables (dbJurnalHeader, dbJurnalDetail, dbKartuPiutang, dbKartuUtang, dbMasterBukti) ||
|| 1.3 | 2026-07-11 | Added Section 10: Jurnal Biasa vs Jurnal dengan Sub-Proses — distinction yang hilang ||
|| 1.4 | 2026-07-11 | Split sub-processes into separate sections: Giro (11), Deposito (12), HutPiut (13), Aktiva (14) ||
|| 1.5 | 2026-07-11 | Expanded Section 13 HutPiut — added 10 subsections: IsiTempHutPiut (load from vwHutPiut), Pelunasan (13.2), Penambahan Baru (13.3), Delete (13.4), Auto-Pay All (13.5), Hitung Sisa (13.6), StatusHutPiut→Debet/Kredit mapping (13.7), CariJumlahPembayaranHutPiut (13.8), SimpanDataHutPiut promotion (13.9), TampilHutPiut open sub-form (13.10) — semua verified ke PWT source ||
|| 1.6 | 2026-07-11 | Section 13.10 expanded: TampilHutPiut parameter lengkap + FrBrows KodeBrows=1014 + filter NoKira/NoKira2 + DK routing (Customer vs Supplier) ||
|| 1.7 | 2026-07-11 | Added Section 13.11: Cara menampilkan Nama Customer/Supplier di sub-form — Label1 (KodeCustSupp), Label2 (NamaCustSupp format "[...]"), Label3 (NoBukti) — query dm.QuCari dari vwHutPiut JOIN dbCustSupp ||
|| 1.8 | 2026-07-11 | Added Section 13.12: Universal Browser Pattern (FrBrows) — referensi seluruh PWT, 9 KodeBrows CS, filter NoKira/NoKira2, contoh implementasi KasBank vs Memorial vs Pembelian vs Penjualan ||
|| 1.9 | 2026-07-11 | Removed Section 13.12 — scope V4 hanya KasBank, bukan seluruh PWT ||
|| 1.10 | 2026-07-11 | Renumbered Section 13 subsections — TampilHutPiut moved to 13.1 (entry point), Cara Display Name to 13.2, load data to 13.3, pelunasan to 13.4, penambahan to 13.5, delete to 13.6, auto-pay to 13.7, hitung sisa to 13.8, mapping to 13.9, running total to 13.10, promosi to 13.11 ||
|| 1.11 | 2026-07-11 | Fixed Section 11 Giro: added IDR check (KodeVls='IDR' → Debet/Kredit/Jumlah=0), added Tipe='PT'/'HT' field, added Jumlah/JumlahRp fields, added KeteranganCair field for P-/H- ||
|| 1.12 | 2026-07-11 | Fixed Section 12 Deposito: added IDR check (KodeVls='IDR' → Debet/Kredit/Jumlah=0), added Tipe='PT' field, added Jumlah/JumlahRp fields, added KeteranganCair field for DP-, added validation section ||
|| 1.13 | 2026-07-11 | Fixed Section 4 StatusGiro: clarified THPC.ItemIndex=2 (Hutang Giro) does NOT support Mode='BBM' — only BKK valid; fixed universal logic to use explicit mode check instead of catch-all else ||
|| 1.14 | 2026-07-11 | Fixed Section 17 Field Mapping: corrected THPC description — hanya 1 karakter (C/T/H/P), bukan HT/PT/UHT/UHT ||
|| 1.15 | 2026-07-11 | Fixed Section 3 THPC: added precise position info — Panel1 Top=32, Left=86 (di bawah Mode Top=4, di atas Tanggal Top=38) ||
|| 1.16 | 2026-07-11 | Fixed Section 14.1 Aktiva: removed incorrect "BKM/BBM — pembelian aktiva" constraint — Aktiva dipanggil via PerkiraanExit/LawanExit, valid untuk SEMUA Mode (BKM/BKK/BBM/BBK) ||
|| 1.17 | 2026-07-11 | Added Section 6.5: Sub-Transaction Fields — cara pengisian CustSuppP, CustSuppL, KodeP, KodeL, NoAktivaP, NoAktivaL, StatusAktivaP, StatusAktivaL, StatusGiro per sub-transaksi (Giro/HutPiut/Aktiva) + SP parameter mapping (Params[19-31]) ||
|| 1.18 | 2026-07-11 | Added Section 6.6: Field dbHutPiut — cara pengisian TipeTrans, NoBukti, NoMsk, Urut, Tipe, Perkiraan — semua otomatis dari vwHutPiut via IsiTempHutPiut, tidak ada field yang diisi manual oleh user ||
|| 1.19 | 2026-07-11 | Added Section 0: Sub-transaksi BUKAN tab/panel — melainkan modal popup trigger otomatis via PerkiraanExit/LawanExit → CekLawanDiPosting → dbPostHutPiut lookup ||
