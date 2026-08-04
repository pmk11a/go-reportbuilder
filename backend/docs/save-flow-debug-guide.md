# Kas Bank Save Flow Debug Guide

> **Purpose:** Help debug stuck/failed saves in the Kas Bank (BKM/BKK/BBM/BBK) voucher system.
> Covers all 4 main tables: `DBTRANS`, `DBTRANSAKSI`, `DBHUTPIUT`, `DBAKTIVA`.
> Includes sub-transactional saves: `DBGIRO`, `DBDEPOSITO`.

---

## Table of Contents

1. [Save Flow Overview](#1-save-flow-overview)
2. [NoBukti Generation](#2-nobukti-generation)
3. [DBTRANS — Header Table](#3-dbtrans--header-table)
4. [DBTRANSAKSI — Detail Table](#4-dbtransaksi--detail-table)
5. [DBHUTPIUT — Hutang/Piutang Sub-Table](#5-dbhutpiut--hutangpiutang-sub-table)
6. [DBAKTIVA — Aktiva Sub-Table](#6-dbaktiva--aktiva-sub-table)
7. [DBGIRO / DBDEPOSITO — Sub-Transaction Tables](#7-dbgiro--dbdeposito--sub-transaction-tables)
8. [Update Mode (Full Replace)](#8-update-mode-full-replace)
9. [Validation Rules](#9-validation-rules)
10. [Common Error Patterns](#10-common-error-patterns)
11. [Debug Checklist](#11-debug-checklist)
12. [SQL Query Quick Reference](#12-sql-query-quick-reference)

---

## 1. Save Flow Overview

### 1.1 Two Entry Points

| Endpoint | Mode | Flow |
|---|---|---|
| `POST /api/accounting/kasbank` | **INSERT** | Generate NoBukti → Insert DBTRANS → Insert DBTRANSAKSI (batch) → Insert sub-tables |
| `PUT /api/accounting/kasbank/:noBukti` | **UPDATE** | Fetch header → Clear DBTRANSAKSI → Insert new DBTRANSAKSI → Upsert sub-tables |

Both are wrapped in a single GORM transaction — **all tables succeed or all roll back**.

### 1.2 Transaction Boundary (service.go)

```
s.db.Transaction(func(tx *gorm.DB) error {
    │
    ├─ 1. Generate NoBukti (inside tx via GenerateNoBuktiTx)
    ├─ 2. Insert DBTRANS
    ├─ 3. Update DBTRANS extra fields (NoBuktiSem, Nobon) via raw SQL
    ├─ 4. Insert DBTRANSAKSI (batch)
    ├─ 5. Re-validate double-entry (SUM Debet == SUM Kredit)
    ├─ 6. Insert DBGIRO (if any)
    ├─ 7. Insert DBDEPOSITO (if any)
    ├─ 8. Insert DBHUTPIUT (if any)
    ├─ 9. Insert DBAKTIVA (if any)
    │
    └─ COMMIT on success / ROLLBACK on any error
})
```

### 1.3 Sub-Transaction Trigger Map

Sub-forms are triggered based on the **Perkiraan** selected in a detail row, looked up in `DBPOSTHUTPIUT`:

| DBPOSTHUTPIUT.Kode | Trigger | Sub-Table Written | Delphi Form |
|---|---|---|---|
| `DP` | Giro | `DBGIRO` | FrmKasBankGiro |
| `PT` | HutPiut | `DBHUTPIUT` | FrmKasBankHutPiut |
| `HT` | HutPiut | `DBHUTPIUT` | FrmKasBankHutPiut |
| `UPT` | HutPiut | `DBHUTPIUT` | FrmKasBankHutPiut |
| `UHT` | HutPiut | `DBHUTPIUT` | FrmKasBankHutPiut |
| `AKV` | Aktiva | `DBAKTIVA` | FrmSubAktiva |
| `AKM` | Aktiva | `DBAKTIVA` | FrmSubAktiva |

The `ResolveSubTransaction(ctx, perkiraan, dk)` function in `service.go` determines which sub-form triggers.

---

## 2. NoBukti Generation

### 2.1 Flow

```
Frontend clicks "Generate" 
  → GET /api/accounting/kasbank/generate-no-bukti-preview?tipe=BKK
  → service.GenerateNoBuktiPreview()
    → settingsSvc.GenerateNoBuktiTx(tx, tipe, tahun, bulan)
      → Reads DBNOMOR (ALIAS = tipe) with UPDLOCK, HOLDLOCK
      → Renders format: {PEMISAH}{FORMAT1}/{TIPE}/{FORMAT2}/{TAHUN}{BULAN}
      → Returns { noBukti, seq }
      → NO counter commit (preview only)
  → Frontend stores preview in form state

Frontend submits POST /api/accounting/kasbank
  → service.CreateHeader()
    → GenerateNoBuktiTx (UPDLOCK, HOLDLOCK on DBNOMOR)
    → CommitCounterTx (sets DBNOMOR.NOBkk/NOBkm/etc = seq)
    → INSERT DBTRANS with that noBukti
```

### 2.2 NoBukti Format Components

| Component | Source | Example |
|---|---|---|
| `PEMISAH` | `DBNOMOR.PEMISAH` (0=slash, 1=dot, 2=dash) | `/` |
| `FORMAT1` | `DBNOMOR.FORMAT1` (auto-incremented counter) | `00001` |
| `TIPE` | Request `tipeTransHd` (BKM/BKK/BBM/BBK) | `BKK` |
| `FORMAT2` | `DBNOMOR.FORMAT2` (usually 0) | `00` |
| `TAHUN` | DBPERIODE `TAHUN` | `2026` |
| `BULAN` | DBPERIODE `BULAN` | `07` |

**Example:** `00001/BKK/00/202607`

### 2.3 Transaction Safety

```sql
-- DBNOMOR read with lock (settings/service.go GenerateNoBuktiTx)
SELECT [PEMISAH], [FORMAT1], ... FROM DBNOMOR WITH (UPDLOCK, HOLDLOCK)
WHERE [ALIAS] = 'BKK'

-- Counter increment (CommitCounterTx)
UPDATE DBNOMOR SET [FORMAT1] = [FORMAT1] + 1 WHERE [ALIAS] = 'BKK'
```

> **WARNING:** `UPDLOCK, HOLDLOCK` is critical. Without it, concurrent saves can generate the same NoBukti, causing a PRIMARY KEY violation on DBTRANS.

---

## 3. DBTRANS — Header Table

### 3.1 Primary Key

```
(NoBukti, NOURUT)  -- composite PK
```

### 3.2 Fields Written on INSERT

| Field | Source | Notes |
|---|---|---|
| `NoBukti` | Generated from DBNOMOR | e.g. `00001/BKK/00/202607` |
| `NOURUT` | `result.Seq` (counter value) | Integer as string, e.g. `"1"` |
| `Tanggal` | Request `tanggal` or DBPERIODE default | Must fall within user's active period |
| `Note` | Request `note` | Free-text header description |
| `TipeTransHd` | Request `tipeTransHd` | BKM / BKK / BBM / BBK |
| `PerkiraanHd` | Request `perkiraanHd` | Cash/bank account code (optional) |
| `NoJurnal` | Request `noJurnal` | Optional order number |
| `TglJurnal` | Request `tgljurnal` | Optional due date |

### 3.3 Fields Written via Raw SQL UPDATE

These columns exist in the DB but are excluded from GORM's struct scan (`->;<-:false`):

```sql
UPDATE DBTRANS 
  SET NoBuktiSem = ?, Nobon = ?
WHERE NoBukti = ?
```

| Field | Source | Notes |
|---|---|---|
| `NoBuktiSem` | Request `noBuktiSem` | Invoice/reference number |
| `Nobon` | Request `nobon` | External reference number |

> **Note:** `Devisi` lives in DBTRANSAKSI detail rows, NOT in DBTRANS header.

### 3.4 Fields NOT Written (by design)

| Field | Reason |
|---|---|
| `IsOtorisasi1-5` | Default `false` / `0` on new insert |
| `OtoUser1-5` | Default empty |
| `TglOto1-5` | Default NULL |
| `TPHC` | Lives in DBTRANSAKSI detail rows only |
| `Devisi` | Lives in DBTRANSAKSI detail rows only |
| `MaxOL` | Defaults to 2 (set by `effectiveMaxOL()` when read) |
| `NoUrutJurnal`, `TglJurnal` | Optional, only if `NoJurnal` is set |
| `MyID` | GORM auto-set via callback from request context |

### 3.5 INSERT Example (raw SQL)

```sql
INSERT INTO DBTRANS (
    [NoBukti], [NOURUT], [Tanggal], [Note],
    [TipeTransHd], [PerkiraanHd], [NoJurnal]
) VALUES (
    '00001/BKK/00/202607', '1', '2026-07-15', 'Pembayaran listrik',
    'BKK', '1.1.01.001', 'ORD-001'
)

-- Then separately:
UPDATE DBTRANS 
  SET [NoBuktiSem] = 'INV-2026-001', [Nobon] = 'BON-001'
WHERE [NoBukti] = '00001/BKK/00/202607'
```

---

## 4. DBTRANSAKSI — Detail Table

### 4.1 Primary Key

```
(NoBukti, Urut, FlagSimbol)  -- composite PK
```

> **Note:** `FlagSimbol` is always `"RP"` for IDR. In this codebase it is always set as a constant `"RP"`.

### 4.2 Fields Written on INSERT (via buildDetailRow)

Each detail row is built from `SDetailInput` + header context:

| Field | Source | Notes |
|---|---|---|
| `NoBukti` | Generated header NoBukti | Same as DBTRANS.NoBukti |
| `Tanggal` | Header `Tanggal` | Copied from DBTRANS |
| `Perkiraan` | `d.Perkiraan` | Account code (required) |
| `Lawan` | `d.Lawan` | Contra-account code |
| `Debet` | `d.Debet` | 0 when Kredit > 0 |
| `Kredit` | `d.Kredit` | 0 when Debet > 0 |
| `Valas` | `d.Valas` or `"IDR"` | Foreign currency code |
| `Kurs` | `d.Kurs` or `1.0` | Exchange rate |
| `DebetRp` | `d.Debet` (IDR) or `d.Debet * Kurs` | Rupiah equivalent |
| `KreditRp` | `d.Kredit` (IDR) or `d.Kredit * Kurs` | Rupiah equivalent |
| `Keterangan` | `d.Keterangan` | Line description |
| `TipeTrans` | Header `tipeTransHd` | Mirrors header discriminator |
| `TPHC` | `headerTPHC` | C=Cash, T=Transfer, H=Hutang Giro, P=Piutang Giro |
| `Devisi` | `headerDevisi` | From request `devisi` |
| `Nobon` | `headerNoBon` | From request `nobon` |
| `Urut` | Auto-increment: `i + 1` | 1-based sequence within NoBukti |
| `KodeBag` | `d.KodeBag` | SPK/project reference |
| `CustSuppP` | `d.KodeCustSupp` | Customer/Supplier for D side |
| `CustSuppL` | `d.CustSuppL` | Customer/Supplier for K side |
| `KodeP` | `subRes.Kode` | From ResolveSubTransaction |
| `KodeL` | `subRes.Kode` | Same as KodeP (KasBank convention) |
| `StatusAktivaP` | `subRes.StatusP` | Set only when trigger = `aktiva` |
| `StatusAktivaL` | `subRes.StatusL` | Set only when trigger = `aktiva` |
| `StatusGiro` | `calculateStatusGiro(TPHC, tipeTrans)` | P+/P-/H+/H- |
| `FlagSimbol` | `"RP"` | Always IDR constant |
| `NoAktivaP` | `d.NoAktivaP` | From Aktiva sub-form |
| `NoAktivaL` | `d.NoAktivaL` | From Aktiva sub-form |
| `XSusut` | `d.XSusut` | OMIT from INSERT (may not exist in legacy DB) |
| `PerlakuanAktiva` | `d.PerlakuanAktiva` | OMIT from INSERT (may not exist in legacy DB) |

### 4.3 Sub-Transaction Resolution per Row

For **each detail row**, `ResolveSubTransaction(ctx, perkiraan, dk)` is called:

```go
subRes, _ := s.ResolveSubTransaction(ctx, d.Perkiraan, dkVal)
// dkVal = "D" if Debet > 0, else "K"
```

**StatusGiro calculation:**

```go
func calculateStatusGiro(tphc string, mode string) string {
    if tphc == "P" {
        if mode == "BKM" || mode == "BBM" { return "P+" }
        return "P-"
    } else if tphc == "H" {
        if mode == "BKM" || mode == "BBM" { return "H+" }
        return "H-"
    }
    return ""
}
```

### 4.4 INSERT Example (raw SQL)

```sql
-- Detail row 1 (D side - Kas/Bank)
INSERT INTO DBTRANSAKSI (
    [NoBukti], [Tanggal], [Perkiraan], [Lawan],
    [Debet], [Kredit], [Valas], [Kurs],
    [DebetRp], [KreditRp], [Keterangan],
    [TipeTrans], [TPHC], [Urut], [Devisi],
    [Nobon], [FlagSimbol]
) VALUES (
    '00001/BKK/00/202607', '2026-07-15', '1.1.01.001', '2.1.01.001',
    500000, 0, 'IDR', 1.0,
    500000, 0, 'Pembayaran listrik Juli 2026',
    'BKK', 'T', 1, 'DVS01',
    'BON-001', 'RP'
)

-- Detail row 2 (K side - Hutang)
INSERT INTO DBTRANSAKSI (
    [NoBukti], [Tanggal], [Perkiraan], [Lawan],
    [Debet], [Kredit], [Valas], [Kurs],
    [DebetRp], [KreditRp], [Keterangan],
    [TipeTrans], [TPHC], [Urut], [Devisi],
    [Nobon], [FlagSimbol],
    [CustSuppP], [KodeP], [StatusGiro]
) VALUES (
    '00001/BKK/00/202607', '2026-07-15', '2.1.01.001', '1.1.01.001',
    0, 500000, 'IDR', 1.0,
    0, 500000, 'Hutang listrik',
    'BKK', 'T', 2, 'DVS01',
    'BON-001', 'RP',
    'CS001', 'HT', 'H-'
)
```

### 4.5 Batch Insert Safety

```go
// service.go: ~line 515
if err := tx.Omit("XSusut", "PerlakuanAktiva").Create(rows).Error; err != nil {
    return fmt.Errorf("inserting detail rows: %w", err)
}
```

> **Why Omit?** The dev/legacy DB may not have `XSusut` and `PerlakuanAktiva` columns. GORM would emit `Invalid column name 'XSusut'` without `Omit()`. On production DB (all columns exist), `Omit()` is a no-op.

---

## 5. DBHUTPIUT — Hutang/Piutang Sub-Table

### 5.1 When Written

`DBHUTPIUT` rows are written when a detail row triggers `hutpiut` sub-form (DBPOSTHUTPIUT.Kode = PT/HT/UPT/UHT).

### 5.2 Primary Key

```
(NoFaktur, NoRetur, TipeTrans, KodeCustSupp, NoBukti, NoMsk, Urut, Tipe, Perkiraan)
-- 9-column composite PK
```

### 5.3 Fields Written

Each item in `req.HutPiutList` (type `SDBHUTPIUT`) is written directly:

| Field | Source | Notes |
|---|---|---|
| `NoFaktur` | `hp.NoFaktur` | Invoice number |
| `NoRetur` | `hp.NoRetur` | Return note number (empty if not a return) |
| `TipeTrans` | `hp.TipeTrans` | PT / HT / UPT / UHT |
| `KodeCustSupp` | `hp.KodeCustSupp` | Customer/Supplier code |
| `NoBukti` | Set to `noBukti` (header) | Before `tx.Create()` |
| `NoMsk` | `hp.NoMsk` from FE (auto-filled from DBTRANSAKSI.Urut that triggered hutpiut) | Required for DBHUTPIUT PK; auto-set to 1 if 0 |
| `Urut` | `hp.Urut` — auto-generated: increments per NoMsk group | 1, 2, 3... within same NoMsk |
| `Tanggal` | Header `Tanggal` | Copied from DBTRANS |
| `JatuhTempo` | `hp.JatuhTempo` | Invoice due date |
| `Debet` | `hp.Debet` | Payment amount (D side) |
| `Kredit` | `hp.Kredit` | Payment amount (K side) |
| `Valas` | `hp.Valas` | Currency code |
| `Kurs` | `hp.Kurs` | Exchange rate |
| `DebetD` | `hp.DebetD` | Valas-equivalent debet |
| `KreditD` | `hp.KreditD` | Valas-equivalent kredit |
| `Tipe` | `hp.Tipe` | PT / HT / UPT / UHT |
| `Perkiraan` | `hp.Perkiraan` | Account code from DBPOSTHUTPIUT |
| `Catatan` | `hp.Catatan` | Free-text note |
| `TipeDK` | `hp.TipeDK` | 'D' or 'K' — which side of ledger |
| `NOINVOICE` | `hp.NOINVOICE` | Optional invoice reference |
| `TGLINVOICE` | `hp.TGLINVOICE` | Invoice date |
| `NOPAJAK` | `hp.NOPAJAK` | Tax invoice number |
| `TGLFPJ` | `hp.TGLFPJ` | Tax invoice date |
| `KodeVls_` | `hp.KodeVls_` | Currency code (alternate) |
| `Kurs_` | `hp.Kurs_` | Exchange rate (alternate) |
| `KursBayar` | `hp.KursBayar` | Payment exchange rate |
| `FlagSimbol` | `hp.FlagSimbol` | "RP" |
| `Tipebayar` | `hp.Tipebayar` | Payment type |
| `IsClose` | `hp.IsClose` | TRUE when fully settled |
| `NoJurnal` | `hp.NoJurnal` | From header |
| `NoUrutJurnal` | `hp.NoUrutJurnal` | From header |
| `TglJurnal` | `hp.TglJurnal` | From header |
| `MaxOL` | `hp.MaxOL` | Authorization level |
| `KodeSales` | `hp.KodeSales` | Salesperson code |
| `Nourut` | `hp.Nourut` | Optional sequence |
| `KBLB` | `hp.KBLB` | Optional flag |

### 5.4 NoMsk / Urut Auto-Fill Logic (Critical for PK)

`NoMsk` and `Urut` are **primary key components** of `DBHUTPIUT`. If both are 0, every row will collide on the composite PK.

**Rule:**
- `NoMsk` = the `Urut` (row number) of the **DBTRANSAKSI detail row** that triggered the hutpiut sub-form.
  - Example: user fills detail row #2 → opens hutpiut picker → selected invoices get `NoMsk = 2`.
- `Urut` = sequence number **within the same NoMsk group** (1, 2, 3...) — increments when multiple invoices are selected for the same detail row.

**Auto-fill in service.go:**

```go
hpGroup := make(map[int]int) // noMsk → current urut counter
for i := range req.HutPiutList {
    hp := &req.HutPiutList[i]
    hp.NoBukti = noBukti
    if hp.NoMsk == 0 {
        hp.NoMsk = 1 // fallback: default ke baris detail pertama
    }
    hpGroup[hp.NoMsk]++
    hp.Urut = hpGroup[hp.NoMsk]
    tx.Create(hp)
}
```

**Frontend responsibility:** FE must populate `hp.NoMsk` with the `Urut` of the detail row that triggered the sub-form. If FE sends `NoMsk = 0`, the service defaults to 1.

### 5.5 INSERT Example (raw SQL)

```sql
-- Pelunasan Hutang: Bayar BKK 500000 ke CS001 untuk invoice INV-001
INSERT INTO DBHUTPIUT (
    [NoFaktur], [NoRetur], [TipeTrans], [KodeCustSupp],
    [NoBukti], [NoMsk], [Urut], [Tanggal],
    [JatuhTempo], [Debet], [Kredit], [Valas], [Kurs],
    [DebetD], [KreditD], [KodeSales], [Tipe], [Perkiraan],
    [Catatan], [TipeDK], [NOINVOICE], [FlagSimbol],
    [NoJurnal], [NoUrutJurnal]
) VALUES (
    'INV-001', '', 'HT', 'CS001',
    '00001/BKK/00/202607', 2, 2, '2026-07-15',
    '2026-07-30', 0, 500000, 'IDR', 1.0,
    0, 500000, 'SALES01', 'HT', '2.1.01.001',
    'Pelunasan invoice Juli', 'K', 'INV-001', 'RP',
    'ORD-001', '1'
)
```

### 5.5 UPDATE Mode for DBHUTPIUT

On **UPDATE** (`PUT`), the current implementation does **not delete existing DBHUTPIUT rows** before re-inserting. This means old payment records can accumulate if not manually cleaned.

```go
// ⚠️ UPDATE mode: creates new rows without deleting old ones
for _, hp := range req.HutPiutList {
    hp.NoBukti = noBukti
    if err := tx.Create(&hp).Error; err != nil { ... }
}
```

> **TODO:** UPDATE mode should `DELETE FROM DBHUTPIUT WHERE NoBukti = ?` before re-inserting, mirroring the DBTRANSAKSI behavior.

---

## 6. DBAKTIVA — Aktiva Sub-Table

### 6.1 When Written

`DBAKTIVA` rows are written when a detail row triggers `aktiva` sub-form (DBPOSTHUTPIUT.Kode = AKV/AKM).

### 6.2 Primary Key

```
(Devisi, Perkiraan)  -- composite PK
```

> **WARNING:** The composite PK `(Devisi, Perkiraan)` means **only ONE active DBAKTIVA row per (Devisi, Perkiraan) pair at a time**. In UPDATE mode this is safe (old row is deleted before new insert). In INSERT mode the caller must ensure no duplicate (Devisi, Perkiraan) pair exists.

### 6.3 Fields Written

| Field | Source | Notes |
|---|---|---|
| `Devisi` | `aktiva.Devisi` | Business unit (required) |
| `Perkiraan` | `aktiva.Perkiraan` | Aktiva account code (primary key) |
| `Keterangan` | `aktiva.Keterangan` | Description |
| `Quantity` | `aktiva.Quantity` | Asset quantity |
| `Persen` | `aktiva.Persen` | Percentage |
| `Tanggal` | Header `Tanggal` or `aktiva.Tanggal` | Transaction date |
| `Tipe` | `aktiva.Tipe` | Type string |
| `Kodebag` | `aktiva.Kodebag` | Bagian code |
| `Akumulasi` | `aktiva.Akumulasi` | Accumulated depreciation account |
| `NoMuka` | `aktiva.NoMuka` | Front asset number |
| `NoBelakang` | `aktiva.NoBelakang` | Back asset number |
| `Biaya` | `aktiva.Biaya` | Cost account |
| `PersenBiaya1` | `aktiva.PersenBiaya1` | Cost percentage 1 |
| `Biaya2` | `aktiva.Biaya2` | Cost account 2 |
| `PersenBiaya2` | `aktiva.PersenBiaya2` | Cost percentage 2 |
| `Biaya3` | `aktiva.Biaya3` | Cost account 3 |
| `Persenbiaya3` | `aktiva.Persenbiaya3` | Cost percentage 3 |
| `Biaya4` | `aktiva.Biaya4` | Cost account 4 |
| `Persenbiaya4` | `aktiva.Persenbiaya4` | Cost percentage 4 |
| `TipeAktiva` | `aktiva.TipeAktiva` | Asset type |
| `NoBelakang2` | `aktiva.NoBelakang2` | Sub-asset number |
| `NoAktivaHd` | `aktiva.NoAktivaHd` | Parent asset header number |
| `Kelompok` | `aktiva.Kelompok` | Group classification |
| `GroupAktiva` | `aktiva.GroupAktiva` | Asset group |
| `NoBuktiSem` | Set to `noBukti` | Links to the voucher that created this asset |

### 6.4 INSERT Example (raw SQL)

```sql
-- Pembelian Aktiva via BKM
INSERT INTO DBAKTIVA (
    [Devisi], [Perkiraan], [Keterangan], [Quantity],
    [Persen], [Tanggal], [Tipe], [Kodebag],
    [Akumulasi], [NoMuka], [NoBelakang],
    [Biaya], [PersenBiaya1], [Biaya2], [PersenBiaya2],
    [Biaya3], [Persenbiaya3], [Biaya4], [Persenbiaya4],
    [TipeAktiva], [NoBelakang2], [NoAktivaHd],
    [Kelompok], [GroupAktiva], [NoBuktiSem]
) VALUES (
    'DVS01', '1.1.02.001', 'Pembelian komputer', 1,
    0, '2026-07-15', 'Pembelian', 'BAG01',
    '1.2.02.001', '1.1.02.001', '00001',
    '1.4.01.001', 100, '', 0,
    '', 0, '', 0,
    1, '', '',
    1, 'AKVGRP', '00001/BKM/00/202607'
)
```

### 6.5 Auto-NoUrut Generation

```go
// service.go GenerateNoUrutAktiva
func (s *SKasBankService) GenerateNoUrutAktiva(ctx context.Context, perkiraan, devisi string) (int, error) {
    var maxUrut float64
    err := s.db.WithContext(ctx).Raw(
        "SELECT MAX(NOURUT) FROM DBAKTIVA WHERE Perkiraan = ? AND Devisi = ?",
        perkiraan, devisi,
    ).Scan(&maxUrut).Error
    if maxUrut == 0 { return 1, nil }
    return int(maxUrut) + 1, nil
}
```

This generates the **NoMuka** / **NoBelakang** values. Called from the Aktiva sub-form.

---

## 7. DBGIRO / DBDEPOSITO — Sub-Transaction Tables

### 7.1 When Written

- **DBGIRO:** Triggered when `DBPOSTHUTPIUT.Kode = "DP"` AND `cfg.EnableGiroFeature = true`
- **DBDEPOSITO:** Triggered when user manually adds a deposito (no automatic trigger from DBPOSTHUTPIUT)

### 7.2 DBGIRO Fields

| Field | Source | Notes |
|---|---|---|
| `NoGiro` | `g.NoGiro` | Giro number (PK) |
| `Bank` | `g.Bank` | Bank name |
| `Nominal` | `g.Nominal` | Face value |
| `TglTerbit` | `g.TglTerbit` | Issue date |
| `TglJatuhTempo` | `g.TglJatuhTempo` | Due date |
| `TglGiro` | `g.TglGiro` | Giro date |
| `StatusGiro` | `g.StatusGiro` | DP+/DP- |
| `Tipe` | `g.Tipe` | PT (Piutang Giro) or HT (Hutang Giro) |
| `Keterangan` | `g.Keterangan` | Description |
| `KodeVls` | `g.KodeVls` | Currency code |
| `Kurs` | `g.Kurs` | Exchange rate |
| `Debet` | `g.Debet` | 0 for IDR |
| `Kredit` | `g.Kredit` | 0 for IDR |
| `DebetRp` | `g.DebetRp` | Rupiah amount |
| `KreditRp` | `g.KreditRp` | Rupiah amount |
| `Jumlah` | `g.Jumlah` | 0 for IDR |
| `JumlahRp` | `g.JumlahRp` | Total amount in Rupiah |
| `BuktiBuka` | Set to `noBukti` | Links to opening voucher |
| `UrutBuktiBuka` | `g.UrutBuktiBuka` | Detail Urut of opening row |
| `TglBuka` | `g.TglBuka` | Opening date |
| `BuktiCair` | Empty initially | Set when giro is cashed |
| `UrutBuktiCair` | 0 initially | Set when giro is cashed |
| `TglCair` | NULL initially | Set when giro is cashed |
| `KAS` | `g.KAS` | Cash/bank account for cair |

### 7.3 DBDEPOSITO Fields

| Field | Source | Notes |
|---|---|---|
| `NoDeposito` | `d.NoDeposito` | Deposito number (PK) |
| `Bank` | `d.Bank` | Bank name |
| `Nominal` | `d.Nominal` | Principal amount |
| `Bunga` | `d.Bunga` | Interest rate/amount |
| `TglBuka` | `d.TglBuka` | Opening date |
| `TglJatuhTempo` | `d.TglJatuhTempo` | Maturity date |
| `StatusDeposito` | `d.StatusDeposito` | DP+/DP- |
| `Keterangan` | `d.Keterangan` | Description |
| `KodeVls` | `d.KodeVls` | Currency |
| `Kurs` | `d.Kurs` | Exchange rate |
| `DebetRp` | `d.DebetRp` | Amount in Rupiah |
| `KreditRp` | `d.KreditRp` | Amount in Rupiah |
| `JumlahRp` | `d.JumlahRp` | Total in Rupiah |
| `BuktiBuka` | Set to `noBukti` | Links to opening voucher |
| `UrutBuktiBuka` | `d.UrutBuktiBuka` | Detail Urut |
| `BuktiCair` | Empty initially | Set when deposito matures |
| `UrutBuktiCair` | 0 initially | Set when deposito matures |
| `TglCair` | NULL initially | Set when deposito matures |

### 7.4 INSERT Examples

```sql
-- DBGIRO (Hutang Giro - BKK payment with giro)
INSERT INTO DBGIRO (
    [NoGiro], [Bank], [Nominal], [TglTerbit], [TglJatuhTempo],
    [StatusGiro], [Tipe], [Keterangan], [KodeVls], [Kurs],
    [Debet], [Kredit], [DebetRp], [KreditRp], [Jumlah], [JumlahRp],
    [BuktiBuka], [UrutBuktiBuka], [TglBuka], [KAS]
) VALUES (
    'GR-2026-001', 'Bank BCA', 500000, '2026-07-15', '2026-08-15',
    'H-', 'HT', 'Giro untuk pembayaran supplier', 'IDR', 1.0,
    0, 0, 0, 500000, 0, 500000,
    '00001/BKK/00/202607', 2, '2026-07-15', '1.1.01.001'
)

-- DBDEPOSITO (Deposito opened)
INSERT INTO DBDEPOSITO (
    [NoDeposito], [Bank], [Nominal], [Bunga], [TglBuka],
    [TglJatuhTempo], [StatusDeposito], [Keterangan],
    [KodeVls], [Kurs], [DebetRp], [KreditRp], [JumlahRp],
    [BuktiBuka], [UrutBuktiBuka]
) VALUES (
    'DP-2026-001', 'Bank BRI', 10000000, 8.5, '2026-07-15',
    '2026-10-15', 'DP+', 'Deposito 3 bulan', 'IDR', 1.0,
    0, 10000000, 10000000,
    '00001/BKM/00/202607', 1
)
```

---

## 8. UPDATE Mode (Full Replace)

### 8.1 Step-by-Step

```
PUT /api/accounting/kasbank/:noBukti
  1. Fetch existing DBTRANS (check IsOtorisasi1)
  2. s.db.Transaction()
     ├─ 2a. Update DBTRANS (standard GORM Save)
     ├─ 2b. UPDATE DBTRANS extra fields (NoBuktiSem, Nobon)
     ├─ 3.  If req.Details > 0:
     │       ├─ DELETE DBTRANSAKSI WHERE NoBukti = ?
     │       ├─ INSERT new DBTRANSAKSI rows (batch)
     │       └─ Re-validate double-entry
     ├─ 4.  INSERT new DBGIRO rows (no delete - accumulates)
     ├─ 5.  INSERT new DBDEPOSITO rows (no delete - accumulates)
     ├─ 6.  INSERT new DBHUTPIUT rows (no delete - accumulates ⚠️)
     └─ 7.  INSERT new DBAKTIVA rows (no delete ⚠️)
```

### 8.2 UPDATE Mode — DELETE Before INSERT (FIXED)

| Table | DELETE before INSERT? | Status |
|---|---|---|
| `DBTRANSAKSI` | ✅ YES | Correct |
| `DBGIRO` | ✅ YES — open giros + cair-link cleared | Fixed |
| `DBDEPOSITO` | ✅ YES — open depositos + cair-link cleared | Fixed |
| `DBHUTPIUT` | ✅ YES | Fixed |
| `DBTempHUTPIUT` | ✅ YES | Fixed |
| `DBAKTIVA` | ✅ YES — by `NoBuktiSem` | Fixed |

**FIXED:** All 4 accumulation bugs are resolved. The UPDATE transaction now:
1. Deletes existing sub-transaction rows before inserting new ones
2. Uses the same cascade pattern as `DeleteHeader`
3. For Giro/Deposito: also clears `BuktiCair` links (re-linking is not supported)

```go
// service.go UpdateHeader — step 3 (after DBTRANSAKSI clear):

// DBGIRO: delete open + clear cair-link
tx.Exec(`DELETE FROM DBGIRO WHERE [BuktiBuka] = ? AND [TglCair] IS NULL`, noBukti)
tx.Exec(`UPDATE DBGIRO SET [BuktiCair] = '', ... WHERE [BuktiCair] = ?`, noBukti)

// DBDEPOSITO: same
tx.Exec(`DELETE FROM DBDEPOSITO WHERE [BuktiBuka] = ? AND [TglCair] IS NULL`, noBukti)
tx.Exec(`UPDATE DBDEPOSITO SET [BuktiCair] = '', ... WHERE [BuktiCair] = ?`, noBukti)

// DBHUTPIUT
tx.Exec(`DELETE FROM DBHUTPIUT WHERE LTRIM(RTRIM([nobukti])) = ?`, noBukti)

// DBTempHUTPIUT
tx.Exec(`DELETE FROM DBTempHUTPIUT WHERE LTRIM(RTRIM([NoBukti])) = ?`, noBukti)

// DBAKTIVA
tx.Exec(`DELETE FROM DBAKTIVA WHERE [NoBuktiSem] = ?`, noBukti)

// Step 4: INSERT new rows
for _, g := range req.GiroList { tx.Create(&g) }
for _, d := range req.DepositoList { tx.Create(&d) }
for _, hp := range req.HutPiutList { tx.Create(&hp) }
for _, aktiva := range req.AktivaList { tx.Create(&aktiva) }
```

### 8.3 Lock Check

```go
if existing.IsOtorisasi1 {
    return ErrLockedByOtorisasi1
}
```

> **EDIT BLOCKED after first authorization.** Once `IsOtorisasi1 = true`, no edits (PUT) or deletes (DELETE) are allowed.

---

## 9. Validation Rules

### 9.1 Pre-Save Validation (in CreateHeader / UpdateHeader)

| Rule | Error | When |
|---|---|---|
| `tipeTransHd` must be BKM/BKK/BBM/BBK | `ErrTipeInvalid` | Always |
| `Tanggal` must be in user's active period | `ErrTanggalDiLuarPeriode` | Always |
| `Tanggal` must not be in a locked period | `ErrPeriodeLocked` | Always |
| `Tanggal` must parse correctly | `ErrTanggalInvalid` | When supplied |
| At least 1 detail row required | `ErrDetailRequired` | Always |
| Sum(Debet) == Sum(Kredit) | `ErrDoubleEntryUnbalanced` | After DB insert (currently commented out) |
| No negative Debet/Kredit | Inline error | Pre-validate |
| Debet and Kredit cannot both be > 0 in one row | Inline error | Pre-validate |

### 9.2 Otorisasi Sequential Rules

| Level | Prerequisite | Self-authorization |
|---|---|---|
| 1 | None | N/A |
| 2 | Level 1 approved | Level 1 user cannot approve level 2 |
| 3 | Level 2 approved | Level 2 user cannot approve level 3 |
| 4 | Level 3 approved | Level 3 user cannot approve level 4 |
| 5 | Level 4 approved | Level 4 user cannot approve level 5 |

### 9.3 NoBukti Uniqueness Check

```go
// Before committing:
var existingCount int64
tx.Model(&SDbTrans{}).Where("NoBukti = ?", noBukti).Count(&existingCount)
if existingCount > 0 {
    return fmt.Errorf("voucher number %q already exists (duplicate detected)")
}
```

---

## 10. Common Error Patterns

### 10.1 "voucher number already exists" / PRIMARY KEY violation

**Cause:** NoBukti counter in DBNOMOR got incremented but the DBTRANS INSERT failed (e.g. network timeout, FK violation). On retry, the same NoBukti is generated but already exists.

**Fix:** Query the DB:
```sql
SELECT * FROM DBTRANS WHERE NoBukti = '00001/BKK/00/202607'
```
- If the record exists and is valid → manually advance DBNOMOR.FORMAT1 and retry with a new number.
- If the record exists but is corrupt → DELETE it and retry.

### 10.2 "Invalid column name 'XSusut'" / 'PerlakuanAktiva'

**Cause:** Legacy dev DB does not have `XSusut` or `PerlakuanAktiva` columns in DBTRANSAKSI. GORM emits these in the INSERT.

**Fix:** The code already uses `Omit("XSusut", "PerlakuanAktiva")`. Verify the service call has this:
```go
tx.Omit("XSusut", "PerlakuanAktiva").Create(rows)
```

### 10.3 "Invalid column name 'NOURUT'" on DBAKTIVA

**Cause:** `GenerateNoUrutAktiva` uses `SELECT MAX(NOURUT)` but DBAKTIVA model uses `Perkiraan` (not `NOURUT`) as its primary key component. The actual column might not be named `NOURUT`.

**Fix:** Check actual DBAKTIVA column name in the database:
```sql
EXEC sp_columns 'DBAKTIVA'
```
Adjust the raw query to match the actual column name.

### 10.4 DBHUTPIUT rows not appearing in sub-ledger

**Cause:** The `NoMsk` / `Urut` values don't match the DBTRANSAKSI detail row Urut, so the WHERE clause in DeleteDetail cascade never matches.

**Fix:** Verify `hp.NoMsk == detail.Urut` when building the request.

### 10.5 Double-entry unbalanced silently

**Cause:** The double-entry validation is **commented out** in both CreateHeader and UpdateHeader:

```go
// TODO: Commented out per user request
// return ErrDoubleEntryUnbalanced
```

If Debet != Kredit, the voucher still saves but the buku besar will be incorrect.

### 10.6 Aktiva INSERT fails with duplicate key

**Cause:** In INSERT mode, `DBAKTIVA` PK = `(Devisi, Perkiraan)`. If a row with the same (Devisi, Perkiraan) pair already exists, INSERT fails.

> **Note:** This is **not an issue in UPDATE mode** — the fix now deletes existing rows before re-inserting.

**Fix:** Check existing rows first:
```sql
SELECT * FROM DBAKTIVA WHERE [Devisi] = 'DVS01' AND [Perkiraan] = '1.1.02.001'
```
- If exists: user is trying to create a duplicate aktiva — check if the intent was to UPDATE instead of INSERT.

### 10.7 DebetRp/KreditRp = 0 after save

**Cause:** When `Valas != "IDR"` and `Kurs == 0`, the code sets `row.Kurs = 1` but `DebetRp` may not be computed correctly.

```go
if d.Kurs == 0 {
    row.Kurs = 1
}
if d.Valas == "" || d.Valas == "IDR" {
    row.DebetRp = d.Debet  // Uses debet
    row.KreditRp = d.Kredit
} else {
    row.DebetRp = d.Debet * row.Kurs  // Uses debet * kurs
    row.KreditRp = d.Kredit * row.Kurs
}
```

If `d.Debet = 0` (credit row), then `DebetRp = 0`. This is **correct** — debet and kredit are mutually exclusive.

---

## 11. Debug Checklist

When a save is stuck/failing:

### Step 1: Identify the Error

```bash
# Check the HTTP response
curl -s -X POST http://localhost:8080/api/accounting/kasbank \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF' | jq .
{
  "tanggal": "2026-07-15",
  "tipeTransHd": "BKK",
  "note": "Test payment",
  "details": [
    {"perkiraan": "1.1.01.001", "debet": 500000, "kredit": 0},
    {"perkiraan": "2.1.01.001", "debet": 0, "kredit": 500000}
  ]
}
EOF
```

### Step 2: Check Database State

```sql
-- Check DBTRANS
SELECT TOP 10 * FROM DBTRANS 
WHERE TipeTransHd IN ('BKM','BKK','BBM','BBK')
ORDER BY Tanggal DESC, NoBukti DESC

-- Check if NoBukti exists
SELECT * FROM DBTRANS WHERE NoBukti = '00001/BKK/00/202607'

-- Check DBTRANSAKSI
SELECT * FROM DBTRANSAKSI WHERE NoBukti = '00001/BKK/00/202607' ORDER BY Urut

-- Check if period is locked
SELECT * FROM DBLOCKPERIODE WHERE BULAN = 7 AND TAHUN = 2026

-- Check user's active period
SELECT * FROM DBPERIODE WHERE USERID = 'superadmin'

-- Check DBNOMOR counter
SELECT [ALIAS], [FORMAT1], [FORMAT2], [FORMAT3], [FORMAT4], [PEMISAH]
FROM DBNOMOR WHERE [ALIAS] = 'BKK'
```

### Step 3: Check Sub-Table Triggers

```sql
-- Check DBPOSTHUTPIUT for the perkiraan being used
SELECT * FROM DBPOSTHUTPIUT WHERE [Perkiraan] = '2.1.01.001'

-- Check if aktiva already exists (duplicate key risk)
SELECT * FROM DBAKTIVA WHERE [Devisi] = 'DVS01' AND [Perkiraan] = '1.1.02.001'
```

### Step 4: Verify NoBukti Uniqueness

```sql
-- Check for duplicate NoBukti (should never exist)
SELECT NoBukti, COUNT(*) as cnt FROM DBTRANS 
GROUP BY NoBukti HAVING COUNT(*) > 1

-- Check NoBukti format in DBTRANS
SELECT TOP 5 NoBukti, NOURUT, Tanggal, TipeTransHd 
FROM DBTRANS ORDER BY NoBukti DESC
```

### Step 5: Check Lock Status

```sql
-- Check if voucher is locked by otorisasi
SELECT NoBukti, Tanggal, IsOtorisasi1, IsOtorisasi2, 
       OtoUser1, TglOto1, IsOtorisasi3, OtoUser3
FROM DBTRANS WHERE NoBukti = '00001/BKK/00/202607'
```

---

## 12. SQL Query Quick Reference

### 12.1 Check All Tables for a NoBukti

```sql
-- 1. DBTRANS (header)
SELECT * FROM DBTRANS WHERE NoBukti = 'XXXXX'

-- 2. DBTRANSAKSI (details)
SELECT * FROM DBTRANSAKSI WHERE NoBukti = 'XXXXX' ORDER BY Urut

-- 3. DBHUTPIUT (hutang/piutang settlements)
SELECT * FROM DBHUTPIUT WHERE LTRIM(RTRIM(nobukti)) = 'XXXXX'

-- 4. DBAKTIVA (aktiva purchases)
SELECT * FROM DBAKTIVA WHERE [NoBuktiSem] = 'XXXXX'

-- 5. DBGIRO (giros opened by this voucher)
SELECT * FROM DBGIRO WHERE BuktiBuka = 'XXXXX'

-- 6. DBDEPOSITO (depositos opened by this voucher)
SELECT * FROM DBDEPOSITO WHERE BuktiBuka = 'XXXXX'

-- 7. DBTempHUTPIUT (staging rows)
SELECT * FROM DBTempHUTPIUT WHERE LTRIM(RTRIM(NoBukti)) = 'XXXXX'
```

### 12.2 Manual Fix: Rollback a Stuck NoBukti Counter

```sql
-- If NoBukti '00002/BKK/00/202607' exists but DBTRANS INSERT failed:
-- Decrement the counter so retry gets '00002' (not '00003')
UPDATE DBNOMOR SET [FORMAT1] = [FORMAT1] - 1 WHERE [ALIAS] = 'BKK'
```

### 12.3 Manual Fix: Delete Orphaned Voucher

```sql
-- Only if IsOtorisasi1 = 0 (not locked)
BEGIN TRANSACTION

-- Delete details first
DELETE FROM DBTRANSAKSI WHERE NoBukti = 'XXXXX'

-- Delete hutpiut
DELETE FROM DBHUTPIUT WHERE LTRIM(RTRIM(nobukti)) = 'XXXXX'

-- Delete temp hutpiut
DELETE FROM DBTempHUTPIUT WHERE LTRIM(RTRIM(NoBukti)) = 'XXXXX'

-- Delete open giros (not yet cair)
DELETE FROM DBGIRO WHERE BuktiBuka = 'XXXXX' AND TglCair IS NULL

-- Delete open depositos
DELETE FROM DBDEPOSITO WHERE BuktiBuka = 'XXXXX' AND TglCair IS NULL

-- Delete header last
DELETE FROM DBTRANS WHERE NoBukti = 'XXXXX'

COMMIT TRANSACTION
```

### 12.4 Check All Active Periods

```sql
SELECT * FROM DBPERIODE ORDER BY USERID

SELECT * FROM DBLOCKPERIODE ORDER BY TAHUN, BULAN
```

### 12.5 Trace Sub-Transaction Resolution

```sql
-- Check which perkiraan triggers which sub-form
SELECT 
    p.[Perkiraan],
    p.[Keterangan] AS 'Account Name',
    ph.[Kode] AS 'Trigger',
    ph.[TipeDK]
FROM DBPERKIRAAN p
LEFT JOIN DBPOSTHUTPIUT ph ON ph.[Perkiraan] = p.[Perkiraan]
WHERE ph.[Perkiraan] IS NOT NULL
ORDER BY ph.[Kode], p.[Perkiraan]
```

---

## Appendix: Field Map — SCreateKasBankRequest → Tables

```
SCreateKasBankRequest
├── Tanggal          → DBTRANS.Tanggal
├── TipeTransHd      → DBTRANS.TipeTransHd
├── PerkiraanHd      → DBTRANS.PerkiraanHd
├── Note             → DBTRANS.Note
├── TglJurnal        → DBTRANS.TglJurnal
├── NoJurnal         → DBTRANS.NoJurnal
├── NoBuktiSem       → DBTRANS.NoBuktiSem (raw SQL UPDATE)
├── Devisi           → DBTRANSAKSI.Devisi (each row)
├── NoBon            → DBTRANS.Nobon (raw SQL UPDATE) + DBTRANSAKSI.Nobon (each row)
├── TPHC             → DBTRANSAKSI.TPHC (each row)
│
├── Details[] (SDetailInput)
│   ├── Perkiraan    → DBTRANSAKSI.Perkiraan
│   ├── Lawan        → DBTRANSAKSI.Lawan
│   ├── Debet         → DBTRANSAKSI.Debet / DebetRp
│   ├── Kredit       → DBTRANSAKSI.Kredit / KreditRp
│   ├── Valas        → DBTRANSAKSI.Valas
│   ├── Kurs         → DBTRANSAKSI.Kurs
│   ├── Keterangan   → DBTRANSAKSI.Keterangan
│   ├── TPHC         → DBTRANSAKSI.TPHC
│   ├── KodeBag       → DBTRANSAKSI.KodeBag
│   ├── KodeCustSupp → DBTRANSAKSI.CustSuppP
│   ├── CustSuppL    → DBTRANSAKSI.CustSuppL
│   ├── NoAktivaP    → DBTRANSAKSI.NoAktivaP
│   ├── NoAktivaL    → DBTRANSAKSI.NoAktivaL
│   └── XSusut       → (OMIT from INSERT)
│
├── GiroList[] (SDBGIRO)
│   └── All fields   → DBGIRO (BuktiBuka set to noBukti)
│
├── DepositoList[] (SDBDEPOSITO)
│   └── All fields   → DBDEPOSITO (BuktiBuka set to noBukti)
│
├── HutPiutList[] (SDBHUTPIUT)
│   ├── NoFaktur     → DBHUTPIUT.NoFaktur (PK component)
│   ├── NoMsk        → DBHUTPIUT.NoMsk (PK component)
│   ├── Urut         → DBHUTPIUT.Urut (PK component)
│   ├── Tanggal      → (from header)
│   ├── TipeTrans    → DBHUTPIUT.TipeTrans (PK component)
│   ├── KodeCustSupp → DBHUTPIUT.KodeCustSupp (PK component)
│   ├── Perkiraan    → DBHUTPIUT.Perkiraan (PK component)
│   └── NoBukti      → Set to header noBukti
│
└── AktivaList[] (SDBAKTIVA)
    ├── Devisi       → DBAKTIVA.Devisi (PK component)
    ├── Perkiraan    → DBAKTIVA.Perkiraan (PK component)
    ├── Tanggal      → DBAKTIVA.Tanggal
    └── NoBuktiSem   → Set to header noBukti
```
