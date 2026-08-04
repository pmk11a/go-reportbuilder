# KasBank Database Save Flow - Debug Reference

> **Document Purpose:** Help debug database save issues for KasBank module (BKM/BKK/BBM/BBK vouchers)
> **Date:** 2026-07-25
> **Status:** Reference Documentation

---

## Table of Contents

1. [Save Flow Overview](#1-save-flow-overview)
2. [DBTRANS (Header)](#2-dbtrans-header)
3. [DBTRANSAKSI (Detail)](#3-dbtransaksi-detail)
4. [DBHUTPIUT (Hutang/Piutang)](#4-dbhutpiut-hutangpiutang)
5. [DBAKTIVA (Fixed Assets)](#5-dbaktiva-fixed-assets)
6. [DBGIRO & DBDEPOSITO](#6-dbgiro--dbdeposito)
7. [Common Debugging Checklist](#7-common-debugging-checklist)

---

## 1. Save Flow Overview

### Transaction Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CREATE (Insert New)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Validate double-entry (sum Debet == sum Kredit)                       │
│         ↓                                                               │
│  2. Generate NoBukti via DBNOMOR (UPDLOCK/HOLDLOCK)                      │
│         ↓                                                               │
│  3. Insert DBTRANS (header)                                              │
│         ↓                                                               │
│  4. Update DBTRANS extra fields (NoBuktiSem, Nobon) via raw SQL          │
│         ↓                                                               │
│  5. Insert DBTRANSAKSI (details) - batch insert                          │
│         ↓                                                               │
│  6. Re-validate double-entry totals                                     │
│         ↓                                                               │
│  7. Insert DBGIRO (if GiroList present)                                 │
│         ↓                                                               │
│  8. Insert DBDEPOSITO (if DepositoList present)                         │
│         ↓                                                               │
│  9. Insert DBHUTPIUT (if HutPiutList present)                           │
│         ↓                                                               │
│ 10. Insert DBAKTIVA (if AktivaList present)                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         UPDATE (Edit Existing)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Check IsOtorisasi1 != 1 (reject if locked)                          │
│         ↓                                                               │
│  2. Validate date not in locked period                                  │
│         ↓                                                               │
│  3. Update DBTRANS header fields                                        │
│         ↓                                                               │
│  4. Update DBTRANS extra fields via raw SQL                            │
│         ↓                                                               │
│  5. DELETE existing DBTRANSAKSI rows for NoBukti                        │
│         ↓                                                               │
│  6. INSERT new DBTRANSAKSI rows (batch)                                │
│         ↓                                                               │
│  7. Re-validate double-entry totals                                    │
│         ↓                                                               │
│  8. INSERT new DBGIRO rows                                             │
│         ↓                                                               │
│  9. INSERT new DBDEPOSITO rows                                         │
│         ↓                                                               │
│ 10. INSERT new DBHUTPIUT rows                                           │
│         ↓                                                               │
│ 11. INSERT new DBAKTIVA rows                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Entry Points

| Operation | HTTP Method | Endpoint | Service Method |
|-----------|------------|----------|----------------|
| Create Header | `POST` | `/api/accounting/kasbank` | `CreateHeader()` |
| Update Header | `PUT` | `/api/accounting/kasbank?noBukti=X` | `UpdateHeader()` |
| Delete Header | `DELETE` | `/api/accounting/kasbank?noBukti=X` | `DeleteHeader()` |
| Add Detail | `POST` | `/api/accounting/kasbank/:noBukti/detail` | `AddDetail()` |
| Update Detail | `PUT` | `/api/accounting/kasbank/:noBukti/detail/:urut` | `UpdateDetail()` |
| Delete Detail | `DELETE` | `/api/accounting/kasbank/:noBukti/detail/:urut` | `DeleteDetail()` |

---

## 2. DBTRANS (Header)

### Database Schema

```sql
CREATE TABLE DBTRANS (
    NoBukti       VARCHAR(30) PRIMARY KEY,      -- Voucher number (auto-generated)
    NOURUT        VARCHAR(10) PRIMARY KEY,      -- Sequence counter
    Tanggal       DATETIME,                    -- Journal date
    Note          VARCHAR(500),                -- Description / "Kode Project"
    Lampiran      VARCHAR(50),                 -- Attachments
    
    -- Authorization fields (5 levels)
    IsOtorisasi1  BIT DEFAULT 0,
    OtoUser1      VARCHAR(15),
    TglOto1       DATETIME,
    IsOtorisasi2  BIT DEFAULT 0,
    OtoUser2      VARCHAR(15),
    TglOto2       DATETIME,
    IsOtorisasi3  BIT DEFAULT 0,
    OtoUser3      VARCHAR(15),
    TglOto3       DATETIME,
    IsOtorisasi4  BIT DEFAULT 0,
    OtoUser4      VARCHAR(15),
    TglOto4       DATETIME,
    IsOtorisasi5  BIT DEFAULT 0,
    OtoUser5      VARCHAR(15),
    TglOto5       DATETIME,
    
    -- Transaction metadata
    Simbol        VARCHAR(10),
    TipeTransHd   VARCHAR(10),                 -- BKM, BKK, BBM, BBK
    PerkiraanHd   VARCHAR(20),                -- Cash/bank account code
    FlagSimbol    VARCHAR(2),
    MaxOL         INT DEFAULT 2,              -- Max authorization level
    NoJurnal      VARCHAR(30),
    NoUrutJurnal  VARCHAR(5),
    TglJurnal     DATETIME,
    Flagtipe      INT,
    
    -- Extra fields (written via raw SQL)
    NoBuktiSem    VARCHAR(30),                -- Reference invoice number
    Nobon         VARCHAR(20)                -- External reference
)
```

### GORM Model

```go
// File: backend/internal/infrastructure/persistence/models/dbtrans.go

type SDBTRANS struct {
    NoBukti       string     `gorm:"column:NoBukti;primaryKey;size:30"`
    NOURUT        string     `gorm:"column:NOURUT;primaryKey;size:10"`
    Tanggal       *time.Time `gorm:"column:Tanggal"`
    Note          string     `gorm:"column:Note;size:500"`
    Lampiran      string     `gorm:"column:Lampiran;size:50"`
    
    // Otorisasi 1-5
    IsOtorisasi1  bool       `gorm:"column:IsOtorisasi1"`
    OtoUser1      string     `gorm:"column:OtoUser1;size:15"`
    TglOto1       *time.Time `gorm:"column:TglOto1"`
    // ... (same pattern for levels 2-5)
    
    TipeTransHd   *string    `gorm:"column:TipeTransHd;size:10"`
    PerkiraanHd   *string    `gorm:"column:PerkiraanHd;size:20"`
    MaxOL         int        `gorm:"column:MaxOL"`
    NoJurnal      *string    `gorm:"column:NoJurnal;size:30"`
    TglJurnal     *time.Time `gorm:"column:TglJurnal"`
    
    // Extra fields (excluded from GORM scan)
    NoBuktiSem    *string    `gorm:"column:NoBuktiSem;->;<-:false"`
    Nobon         *string    `gorm:"column:Nobon;->;<-:false"`
}
```

### CREATE Header - Data Mapping

```go
// Source: SCreateKasBankRequest (dto.go)
// Target: SDbTrans (service.go CreateHeader)

h := &SDbTrans{
    NoBukti:     noBukti,              // Generated from DBNOMOR
    NOURUT:      result.Seq,           // Sequence from DBNOMOR
    Tanggal:     &tanggal,            // Validated against DBPERIODE
    Note:        req.Note,
    TipeTransHd: strPtr(req.TipeTransHd),
    PerkiraanHd: strPtrOrNil(req.PerkiraanHd),
    NoJurnal:    strPtrOrNil(req.NoJurnal),
}
```

### UPDATE Header - Extra Fields (Raw SQL)

```go
// Extra fields written via raw SQL (NoBuktiSem, Nobon exist in DB but excluded from GORM model)
extraFields := make(map[string]string)
if req.NoBuktiSem != "" {
    extraFields["NoBuktiSem"] = req.NoBuktiSem
}
if req.NoBon != "" {
    extraFields["Nobon"] = req.NoBon
}

if len(extraFields) > 0 {
    setParts := []string{}
    setArgs := []any{}
    for k, v := range extraFields {
        setParts = append(setParts, k+"=?")
        setArgs = append(setArgs, v)
    }
    setArgs = append(setArgs, noBukti)
    tx.Exec(fmt.Sprintf("UPDATE DBTRANS SET %s WHERE NoBukti=?", 
        strings.Join(setParts, ",")), setArgs...)
}
```

### Debug Points - DBTRANS

| Field | Source (Request) | Required | Validation |
|-------|-----------------|----------|------------|
| `NoBukti` | Auto-generated | Yes | Must be unique |
| `NOURUT` | DBNOMOR sequence | Yes | Auto-increment |
| `Tanggal` | `req.Tanggal` | Yes | Must be in user's DBPERIODE |
| `TipeTransHd` | `req.tipeTransHd` | Yes | Must be BKM/BKK/BBM/BBK |
| `Note` | `req.note` | No | Free text |
| `NoBuktiSem` | `req.noBuktiSem` | No | Written via raw SQL |
| `Nobon` | `req.nobon` | No | Written via raw SQL |

---

## 3. DBTRANSAKSI (Detail)

### Database Schema

```sql
CREATE TABLE DBTRANSAKSI (
    NoBukti       VARCHAR(30),                 -- FK to DBTRANS
    Tanggal       DATETIME,
    Devisi        VARCHAR(15),                 -- Business unit (from header)
    Note          VARCHAR(500),
    Lampiran      FLOAT,
    Perkiraan     VARCHAR(25),                 -- Account code (REQUIRED)
    Lawan         VARCHAR(25),                 -- Contra-account
    Keterangan    VARCHAR(8000),
    Keterangan2   VARCHAR(8000),
    Debet         FLOAT,
    Kredit        FLOAT,
    Valas         VARCHAR(15),                 -- Currency code (IDR, USD, etc.)
    Kurs          FLOAT DEFAULT 1.0,
    DebetRp       FLOAT,                       -- Debet * Kurs
    KreditRp      FLOAT,                       -- Kredit * Kurs
    TipeTrans     VARCHAR(3),                  -- BKM/BKK/BBM/BBK
    TPHC          VARCHAR(1),                  -- Payment method: C/T/H/P
    CustSuppP     VARCHAR(15),                 -- Customer/Supplier for Perkiraan side
    CustSuppL     VARCHAR(15),                 -- Customer/Supplier for Lawan side
    Urut          INT,                         -- Line sequence (1, 2, 3...)
    KodeP         VARCHAR(15),                 -- Sub-trans code (from DBPOSTHUTPIUT)
    KodeL         VARCHAR(15),
    NoAktivaP     VARCHAR(30),                 -- Fixed asset number (Perkiraan side)
    NoAktivaL     VARCHAR(30),                 -- Fixed asset number (Lawan side)
    StatusAktivaP VARCHAR(5),                 -- AKV+/AKM+/AKV-/AKM-
    StatusAktivaL VARCHAR(5),
    Nobon         VARCHAR(20),
    KodeBag       VARCHAR(15),                 -- Project/SPK code
    StatusGiro    VARCHAR(2),                  -- P+/P-/H+/H-
    XSusut        INT,                         -- Depreciation periods
    PerlakuanAktiva INT,                       -- 0=normal, 1=Jual, 2=Keluar
    FlagSimbol    VARCHAR(2),
    PRIMARY KEY (NoBukti, Urut, FlagSimbol)
)
```

### GORM Model

```go
// File: backend/internal/infrastructure/persistence/models/dbtransaksi.go

type SDBTRANSAKSI struct {
    NoBukti       string     `gorm:"column:NoBukti;primaryKey;size:30"`
    Tanggal       *time.Time `gorm:"column:Tanggal"`
    Devisi        string     `gorm:"column:Devisi;size:15"`
    Perkiraan     string     `gorm:"column:Perkiraan;size:25"`
    Lawan         string     `gorm:"column:Lawan;size:25"`
    Keterangan    string     `gorm:"column:Keterangan;size:8000"`
    Debet         float64    `gorm:"column:Debet"`
    Kredit        float64    `gorm:"column:Kredit"`
    Valas         string     `gorm:"column:Valas;size:15"`
    Kurs          float64    `gorm:"column:Kurs"`
    DebetRp       float64    `gorm:"column:DebetRp"`
    KreditRp      float64    `gorm:"column:KreditRp"`
    TipeTrans     string     `gorm:"column:TipeTrans;size:3"`
    TPHC          string     `gorm:"column:TPHC;size:1"`
    CustSuppP     string     `gorm:"column:CustSuppP;size:15"`
    CustSuppL     string     `gorm:"column:CustSuppL;size:15"`
    Urut          int        `gorm:"column:Urut;primaryKey"`
    KodeP         string     `gorm:"column:KodeP;size:15"`
    KodeL         string     `gorm:"column:KodeL;size:15"`
    NoAktivaP     string     `gorm:"column:NoAktivaP;size:30"`
    NoAktivaL     string     `gorm:"column:NoAktivaL;size:30"`
    StatusAktivaP string     `gorm:"column:StatusAktivaP;size:5"`
    StatusAktivaL string     `gorm:"column:StatusAktivaL;size:5"`
    Nobon         string     `gorm:"column:Nobon;size:20"`
    KodeBag       string     `gorm:"column:KodeBag;size:15"`
    StatusGiro    string     `gorm:"column:StatusGiro;size:2"`
    FlagSimbol    string     `gorm:"column:FlagSimbol;primaryKey;size:2"`
}
```

### CREATE Details - Data Mapping

```go
// Source: SDetailInput (dto.go)
// Target: SDbTransaksi (service.go buildDetailRow)

row := &SDbTransaksi{
    NoBukti:    noBukti,
    Tanggal:    h.Tanggal,                    // From header
    Perkiraan:  d.Perkiraan,                   // REQUIRED
    Lawan:      d.Lawan,
    Debet:      d.Debet,
    Kredit:     d.Kredit,
    Valas:      valas,                         // Default "IDR"
    Kurs:       d.Kurs,                       // Default 1.0
    DebetRp:    d.Debet * d.Kurs,             // Valas conversion
    KreditRp:   d.Kredit * d.Kurs,
    Keterangan: d.Keterangan,
    TipeTrans:  tipeTrans,                    // From header
    TPHC:       headerTPHC,                   // From header
    KodeBag:    d.KodeBag,
    CustSuppP:  d.KodeCustSupp,               // From detail input
    CustSuppL:  d.CustSuppL,
    Urut:       urut,                          // Auto: i+1
    Devisi:     headerDevisi,                 // From header
    Nobon:      headerNoBon,                   // From header
}
```

### Sub-Transaction Resolution (buildDetailRow)

```go
// Resolves KodeP, KodeL, StatusAktivaP, StatusAktivaL
// Based on Perkiraan code in DBPOSTHUTPIUT

subRes, err := s.ResolveSubTransaction(ctx, d.Perkiraan, dkVal)
// dkVal = "D" if Debet > 0, else "K"

if subRes != nil {
    row.KodeP = subRes.Kode
    row.KodeL = subRes.Kode
    
    if subRes.Trigger == "aktiva" {
        row.StatusAktivaP = subRes.StatusP
        row.StatusAktivaL = subRes.StatusL
    }
}
```

### StatusGiro Calculation

```go
func calculateStatusGiro(tphc string, mode string) string {
    if tphc == "P" {
        if mode == "BKM" || mode == "BBM" {
            return "P+"  // Piutang Giro masuk
        } else {
            return "P-"  // Piutang Giro keluar
        }
    } else if tphc == "H" {
        if mode == "BKM" || mode == "BBM" {
            return "H+"  // Hutang Giro masuk
        } else {
            return "H-"  // Hutang Giro keluar
        }
    }
    return ""
}
```

### UPDATE - Detail Replacement

```go
// Step 1: Delete all existing detail rows
tx.Where("NoBukti = ?", noBukti).Delete(&SDbTransaksi{})

// Step 2: Insert new detail rows (batch)
rows := make([]*SDbTransaksi, 0, len(req.Details))
for i, d := range req.Details {
    urut := i + 1
    row := buildDetailRow(ctx, s, noBukti, urut, d, ...)
    rows = append(rows, row)
}
tx.Omit("XSusut", "PerlakuanAktiva").Create(rows)
```

### Debug Points - DBTRANSAKSI

| Field | Source | Required | Validation |
|-------|--------|----------|------------|
| `NoBukti` | Header | Yes | FK to DBTRANS |
| `Urut` | Auto (1,2,3...) | Yes | Unique per NoBukti |
| `Perkiraan` | `d.perkiraan` | Yes | Must exist in DBPERKIRAAN |
| `Debet` OR `Kredit` | `d.debet` / `d.kredit` | Yes | One must be > 0, other = 0 |
| `Valas` | `d.valas` | No | Default "IDR" |
| `Kurs` | `d.kurs` | No | Default 1.0 |
| `DebetRp` | `Debet * Kurs` | Yes | Auto-calculated |
| `KreditRp` | `Kredit * Kurs` | Yes | Auto-calculated |
| `TPHC` | Header | No | C/T/H/P |
| `KodeBag` | `d.kodebag` | No | Project/SPK code |

---

## 4. DBHUTPIUT (Hutang/Piutang)

### Database Schema

```sql
CREATE TABLE DBHUTPIUT (
    NoFaktur      VARCHAR(30),                -- Invoice number (PRIMARY KEY)
    NoRetur       VARCHAR(30),                -- Return number (PRIMARY KEY)
    TipeTrans     VARCHAR(3),                 -- BKM/BKK/BBM/BBK (PRIMARY KEY)
    KodeCustSupp  VARCHAR(15),                -- Customer/Supplier code (PRIMARY KEY)
    NoBukti       VARCHAR(30),                -- Voucher reference (PRIMARY KEY)
    NoMsk         INT,                        -- Payment sequence (PRIMARY KEY)
    Urut          INT,                        -- Line number (PRIMARY KEY)
    Tanggal       DATETIME,                   -- Transaction date
    JatuhTempo    DATETIME,                   -- Due date
    Debet         FLOAT,                      -- Outstanding amount (positive)
    Kredit        FLOAT,                      -- Payment amount (negative)
    Saldo         FLOAT,                      -- Computed: (computed)
    Valas         VARCHAR(15),                -- Currency
    Kurs          FLOAT,
    DebetD        FLOAT,                      -- Valas debit
    KreditD       FLOAT,                      -- Valas credit
    SaldoD        FLOAT,                      -- Valas balance
    KodeSales     VARCHAR(15),                -- Salesperson code
    Tipe          VARCHAR(4),                 -- HT/PT/UHT/UPT (PRIMARY KEY)
    Perkiraan     VARCHAR(25),                -- Account code (PRIMARY KEY)
    Catatan       VARCHAR(800),
    NOINVOICE     VARCHAR(50),
    TGLINVOICE    DATETIME,
    NOPAJAK       VARCHAR(50),
    TGLFPJ        DATETIME,
    TipeDK        VARCHAR(1),                 -- D or K (direction)
    -- Otorisasi fields...
    PRIMARY KEY (NoFaktur, NoRetur, TipeTrans, KodeCustSupp, NoBukti, NoMsk, Urut, Tipe, Perkiraan)
)
```

### GORM Model

```go
// File: backend/internal/infrastructure/persistence/models/dbhutpiut.go

type SDBHUTPIUT struct {
    NoFaktur     string     `gorm:"column:NoFaktur;primaryKey;size:30"`
    NoRetur      string     `gorm:"column:NoRetur;primaryKey;size:30"`
    TipeTrans    string     `gorm:"column:TipeTrans;primaryKey;size:3"`
    KodeCustSupp string     `gorm:"column:KodeCustSupp;primaryKey;size:15"`
    NoBukti      string     `gorm:"column:NoBukti;primaryKey;size:30"`
    NoMsk        int        `gorm:"column:NoMsk;primaryKey"`
    Urut         int        `gorm:"column:Urut;primaryKey"`
    Tanggal      *time.Time `gorm:"column:Tanggal"`
    JatuhTempo   *time.Time `gorm:"column:JatuhTempo"`
    Debet        float64    `gorm:"column:Debet"`
    Kredit       float64    `gorm:"column:Kredit"`
    Valas        string     `gorm:"column:Valas;size:15"`
    Kurs         float64    `gorm:"column:Kurs"`
    DebetD       float64    `gorm:"column:DebetD"`
    KreditD      float64    `gorm:"column:KreditD"`
    Tipe         string     `gorm:"column:Tipe;primaryKey;size:4"`  // HT/PT/UHT/UPT
    Perkiraan    string     `gorm:"column:Perkiraan;primaryKey;size:25"`
    Catatan      string     `gorm:"column:Catatan;size:800"`
    TipeDK       string     `gorm:"column:TipeDK;size:1;->;<-:false"`  // D or K
}
```

### CREATE/INSERT - HutPiut Data Mapping

```go
// Source: SCreateKasBankRequest.HutPiutList ([]models.SDBHUTPIUT)
// Target: DBHUTPIUT table

// Step 1: Ensure NoBukti is set on all items
for _, hp := range req.HutPiutList {
    hp.NoBukti = noBukti  // Set the voucher reference
}

// Step 2: Batch insert
for _, hp := range req.HutPiutList {
    if err := tx.Create(&hp).Error; err != nil {
        return fmt.Errorf("inserting hutpiut payment for invoice %q: %w", hp.NoFaktur, err)
    }
}
```

### UPDATE - HutPiut Data Mapping

```go
// For UPDATE, it's the same - just INSERT new rows
// Note: No DELETE of existing DBHUTPIUT is performed
// This means old payments persist (they should be per voucher)

for _, hp := range req.HutPiutList {
    hp.NoBukti = noBukti
    if err := tx.Create(&hp).Error; err != nil {
        return fmt.Errorf("updating hutpiut payment for invoice %q: %w", hp.NoFaktur, err)
    }
}
```

### HutPiut Sub-Transaction Codes (DBPOSTHUTPIUT)

| Kode | Description | StatusP (DK=D) | StatusL (DK=K) | Trigger |
|------|-------------|----------------|----------------|---------|
| PT | Piutang | PT+ | PT- | hutpiut |
| HT | Hutang | HT- | HT+ | hutpiut |
| UPT | Update Piutang | UPT- | UPT+ | hutpiut |
| UHT | Update Hutang | UHT+ | UHT- | hutpiut |
| DP | Giro | DP+ | DP- | giro (if enabled) |

### Debug Points - DBHUTPIUT

| Field | Source | Required | Notes |
|-------|--------|----------|-------|
| `NoFaktur` | FE submission | Yes | Invoice number |
| `NoRetur` | FE submission | Yes | Usually "" for new |
| `TipeTrans` | Header | Yes | BKM/BKK/BBM/BBK |
| `KodeCustSupp` | FE selection | Yes | Customer/Supplier code |
| `NoBukti` | Header | Yes | Auto-set from header |
| `NoMsk` | FE submission | Yes | Payment sequence |
| `Urut` | FE submission | Yes | Line number |
| `Tipe` | FE selection | Yes | HT/PT/UHT/UPT |
| `Perkiraan` | FE selection | Yes | Account code |
| `Debet` | FE submission | Yes | Outstanding balance |
| `Kredit` | FE submission | Yes | Payment amount |
| `TipeDK` | Auto | No | D or K (direction) |

---

## 5. DBAKTIVA (Fixed Assets)

### Database Schema

```sql
CREATE TABLE DBAKTIVA (
    Devisi        VARCHAR(15),                 -- Business unit (PRIMARY KEY)
    Perkiraan     VARCHAR(30),                 -- Asset account code (PRIMARY KEY)
    Keterangan    VARCHAR(500),                -- Description
    Quantity      FLOAT,                       -- Quantity
    Persen        FLOAT,                       -- Percentage
    Tanggal       DATETIME,                    -- Acquisition date
    Tipe          VARCHAR(50),                 -- Type
    Kodebag       VARCHAR(15),                -- Department/SPK code
    Akumulasi     VARCHAR(25),                -- Accumulated depreciation account
    NoMuka        VARCHAR(25),                -- Main asset number
    NoBelakang    VARCHAR(20),               -- Sub asset number
    Biaya         VARCHAR(25),                -- Depreciation expense account
    PersenBiaya1  FLOAT,                      -- Depreciation % for Biaya1
    Biaya2        VARCHAR(25),
    PersenBiaya2  FLOAT,
    Biaya3        VARCHAR(25),
    Persenbiaya3  FLOAT,
    Biaya4        VARCHAR(25),
    Persenbiaya4  FLOAT,
    TipeAktiva    INT,                        -- Asset type
    NoBelakang2   VARCHAR(20),
    NoAktivaHd    VARCHAR(35),                -- Main fixed asset number
    Kelompok      INT,                        -- Group
    GroupAktiva   VARCHAR(15),               -- Asset group code
    NoBuktiSem    VARCHAR(30)                -- Reference voucher
)
```

### GORM Model

```go
// File: backend/internal/infrastructure/persistence/models/dbaktiva.go

type SDBAKTIVA struct {
    Devisi        string     `gorm:"column:Devisi;primaryKey;size:15"`
    Perkiraan     string     `gorm:"column:Perkiraan;primaryKey;size:30"`
    Keterangan    string     `gorm:"column:Keterangan;size:500"`
    Quantity      float64    `gorm:"column:Quantity"`
    Persen        float64    `gorm:"column:Persen"`
    Tanggal       *time.Time `gorm:"column:Tanggal"`
    Tipe          string     `gorm:"column:Tipe;size:50"`
    Kodebag       string     `gorm:"column:Kodebag;size:15"`
    Akumulasi     string     `gorm:"column:Akumulasi;size:25"`
    NoMuka        string     `gorm:"column:NoMuka;size:25"`
    NoBelakang    string     `gorm:"column:NoBelakang;size:20"`
    Biaya         string     `gorm:"column:Biaya;size:25"`
    PersenBiaya1  float64    `gorm:"column:PersenBiaya1"`
    Biaya2        string     `gorm:"column:Biaya2;size:25"`
    PersenBiaya2  float64    `gorm:"column:PersenBiaya2"`
    Biaya3        string     `gorm:"column:biaya3;size:25"`
    Persenbiaya3  float64    `gorm:"column:persenbiaya3"`
    Biaya4        string     `gorm:"column:biaya4;size:25"`
    Persenbiaya4  float64    `gorm:"column:persenbiaya4"`
    TipeAktiva    int        `gorm:"column:TipeAktiva"`
    NoBelakang2   *string    `gorm:"column:NoBelakang2;size:20"`
    NoAktivaHd    *string    `gorm:"column:NoAktivaHd;size:35"`
    Kelompok      int        `gorm:"column:Kelompok"`
    GroupAktiva   string     `gorm:"column:GroupAktiva;size:15"`
    NoBuktiSem    *string    `gorm:"column:NoBuktiSem;size:30"`
}
```

### CREATE/INSERT - Aktiva Data Mapping

```go
// Source: SCreateKasBankRequest.AktivaList ([]models.SDBAKTIVA)
// Target: DBAKTIVA table

for _, aktiva := range req.AktivaList {
    aktiva.NoBuktiSem = &noBukti  // Set reference to voucher
    
    // If Tanggal is missing, use header date
    if aktiva.Tanggal == nil {
        aktiva.Tanggal = &tanggal
    }
    
    if err := tx.Create(&aktiva).Error; err != nil {
        return fmt.Errorf("inserting aktiva %q: %w", aktiva.Perkiraan, err)
    }
}
```

### Aktiva Sub-Transaction Codes

| Kode | Description | StatusP (DK=D) | StatusL (DK=K) | Trigger |
|------|-------------|----------------|----------------|---------|
| AKV | Aktiva Tetap | AKV+ | AKV- | aktiva |
| AKM | Akumulasi Penyusutan | AKM+ | AKM- | aktiva |

### Debug Points - DBAKTIVA

| Field | Source | Required | Notes |
|-------|--------|----------|-------|
| `Devisi` | `aktiva.Devisi` | Yes | Business unit |
| `Perkiraan` | `aktiva.Perkiraan` | Yes | Asset account code |
| `NoMuka` | `aktiva.NoMuka` | Yes | Main asset number (auto-generated) |
| `NoBelakang` | `aktiva.NoBelakang` | No | Sub asset number |
| `Keterangan` | `aktiva.Keterangan` | No | Description |
| `Tanggal` | `aktiva.Tanggal` or Header | Yes | Acquisition date |
| `Akumulasi` | `aktiva.Akumulasi` | No | Depreciation account |
| `Biaya` | `aktiva.Biaya` | No | Expense account |
| `PersenBiaya1` | `aktiva.PersenBiaya1` | No | Depreciation % |
| `Kodebag` | `aktiva.Kodebag` | No | Department code |
| `NoBuktiSem` | Header | No | Reference voucher (auto-set) |

---

## 6. DBGIRO & DBDEPOSITO

### DBGIRO Schema

```sql
CREATE TABLE DBGIRO (
    NoGiro        VARCHAR(50) PRIMARY KEY,
    Bank          VARCHAR(50),
    Nominal       FLOAT,
    TglTerbit     DATETIME,
    TglJatuhTempo DATETIME,
    TglGiro       DATETIME,
    StatusGiro    VARCHAR(5),                  -- P+/P-/H+/H-
    Tipe          VARCHAR(5),                  -- PT or HT
    Keterangan    VARCHAR(500),
    KeteranganCair VARCHAR(500),
    KodeVls       VARCHAR(10),                 -- Currency
    Kurs          FLOAT,
    Debet         FLOAT,
    Kredit        FLOAT,
    DebetRp       FLOAT,
    KreditRp      FLOAT,
    Jumlah        FLOAT,
    JumlahRp      FLOAT,
    BuktiBuka     VARCHAR(30),                -- Opening voucher
    urutBuktiBuka INT,
    TglBuka       DATETIME,
    BuktiCair     VARCHAR(30),                -- Settlement voucher (NULL until cair)
    urutBuktiCair INT,
    TglCair       DATETIME,
    KAS           VARCHAR(25)
)
```

### DBDEPOSITO Schema

```sql
CREATE TABLE DBDEPOSITO (
    NoDeposito    VARCHAR(50) PRIMARY KEY,
    Bank          VARCHAR(50),
    Nominal       FLOAT,
    Bunga         FLOAT,
    TglBuka       DATETIME,
    TglJatuhTempo DATETIME,
    TglCair       DATETIME,
    StatusDeposito VARCHAR(5),                -- DP+/DP-
    Keterangan    VARCHAR(500),
    KeteranganCair VARCHAR(500),
    KodeVls       VARCHAR(10),
    Kurs          FLOAT,
    Debet         FLOAT,
    Kredit        FLOAT,
    DebetRp       FLOAT,
    KreditRp      FLOAT,
    Jumlah        FLOAT,
    JumlahRp      FLOAT,
    BuktiBuka     VARCHAR(30),
    urutBuktiBuka INT,
    BuktiCair     VARCHAR(30),
    urutBuktiCair INT
)
```

### CREATE/INSERT - Giro & Deposito

```go
// Giro
for _, g := range req.GiroList {
    if err := tx.Create(&g).Error; err != nil {
        return fmt.Errorf("inserting giro %q: %w", g.NoGiro, err)
    }
}

// Deposito
for _, d := range req.DepositoList {
    if err := tx.Create(&d).Error; err != nil {
        return fmt.Errorf("inserting deposito %q: %w", d.NoDeposito, err)
    }
}
```

---

## 7. Common Debugging Checklist

### 7.1 Header Save Fails

```
[ ] Check Tanggal is within user's DBPERIODE
[ ] Check TipeTransHd is BKM/BKK/BBM/BBK
[ ] Check Devisi is provided (required)
[ ] Check user has active period in DBPERIODE
[ ] Check period is not locked in DBLOCKPERIODE
[ ] Check NoBukti doesn't already exist
```

### 7.2 Detail Save Fails

```
[ ] Check sum(Debet) == sum(Kredit) (double-entry)
[ ] Check Perkiraan exists in DBPERKIRAAN
[ ] Check Debet and Kredit are not both > 0
[ ] Check no negative values
[ ] Check Urut values are unique within NoBukti
```

### 7.3 Sub-Transaction Save Fails

```
[ ] DBHUTPIUT: Check composite primary key (NoFaktur, NoRetur, TipeTrans, KodeCustSupp, NoBukti, NoMsk, Urut, Tipe, Perkiraan)
[ ] DBHUTPIUT: Check Perkiraan exists in DBPERKIRAAN
[ ] DBHUTPIUT: Check KodeCustSupp exists in DBCUSTSUPP
[ ] DBAKTIVA: Check composite primary key (Devisi, Perkiraan)
[ ] DBAKTIVA: Check Akumulasi exists in DBPERKIRAAN (if provided)
[ ] DBAKTIVA: Check Biaya exists in DBPERKIRAAN with Tipe=1 (if provided)
[ ] DBGIRO: Check NoGiro doesn't already exist
[ ] DBDEPOSITO: Check NoDeposito doesn't already exist
```

### 7.4 SQL Server 2008 R2 Compatibility

```
[ ] Use [brackets] for column names with spaces: [No Bukti]
[ ] Use [brackets] for reserved words
[ ] Use (UPDLOCK, HOLDLOCK) for sequence number generation
[ ] No LIMIT/OFFSET - use TOP or ROW_NUMBER()
[ ] Date format: YYYY-MM-DD or parameterized
```

### 7.5 Debug Queries

```sql
-- Check DBTRANS inserted
SELECT * FROM DBTRANS WHERE NoBukti = 'BKM-2026-001';

-- Check DBTRANSAKSI inserted
SELECT * FROM DBTRANSAKSI WHERE NoBukti = 'BKM-2026-001' ORDER BY Urut;

-- Check DBHUTPIUT inserted
SELECT * FROM DBHUTPIUT WHERE NoBukti = 'BKM-2026-001';

-- Check DBAKTIVA inserted
SELECT * FROM DBAKTIVA WHERE NoBuktiSem = 'BKM-2026-001';

-- Check DBGIRO inserted
SELECT * FROM DBGIRO WHERE BuktiBuka = 'BKM-2026-001';

-- Check DBDEPOSITO inserted
SELECT * FROM DBDEPOSITO WHERE BuktiBuka = 'BKM-2026-001';

-- Double-entry check
SELECT 
    SUM(Debet) AS TotalDebet,
    SUM(Kredit) AS TotalKredit,
    SUM(Debet) - SUM(Kredit) AS Difference
FROM DBTRANSAKSI 
WHERE NoBukti = 'BKM-2026-001';

-- Outstanding HutPiut check (should have Debet != Kredit)
SELECT 
    NoFaktur,
    SUM(Debet) AS TotalDebet,
    SUM(Kredit) AS TotalKredit,
    SUM(Debet) - SUM(Kredit) AS Saldo
FROM DBHUTPIUT 
WHERE KodeCustSupp = 'CUST001' AND Perkiraan = '1101'
GROUP BY NoFaktur
HAVING SUM(Debet) != SUM(Kredit);
```

### 7.6 Error Mapping

| Service Error | HTTP Code | Cause |
|--------------|-----------|-------|
| `ErrTanggalDiLuarPeriode` | 400 | Date outside user's active period |
| `ErrPeriodeLocked` | 400 | Period is locked |
| `ErrTipeInvalid` | 400 | Invalid voucher type |
| `ErrLockedByOtorisasi1` | 400 | Cannot edit locked voucher |
| `ErrDoubleEntryUnbalanced` | 400 | Debet != Kredit |
| `ErrDetailRequired` | 400 | No detail rows provided |
| `ErrNotFound` | 404 | Voucher not found |
| `ErrNoBuktiEmpty` | 400 | NoBukti is empty |

---

## Appendix A: Request DTOs

### SCreateKasBankRequest

```go
type SCreateKasBankRequest struct {
    Tanggal       string                   `json:"tanggal" binding:"required"`
    TipeTransHd   string                   `json:"tipeTransHd" binding:"required"`
    PerkiraanHd   string                   `json:"perkiraanHd"`
    Note         string                   `json:"note"`
    TglJurnal    *string                  `json:"tgljurnal"`
    NoJurnal     string                   `json:"noJurnal"`
    NoBuktiSem   string                   `json:"noBuktiSem"`
    Devisi       string                   `json:"devisi"`
    NoBon        string                   `json:"nobon"`
    TPHC         string                   `json:"tphc"`
    Details      []SDetailInput            `json:"details"`
    GiroList     []models.SDBGIRO         `json:"giroList,omitempty"`
    DepositoList []models.SDBDEPOSITO      `json:"depositoList,omitempty"`
    HutPiutList  []models.SDBHUTPIUT      `json:"hutPiutList,omitempty"`
    AktivaList   []models.SDBAKTIVA       `json:"aktivaList,omitempty"`
}
```

### SDetailInput

```go
type SDetailInput struct {
    Urut         int     `json:"urut"`
    Perkiraan    string  `json:"perkiraan" binding:"required"`
    Lawan        string  `json:"lawan"`
    Debet        float64 `json:"debet"`
    Kredit       float64 `json:"kredit"`
    Valas        string  `json:"valas"`
    Kurs         float64 `json:"kurs"`
    Keterangan   string  `json:"keterangan"`
    TipeTrans    string  `json:"tipeTrans"`
    TPHC         string  `json:"tphc"`
    KodeBag      string  `json:"kodebag"`
    KodeCustSupp string  `json:"kode_cust_supp"`
    CustSuppP    string  `json:"custSuppP"`
    CustSuppL    string  `json:"custSuppL"`
    NoAktivaP    string  `json:"noAktivaP"`
    NoAktivaL    string  `json:"noAktivaL"`
    XSusut       int     `json:"xSusut"`
    PerlakuanAktiva int  `json:"perlakuanAktiva"`
}
```
