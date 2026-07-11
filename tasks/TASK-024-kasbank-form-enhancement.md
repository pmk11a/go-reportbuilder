<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-024: KasBank Form Enhancement — Penomoran DBNOMOR, Filter Akun by Tipe, Multi-Currency, Sub-form Settlement/Giro/Aktiva

## Business Problem

Form KasBank di Go saat ini terlalu sederhana dibanding dokumentasi manual bok dan form PHP trade-exchange. Ada **3 masalah utama**:

1. **Format Penomoran Tidak Sesuai** — Go menghasilkan `BKK/202607/0001` tapi format seharusnya membaca konfigurasi `DBNOMOR` (NOPST, THPNU) untuk menyesuaikan dengan format trade-exchange seperti `01303/LPB/PWT/012022`.

2. **List Akun Kas/Bank Tidak Sensitif Tipe** — `useLookupPerkiraan` selalu pakai `Kelompok IN ("1", "2")` tanpa membedakan BKM/BKK (Kas+Bank) vs BBM/BBK (Bank saja).

3. **Form Terlalu Sederhana** — Hilang field-header (No SPK, Sumber, Jumlah Giro, THPC, Lampiran, Aliases, Divisi, No Bon), tidak ada multi-currency di detail grid (Valas, Kurs, Jumlah $), dan tidak ada sub-form Pelunasan/Giro/Aktiva yang trigger berdasarkan kondisi.

## Priority: High

## Status
📋 **TODO**

## Architectural Decision: Reuse Shared Filter Components

Saat eksplorasi kode, ditemukan **shared filter components sudah ada tapi orphaned**:

| Component | File | Status |
|-----------|------|--------|
| `KasBankSelect` | `frontend/src/shared/components/shared/filters/KasBankSelect.tsx` | 🟡 Orphan — belum dipakai di domain apapun |
| `PerkiraanSelect` | `frontend/src/shared/components/shared/filters/PerkiraanSelect.tsx` | 🟡 Orphan |
| `CustomerPicker` | `frontend/src/shared/components/shared/filters/CustomerPicker.tsx` | 🟡 Orphan |
| `sharedFilterService` | `frontend/src/shared/services/sharedFilterService.ts` | 🟡 Orphan |
| `IFilterService` (BE) | `backend/internal/features/filters/service.go` | ✅ Backend ready |

**Dampak pada Task Ini:**
- `useLookupPerkiraan` di `useKasBank.ts` adalah **duplikat** dari `sharedFilterService.getPerkiraan`. Akan di-migrate.
- `KasBankSelect` sudah support `type` param tapi **single-value only**. Akan di-extend untuk support tipe combination (BKM/BKK → Kas+Bank, BBM/BBK → Bank).
- Lookup Lawan di detail grid akan pakai `PerkiraanSelect` (dengan filter `posthutpiut` jika diperlukan).
- Lookup Akun Kas/Bank di header akan pakai `KasBankSelect` yang sudah di-extend.

**Keuntungan keputusan ini:**
1. **DRY** — Tidak ada duplikasi service/hook antar domain
2. **Konsistensi UI** — Semua dropdown pakai `SearchableSelect` yang sama
3. **Onboarding task ini sekaligus mengaktifkan shared components** untuk dipake domain lain di masa depan

## Acceptance Criteria
### Shared Filter Components (Phase 0)
- [ ] `KasBankSelect` menerima prop `tipeTrans` dan filter Kas+Bank sesuai mapping BKM/BKK → Kas+Bank, BBM/BBK → Bank
- [ ] `PerkiraanSelect` dipakai di detail grid untuk lookup Lawan
- [ ] `useLookupPerkiraan` di `useKasBank.ts` delegate ke `sharedFilterService.getPerkiraan`
- [ ] Tidak ada duplikasi service/hook antara domain accounting dan shared filters

### Core Features
- [ ] Nomor bukti format: `[TIPE]{sep}[YYYYMM]{sep}[SEQ]{sep}[NOPST]` — contoh: `BKK/202607/0001/PWT`
- [ ] Field header baru (No SPK, Sumber, Jumlah Giro, THPC, Lampiran, No Bon, Aliases, Divisi) tersimpan ke DB
- [ ] Detail grid menampilkan kolom Valas, Kurs, Jumlah $, Jumlah Rp, Nilai Giro
- [ ] Tombol "Pelunasan" muncul saat Lawan = Piutang/Hutang Dagang
- [ ] Tombol "Giro" muncul saat THPC = "H" atau "P"
- [ ] Tombol "Aktiva" muncul saat Lawan = Akun Aktiva Tetap
- [ ] All code passes quality gates (`go build ./...`, `npm run type-check`)
- [ ] Unit tests 80%+ coverage on repository + service
- [ ] E2E Playwright test for full flow

## User Stories

**Sebagai** staff accounting  
**Saya ingin** form KasBank yang lengkap sesuai manual bok (Valas, Kurs, Sumber, Giro, Pelunasan)  
**Agar bisa** membuat bukti kas/bank yang akurat untuk berbagai skenario (multi-currency, pelunasan piutang, pembayaran giro, pembelian aktiva)

**Sebagai** staff accounting  
**Saya ingin** nomor bukti yang konsisten dengan format trade-exchange  
**Agar** tidak ada kebingungan saat verifikasi dengan sistem lain

## Implementation Plan

### Phase 0: Foundation — Extend Shared Filter Components (4h)

**Tujuan:** Aktifkan shared components yang sudah orphan, supaya semua phase berikutnya reuse.

#### 0.1 Backend: Extend `IFilterRepository.GetKelompokKas` untuk Support Multi-Type

File: `backend/internal/features/filters/repository.go`

Ubah signature dari single-type ke multiple-types:

```go
// BEFORE
GetKelompokKas(accountType string, search string) ([]models.SDbPerkiraan, error)

// AFTER
GetKelompokKas(accountTypes []string, search string) ([]models.SDbPerkiraan, error)
```

Implementasi: gunakan `IN (?, ?, ...)` dengan SQL Server-compatible parameter list.

#### 0.2 Backend: Define Mapping Rule Tipe → DBPOSTHUTPIUT.Kode

Tambah helper di `backend/internal/features/filters/service.go`:

```go
// GetAccountTypesForKasBankTipe maps BKM/BKK/BBM/BBK to DBPOSTHUTPIUT.Kode
// BKM/BKK = Kas + Bank (Kode = "KAS" or "BANK")
// BBM/BBK = Bank only (Kode = "BANK")
func GetAccountTypesForKasBankTipe(tipeTrans string) []string {
    switch tipeTrans {
    case "BKM", "BKK":
        return []string{"KAS", "BANK"}
    case "BBM", "BBK":
        return []string{"BANK"}
    default:
        return []string{"KAS"}
    }
}
```

#### 0.3 Frontend: Extend `KasBankSelect` untuk Support Tipe KasBank

File: `frontend/src/shared/components/shared/filters/KasBankSelect.tsx`

Tambah prop `tipeTrans?: string` (BKM/BKK/BBM/BBK) yang otomatis map ke array types:

```tsx
const TYPE_MAP = {
  'KAS': ['KAS'],
  'BANK': ['BANK'],
  'BKM': ['KAS', 'BANK'],
  'BKK': ['KAS', 'BANK'],
  'BBM': ['BANK'],
  'BBK': ['BANK'],
};

interface Props {
  value?: string;
  onChange: (value: string) => void;
  type?: string;          // existing — single type
  tipeTrans?: string;     // NEW — kasbank-specific mapping
  placeholder?: string;
}
```

#### 0.4 Frontend: Update `sharedFilterService.getKelompokKas`

File: `frontend/src/shared/services/sharedFilterService.ts`

```ts
async getKelompokKas(type: string = 'KAS', query: string = ''): Promise<PerkiraanData[]>
async getKelompokKasByTipe(tipeTrans: string, query: string = ''): Promise<PerkiraanData[]> {
  // Sends multiple types as comma-separated, e.g. ?types=KAS,BANK
  const result = await getKelompokKasFn({ data: { types: TYPE_MAP[tipeTrans].join(','), query } })
}
```

#### 0.5 Frontend: Migrate `useLookupPerkiraan` ke `sharedFilterService`

File: `frontend/src/domains/accounting/hooks/useKasBank.ts`

Hapus `useLookupPerkiraan` dari hook kasbank-specific. Ganti dengan wrapper:

```ts
// DELEGATE ke sharedFilterService
export function useLookupPerkiraan(q: string, options?: { posthutpiut?: string; without?: string }) {
  return useQuery({
    queryKey: ['shared', 'perkiraan', q, options],
    queryFn: () => sharedFilterService.getPerkiraan(q, options?.without, options?.posthutpiut),
    enabled: q.length >= 2,
  });
}
```

#### 0.6 Verification Phase 0

- [ ] `go build ./...` exits 0
- [ ] `npm run type-check` exits 0
- [ ] Backend test untuk `GetKelompokKas(["KAS","BANK"], "")` return Kas+Bank; `GetKelompokKas(["BANK"], "")` return Bank only
- [ ] Frontend manual test: Buka KasBankSelect dengan tipeTrans="BKM" → tampil Kas+Bank

---

### Problem Statement

Form KasBank di Go saat ini terlalu sederhana dibanding dokumentasi manual bok dan form PHP trade-exchange. Ada **3 masalah utama**:

### Masalah 1: Format Penomoran Tidak Sesuai
Form Go menghasilkan `BKK/202607/0001` (format internal), tapi format yang benar harus mengikuti konfigurasi penomoran dari database `DBNOMOR` yang dibaca dari menu Penomoran di trade-exchange.

**Format trade-exchange (PHP):**
```
01303/LPB/PWT/012022
```
Struktur: `[NoUrut]/[KodeTransaksi]/[KodeDokumen]/[Tahun]`

**Format Go saat ini:**
```
BKK/202607/0001
```
Struktur: `[Tipe]/[YYYYMM]/[SEQ]`

Masalahnya: Go tidak membaca konfigurasi penomoran dari `DBNOMOR` yang benar. Harus menggunakan format yang konsisten dengan trade-exchange.

### Masalah 2: List Akun Kas/Bank Tidak Sesuai Tipe
Saat ini `useLookupPerkiraan(search, true)` selalu memfilter `Kelompok IN ("1", "2")` — tapi seharusnya:
- **BKM/BBM** (Masuk): dropdown hanya menampilkan akun Kas/Bank sisi **Debet** (Kelompok = "1" = Aktiva Arus Lancar, sub-kelompok Kas/Bank)
- **BKK/BBK** (Keluar): dropdown hanya menampilkan akun Kas/Bank sisi **Kredit** (Kelompok = "1", sub-kelompok Kas/Bank)
- Selain itu, ada juga kebutuhan filter berdasarkan **jenis akun** (Kas kecil, Kas besar, Bank)

### Masalah 3: Form Terlalu Sederhana
Banding dengan form PHP trade-exchange yang memiliki:
- Header: Valas, Kurs, Jumlah, Sumber, Jumlah Giro, Keterangan, No SPK
- Detail Grid: Perkiraan, Lawan, Keterangan, T (Debet/Kredit), Valas, Kurs, Jumlah $, Jumlah Rp, Nilai Giro
- Sub-form: Pelunasan, Giro, Aktiva (berdasarkan kondisi)

---

## Solution Overview

### Bagian A: Perbaiki Penomoran (Database-driven)

#### A1. Pahami Struktur DBNOMOR

Dari kode existing di `nomor.go`:
- `DBNOMOR` tabel: single-row configuration
- Kolom: `NOBKM`, `NOBKK`, `NOBBM`, `NOBBK` (counter per tipe)
- Kolom: `PEMISAH` (integer: 0=:, 1:-, 2:/, 3=space)
- Kolom: `THPNU` (tahun periode)
- Kolom: `KODEBIK` (kode bagian/unit)
- Kolom: `NOPST` (nomor postfix/kode dokumen)

**Format yang benar:**
```
[Tipe][Separator][Tahun][Separator][NoUrut][Separator][Postfix]
```
Contoh: `BKK/202607/0001/PWT`

#### A2. Update GenerateNoBukti

File: `backend/internal/features/accounting/kasbank/nomor.go`

Perubahan:
1. Baca semua field DBNOMOR yang relevan: `PEMISAH`, `THPNU`, `NOPST`
2. Gunakan `THPNU` sebagai tahun (bukan `time.Now().Year()`)
3. Append postfix `NOPST` ke format nomor
4. Format output: `[TIPE]{sep}[YYYYMM]{sep}[SEQ]{sep}[NOPST]`
5. Contoh: `BKK/202607/0001/PWT`

```go
// OLD:
return fmt.Sprintf("%s%s%s%s%04d", tipe, "-", yearMonth, sep, nextSeq)

// NEW:
// Baca NOPST dari DBNOMOR
var nopst *string
sql := `SELECT [NOPST] FROM DBNOMOR WITH (UPDLOCK, HOLDLOCK)`
tx.Raw(sql).Scan(&nopst)

suffix := ""
if nopst != nil && *nopst != "" {
    suffix = fmt.Sprintf("%s%s", sep, *nopst)
}

return fmt.Sprintf("%s%s%s%s%04d%s", tipe, sep, yearMonth, sep, nextSeq, suffix)
```

#### A3. Update Repository Transaction

File: `backend/internal/features/accounting/kasbank/repository.go`

`GenerateNoBukti` di repository juga perlu baca `NOPST` dan `THPNU` bersama-sama dalam satu transaction untuk konsistensi.

---

### Bagian B: Perbaiki Filter Akun Kas/Bank

#### B1. Tambah Parameter Tipe ke LookupPerkiraan

File: `backend/internal/features/accounting/kasbank/dto.go`

Tambahkan field `TipeTrans` ke `SLookupPerkiraanQuery`:

```go
type SLookupPerkiraanQuery struct {
    Q             string `form:"q" json:"q"`
    KelompokKas   bool   `form:"kelompokKas" json:"kelompokKas"`
    TipeTrans     string `form:"tipeTrans" json:"tipeTrans"`  // NEW: BKM/BKK/BBM/BBK
    Limit         int    `form:"limit" json:"limit"`
}
```

#### B2. Implementasi Filter Berdasarkan Tipe

File: `backend/internal/features/accounting/kasbank/repository.go`

Logika filter:
- **BKM** (Bukti Kas Masuk): Akun Kas/Bank di **Debet** → Kelompok="1", SubKelompok IN ("1.1", "1.2") — Kas & Bank
- **BKK** (Bukti Kas Keluar): Akun Kas/Bank di **Kredit** → Kelompok="1", SubKelompok IN ("1.1", "1.2") — Kas & Bank
- **BBM** (Bukti Bank Masuk): Akun Bank saja → Kelompok="1", SubKelompok="1.2"
- **BBK** (Bukti Bank Keluar): Akun Bank saja → Kelompok="1", SubKelompok="1.2"

```go
func (r *SKasBankRepository) LookupPerkiraan(ctx context.Context, query string, kelompokKas bool, tipeTrans string, limit int) ([]SDbPerkiraan, error) {
    // ... existing code ...
    
    if kelompokKas || tipeTrans != "" {
        // Filter berdasarkan Kelompok dan SubKelompok
        switch tipeTrans {
        case "BKM", "BKK":
            // Kas + Bank
            whereSQL += " AND Kelompok = ? AND SubKelompok IN (?, ?)"
            args = append(args, "1", "1.1", "1.2")
        case "BBM", "BBK":
            // Bank saja
            whereSQL += " AND Kelompok = ? AND SubKelompok = ?"
            args = append(args, "1", "1.2")
        }
    }
    // ...
}
```

#### B3. Update Frontend Hook

File: `frontend/src/domains/accounting/hooks/useKasBank.ts`

```typescript
export function useLookupPerkiraan(q: string, kelompokKas: boolean = false, tipeTrans?: string) {
  return useQuery({
    queryKey: ['kasbank', 'perkiraan', q, kelompokKas, tipeTrans] as const,
    queryFn: () => kasbankService.lookupPerkiraan(q, kelompokKas, tipeTrans),
    enabled: q.length >= 2,
  });
}
```

File: `frontend/src/domains/accounting/services/kasbankService.ts`

```typescript
lookupPerkiraan = (q: string, kelompokKas?: boolean, tipeTrans?: string) => 
  get<ILookupPerkiraanResponse>('/api/accounting/kasbank/lookup-perkiraan', {
    params: { q, kelompokKas, tipeTrans },
  });
```

File: `frontend/src/domains/accounting/components/accounting/kasbank/KasBankFormDialog.tsx`

```tsx
// Saat tipe berubah, update filter lookup
const { data: perkiraanData } = useLookupPerkiraan(
  perkiraanSearch, 
  true, 
  selectedTipe  // Pass tipe ke filter
);
```

---

### Bagian C: Tambah Field Header yang Hilang

#### C1. Backend Entity & DTO

File: `backend/internal/features/accounting/kasbank/entity.go`

Tambahkan field ke `SKasBankHeader` dan request DTO:

```go
type SDbTrans struct {
    // ... existing fields ...
    NoSPK         string  `json:"noSPK" gorm:"column:NoSPK;size:50"`        // NEW
    Sumber        string  `json:"sumber" gorm:"column:Sumber;size:20"`       // NEW: [C]Cash, dll
    JumlahGiro    float64 `json:"jumlahGiro" gorm:"column:JumlahGiro"`       // NEW
    THPC          string  `json:"tphc" gorm:"column:THPC;size:1"`            // NEW: C/T/H/P
    Lampiran      string  `json:"lampiran" gorm:"column:Lampiran;size:255"`  // NEW
    NoBon         string  `json:"noBon" gorm:"column:NoBon;size:50"`         // NEW
    Aliases       string  `json:"aliases" gorm:"column:Aliases;size:255"`    // NEW: Tujuan
    Divisi        string  `json:"divisi" gorm:"column:Divisi;size:50"`       // NEW
}
```

#### C2. Backend Request DTO

File: `backend/internal/features/accounting/kasbank/dto.go`

```go
type SCreateKasBankRequest struct {
    Tanggal     string  `json:"tanggal" binding:"required"`
    TipeTransHd string  `json:"tipeTransHd" binding:"required"`
    PerkiraanHd string  `json:"perkiraanHd" binding:"required"`
    Note        string  `json:"note"`
    NoSPK       string  `json:"noSPK"`
    Sumber      string  `json:"sumber"`
    JumlahGiro  float64 `json:"jumlahGiro"`
    THPC        string  `json:"tphc"`
    Lampiran    string  `json:"lampiran"`
    NoBon       string  `json:"noBon"`
    Aliases     string  `json:"aliases"`
    Divisi      string  `json:"divisi"`
    Details     []SKasBankDetailCreate `json:"details" binding:"required,min=1"`
}
```

#### C3. Frontend Form Update

File: `frontend/src/domains/accounting/components/accounting/kasbank/KasBankFormDialog.tsx`

Tambahkan field ke form schema dan UI:

```tsx
const formSchema = z.object({
    // ... existing fields ...
    noSPK: z.string().optional(),
    sumber: z.string().default('[C]Cash'),
    jumlahGiro: z.number().default(0),
    tphc: z.string().optional(),
    lampiran: z.string().optional(),
    noBon: z.string().optional(),
    aliases: z.string().optional(),
    divisi: z.string().optional(),
});
```

UI additions (2 rows baru di header form):
- Row 1: Valas (dropdown), Kurs (auto), Jumlah (auto-calculated)
- Row 2: Sumber (dropdown), Jumlah Giro (input), Keterangan (input)
- Row 3: No SPK (input), No Bon (input), Lampiran (input)
- Row 4: Aliases/Tujuan (searchable select), Divisi (dropdown)

---

### Bagian D: Update Detail Grid dengan Multi-Currency

#### D1. Backend Detail Entity

File: `backend/internal/features/accounting/kasbank/entity.go`

Tambahkan field ke detail:

```go
type SDbTransaksi struct {
    // ... existing fields ...
    Valas       string  `json:"valas" gorm:"column:Valas;size:3"`   // NEW: currency code
    Kurs        float64 `json:"kurs" gorm:"column:Kurs"`            // NEW: exchange rate
    JumlahDollar float64 `json:"jumlahDollar" gorm:"column:JumlahDollar"` // NEW: foreign amount
    NilaiGiro   float64 `json:"nilaiGiro" gorm:"column:NilaiGiro"`  // NEW: cheque value
}
```

#### D2. Frontend Detail Grid Update

File: `frontend/src/domains/accounting/components/accounting/kasbank/KasBankDetailTable.tsx`

Update kolom grid:
- Tambah kolom: Valas (dropdown), Kurs (input), Jumlah $ (auto), Jumlah Rp (auto), Nilai Giro (input)
- Kolom "T" = Debit/Kredit (auto dari posisi baris: baris genap = kredit, ganjil = debet)

---

### Bagian E: Sub-form Settlement, Giro, Aktiva

Ini adalah bagian paling kompleks. Setiap sub-form muncul berdasarkan kondisi:

#### E1. Pelunasan (Sub-ledger Settlement)

**Trigger:** Jika `Lawan` di detail line = Piutang Dagang atau Hutang Dagang

**UI:** Tombol "Pelunasan" di setiap detail line → membuka sub-modal untuk memilih invoice/piutang/hutang yang dilunasi.

**Backend:** 
- Tabel referensi: `DBINVPIUTANG`, `DBINVTAGIHAN`, `DBHUTANG`
- Endpoint baru: `POST /api/accounting/kasbank/settlement`
- Simpan mapping: `noBukti_kasbank` ↔ `noInvoice_piutang/hutang`

#### E2. Giro

**Trigger:** Jika `THPC = "H"` atau `THPC = "P"`

**UI:** Section baru di form dengan field:
- No. Giro (input)
- Tanggal Giro (date picker)
- Bank Penerbit (dropdown)
- Jumlah Giro (auto from header)

**Backend:**
- Simpan ke tabel `DBGIRO` atau kolom terkait di `DBTRANSAKSI`

#### E3. Aktiva

**Trigger:** Jika `Lawan` di detail line = Akun Aktiva Tetap (AKTAVA/TETAP)

**UI:** Tombol "Aktiva" → sub-modal untuk memilih aset tetap.

**Backend:**
- Tabel referensi: `DBAKTIVA`
- Endpoint: `POST /api/accounting/kasbank/aktiva`

---

## Implementation Phases

### Phase 1: Perbaiki Penomoran (Hari Ini)
- [ ] A2: Update `nomor.go` — baca NOPST dari DBNOMOR
- [ ] A3: Update `repository.go` — transaction baca NOPST+PEMISAH+THPNU
- [ ] Test: Verify format nomor baru sesuai trade-exchange

### Phase 2: Perbaiki Filter Akun Kas/Bank (Hari Ini)
- [ ] B1: Tambah parameter `TipeTrans` ke DTO
- [ ] B2: Implementasi filter di repository
- [ ] B3: Update frontend hook + form dialog
- [ ] Test: Verify dropdown sesuai tipe (BKM=BKK vs BBM=BBK)

### Phase 3: Tambah Field Header (Besok)
- [ ] C1-C3: Semua field baru di entity, DTO, form UI
- [ ] Test: Form submit dengan semua field

### Phase 4: Detail Grid Multi-Currency (Besok)
- [ ] D1-D2: Field Valas, Kurs, Jumlah $, Nilai Giro di grid
- [ ] Test: Multi-currency calculation

### Phase 5: Sub-form Settlement/Giro/Aktiva (Lusa)
- [ ] E1-E3: Ketiga sub-form
- [ ] Test: Trigger conditions + data persistence

---

## Files to Modify

### Backend
| File | Change |
|------|--------|
| `backend/internal/features/accounting/kasbank/nomor.go` | Read NOPST, fix format |
| `backend/internal/features/accounting/kasbank/repository.go` | Transaction update, lookup filter |
| `backend/internal/features/accounting/kasbank/entity.go` | New fields (NoSPK, Sumber, THPC, dll) |
| `backend/internal/features/accounting/kasbank/dto.go` | New request/response DTOs |
| `backend/internal/features/accounting/kasbank/service.go` | Business logic for settlement/giro/aktiva |
| `backend/internal/features/accounting/kasbank/handler.go` | New endpoints |
| `backend/internal/features/accounting/kasbank/routes.go` | New route registrations |

### Frontend
| File | Change |
|------|--------|
| `frontend/src/domains/accounting/types/kasbank.ts` | New types/interfaces |
| `frontend/src/domains/accounting/services/kasbankService.ts` | New API methods |
| `frontend/src/domains/accounting/hooks/useKasBank.ts` | Updated hooks |
| `frontend/src/domains/accounting/components/accounting/kasbank/KasBankFormDialog.tsx` | New fields + sub-forms |
| `frontend/src/domains/accounting/components/accounting/kasbank/KasBankDetailTable.tsx` | Multi-currency columns |
| `frontend/src/domains/accounting/components/accounting/kasbank/SettlementDialog.tsx` | NEW: Pelunasan sub-form |
| `frontend/src/domains/accounting/components/accounting/kasbank/GiroDialog.tsx` | NEW: Giro sub-form |
| `frontend/src/domains/accounting/components/accounting/kasbank/AktivaDialog.tsx` | NEW: Aktiva sub-form |

---

## Risks & Considerations

1. **SQL Server 2008 Compatibility**: Semua query harus compatible dengan SQL Server 2008 R2 — gunakan bracket quoting, no CTE untuk query sederhana, no `OFFSET/FETCH` untuk pagination.

2. **Race Condition Prevention**: Increment counter di `DBNOMOR` harus selalu pakai `(UPDLOCK, HOLDLOCK)` untuk mencegah duplikasi nomor.

3. **Backward Compatibility**: Nomor bukti yang sudah ada tidak boleh berubah formatnya. Perubahan hanya berlaku untuk nomor baru.

4. **Authorization**: Sub-form (Pelunasan, Giro, Aktiva) memerlukan permission tambahan selain ISTAMBAH.

5. **Testing**: Setiap perubahan perlu unit test (repository + service) dan integration test (handler).

---

## Verification Criteria

1. ✅ Nomor bukti format: `[TIPE]{sep}[YYYYMM]{sep}[SEQ]{sep}[NOPST]` — contoh: `BKK/202607/0001/PWT`
2. ✅ Dropdown Akun Kas/Bank hanya menampilkan akun yang sesuai tipe transaksi
3. ✅ Field No SPK, Sumber, Jumlah Giro, THPC, Lampiran, No Bon, Aliases, Divisi tersimpan ke DB
4. ✅ Detail grid menampilkan Valas, Kurs, Jumlah $, Jumlah Rp, Nilai Giro
5. ✅ Tombol Pelunasan muncul saat Lawan = Piutang/Hutang Dagang
6. ✅ Tombol Giro muncul saat THPC = H atau P
7. ✅ Tombol Aktiva muncul saat Lawan = Akun Aktiva Tetap
8. ✅ Semua perhitungan Debit = Kredit tetap valid

## Testing Approach

### User Scenarios (Mandatory)

**Positive:**
- ✅ Create BKM baru dengan akun Kas (Kelompok=1, SubKelompok=1.1) → berhasil, nomor `BKM/202607/0001/PWT`
- ✅ Create BBM baru dengan akun Bank (Kelompok=1, SubKelompok=1.2) → berhasil
- ✅ Edit existing record → field No SPK, Sumber, Jumlah Giro tersimpan
- ✅ Generate nomor baru di bulan berbeda → reset SEQ ke 1

**Negative:**
- ❌ BKM dengan akun Bank saja → dropdown tidak menampilkan akun non-Bank
- ❌ Create tanpa jumlah Giro padahal THPC=H → error validasi
- ❌ Edit locked record → error 403

**Edge:**
- ⏳ Concurrent generate nomor bukti → tidak ada duplikasi (DBNOMOR row lock)
- ⏳ Bulan rollover → SEQ reset ke 1
- ⏳ Multi-currency (USD/IDR) → Jumlah $ × Kurs = Jumlah Rp

### Test File Locations
- Backend unit: `kasbank/nomor_test.go`, `repository_test.go`, `service_test.go`, `handler_test.go`
- Backend E2E: `backend/tests/e2e/kasbank_e2e_test.go`
- Frontend unit: `KasBankFormDialog.test.tsx`, `KasBankDetailTable.test.tsx`
- Frontend E2E: `frontend/e2e/kasbank.spec.ts`

## Estimate

**Hours:** 24h (Medium-Large)

Breakdown:
- Phase 1 (Penomoran): 4h
- Phase 2 (Filter Akun): 4h
- Phase 3 (Field Header): 6h
- Phase 4 (Multi-currency): 4h
- Phase 5 (Sub-forms): 6h

## Dependencies
- TASK-009 (Penomoran — sebagian sudah selesai)
- TASK-010 (COA Lookup — sudah selesai dengan endpoint /lookup-perkiraan)
- TASK-022 (Trade-Exchange Integration — referensi format PHP)
- Existing: `DBNOMOR`, `DBPERKIRAAN`, `DBTRANS`, `DBTRANSAKSI` schema
- Future: `DBGIRO`, `DBINVPIUTANG`, `DBHUTANG`, `DBAKTIVA` tables (may need schema work)

## Risks & Mitigations

1. **SQL Server 2008 Compatibility** — Semua query harus pakai bracket quoting `[column]`, no `OFFSET/FETCH`, no `STRING_AGG`. Mitigation: Tulis test khusus untuk setiap query baru.

2. **Race Condition pada DBNOMOR** — Increment counter harus pakai `(UPDLOCK, HOLDLOCK)`. Mitigation: Code review + integration test untuk concurrent calls.

3. **Backward Compatibility** — Nomor bukti lama tidak boleh berubah formatnya. Mitigation: Tambah test untuk ensure old records tetap readable.

4. **Sub-form Permissions** — Settlement/Giro/Aktiva butuh permission tambahan. Mitigation: Tambah permission flags baru di `DBFLMENU` per level otorisasi.

5. **Scope Creep** — Task ini bisa meledak ke epic. Jika >40h, split jadi TASK-024 (Sub-form), TASK-025 (Multi-currency detail), TASK-026 (Penomoran fix).

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Backend `go build ./...` exits 0
- [ ] Backend `go test ./...` 80%+ coverage on kasbank package
- [ ] Frontend `npm run type-check` exits 0
- [ ] Frontend runtime verification (navigate to /admin/accounting/kasbank, test all flows)
- [ ] E2E Playwright test for full create flow passes
- [ ] i18n keys added to both `locales/en/accounting.ts` and `locales/id/accounting.ts`
- [ ] Backend Swagger annotations updated; `swag init` run
- [ ] Feature CLAUDE.md updated (accounting/CLAUDE.md)
- [ ] Code reviewed
