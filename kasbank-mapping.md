# DBTRANS / DBTRANSAKSI / DBHUTPIUT Mapping Field & Insert-Update-Del Flow

Generated from analysis of DAPEN KasBank module (backend/internal/features/accounting/kasbank/).

## TABLE 1: DBTRANS (Header / Journal Header)

| Field | Type | Source (value comes from) | How written |
|---|---|---|---|
| **NoBukti** | string (PK, size:30) | `GenerateNoBuktiTx(settingsSvc)` → uses DBNOMOR config + tipe + bulan+tahun | Inserted via `tx.Create(h)` |
| **NOURUT** | string (PK, size:10) | `result.Seq` from numbering service (counter increment from DBNOMOR) | Inserted via `tx.Create(h)` |
| **Tanggal** | *time.Time | Request JSON `tanggal` (if supplied) OR derived from active DBPERIODE via `defaultTanggal()` | Inserted via `tx.Create(h)` |
| **Note** | string (size:500) | Request JSON `note` | Inserted via `tx.Create(h)` |
| **Lampiran** | string (size:50) | Legacy column; never written by Go code → defaults to empty | Not written |
| **MyID** | *string (read-only, tag `->;<-`) | GORM `BeforeCreate` hook activity log — auto-filled with `userID` from request context (JWT session injected by middleware.InjectUserContext) | Auto-filled in transaction |
| **IsOtorisasi1..5** | bool | Initially `false`; set via `SetOtorisasi()` handler (`POST /:noBukti/otorisasi`) → `repo.SetOtorisasi(ctx, noBukti, level, userID)` updates via raw SQL | Raw UPDATE (`UPDATE DBTRANS SET IsOto...=?, OtoUser=?, TglOto=? WHERE NoBukti=?`) |
| **OtoUser1..5** | string (size:15) | `userID` at time of authorization | Same as above |
| **TglOto1..5** | *time.Time | `time.Now()` at time of authorization | Same as above |
| **Simbol** | *string (size:10) | Legacy; never set in current flow (remains nil) | Never written |
| **TipeTransHd** | *string (size:10) | Request JSON `tipeTransHd` (BKM/BKK/BBM/BBK); validated by `ValidTipeTrans()` | Inserted via `tx.Create(h)` |
| **PerkiraanHd** | *string (size:20) | Request JSON `perkiraanHd` (optional) — cash/bank account for header | Inserted via `tx.Create(h)` |
| **FlagSimbol** | string (size:2) | Default may be set elsewhere; service does not explicitly write it on the header | Not explicitly written |
| **MaxOL** | int | Derived from authorization flags in view model; default effective level = 2 | Not directly written by insert flow |
| **NoJurnal** | *string (size:30) | Request JSON `noJurnal` (order number) | Inserted via `tx.Create(h)` |
| **NoUrutJurnal** | *string (size:5) | Legacy; stored separately in DBJURNAL, not written here | Never written |
| **TglJurnal** | *time.Time | Request JSON `tgljurnal` (parsed, if supplied) — due date / "Batas Waktu" | Inserted via `tx.Create(h)` |
| **Flagtipe** | int | Legacy Delphi value; remains 0 | Never written |
| **NoBuktiSem** | *string (size:30) (tag `->;<-`, read-write except MyID is read-only) | Request JSON `noBuktiSem` (invoice/reference number) | **Raw UPDATE after Create**: `UPDATE DBTRANS SET NoBuktiSem=? WHERE NoBukti=` |
| **Nobon** | *string (size:20) (tag `->;<-`) | Request JSON `nobon` (external reference number) | **Raw UPDATE after Create**: `UPDATE DBTRANS SET Nobon=? WHERE NoBukti=` |

**Insert method (header):** `InsertHeader(ctx, h *SDbTrans)` → `tx.Create(h)`. **Update method:** `UpdateHeader(ctx, h *SDbTrans)` → `tx.Save(h)`. **Delete method:** `DeleteHeader(ctx, noBukti)` → cascading delete within single transaction (see below).

---

## TABLE 2: DBTRANSAKSI (Detail / Journal Lines)

Filling occurs in loop `for i, d := range req.Details` inside `CreateHeader` and `UpdateHeader`, called via `buildDetailRow(...)`:

| Field | Type | Source | How written |
|---|---|---|---|
| **NoBukti** | string (PK) | Header NoBukti (passed from `buildDetailRow`) | Inserted via safeCreateByReflection |
| **Urut** | int (PK) | Loop index `i+1` on create; incoming `urut` from SDetailInput on update | Inserted via safeCreateByReflection |
| **Tanggal** | *time.Time | `h.Tanggal` from header | Inserted via safeCreateByReflection |
| **Devisi** | string | `req.Devisi` (business unit from header) — lives only in detail rows, NOT in DBTRANS | Inserted via safeCreateByReflection |
| **Perkiraan** | string (size:25) | `d.Perkiraan` from SDetailInput (required) | Inserted via safeCreateByReflection |
| **Lawan** | string (size:25) | `d.Lawan` from SDetailInput | Inserted via safeCreateByReflection |
| **Keterangan** | string (size:8000) | `d.Keterangan` from SDetailInput | Inserted via safeCreateByReflection |
| **Keterangan2** | string (size:8000) | Always empty `""` | Inserted (empty) |
| **Debet** | float64 | `d.Debet` from SDetailInput | Inserted via safeCreateByReflection |
| **Kredit** | float64 | `d.Kredit` from SDetailInput | Inserted via safeCreateByReflection |
| **Valas** | string (size:15) | `d.Valas` from SDetailInput; defaults to `"IDR"` if blank in `buildDetailRow()` | Inserted via safeCreateByReflection |
| **Kurs** | float64 | `d.Kurs` from SDetailInput; defaults to `1.0` if zero in `buildDetailRow()` | Inserted via safeCreateByReflection |
| **DebetRp** | float64 | Computed: `if Valas == "" || Valas == "IDR" then Debet else Debet * Kurs` in `buildDetailRow()` | Inserted via safeCreateByReflection |
| **KreditRp** | float64 | Computed: `if Valas == "" || Valas == "IDR" else Kredit * Kurs` in `buildDetailRow()` | Inserted via safeCreateByReflection |
| **TipeTrans** | string (size:3) | `d.TipeTrans` from SDetailInput (echoes header TipeTransHd) | Inserted via safeCreateByReflection |
| **TPHC** | string (size:1) | `headerTPHC` passed from request (C/T/H/P marker) | Inserted via safeCreateByReflection |
| **CustSuppP** | string (size:15) | `d.KodeCustSupp` or `d.CustSuppP` from SDetailInput | Inserted via safeCreateByReflection |
| **CustSuppL** | string (size:15) | `d.CustSuppL` from SDetailInput | Inserted via safeCreateByReflection |
| **KodeP** | string (size:15) | **Computed** via `ResolveSubTransaction(ctx, Perkiraan, dkVal)` — returned `Kode`; assigned if DK=`D`, otherwise blank | Set by `buildDetailRow()` before insert |
| **KodeL** | string (size:15) | **Computed** via `ResolveSubTransaction(...)`; assigned if DK=`K`, otherwise blank | Set by `buildDetailRow()` before insert |
| **NoAktivaP** | string (size:30) | `d.NoAktivaP` from SDetailInput (Aktiva sub-form, debit side) | Inserted via safeCreateByReflection |
| **NoAktivaL** | string (size:30) | `d.NoAktivaL` from SDetailInput (Aktiva sub-form, credit side) | Inserted via safeCreateByReflection |
| **StatusAktivaP** | string (size:5) | **Computed** via `ResolveSubTransaction(...)` when trigger=`aktiva`; otherwise blank | Set by `buildDetailRow()` before insert |
| **StatusAktivaL** | string (size:5) | **Computed** via `ResolveSubTransaction(...)` when trigger=`aktiva`; otherwise blank | Set by `buildDetailRow()` before insert |
| **XSusut** | int | `d.XSusut` from SDetailInput (depreciation periods from Aktiva sub-form) | Inserted via safeCreateByReflection (**optional column** - may be omitted if missing on legacy DB) |
| **PerlakuanAktiva** | int | `d.PerlakuanAktiva` from SDetailInput (0=normal, 1=sold, 2=removed) | Inserted via safeCreateByReflection (**optional column** - may be omitted if missing on legacy DB) |
| **Nobon** | string (size:20) | `headerNoBon` passed to `buildDetailRow()` (echoed from header) | Inserted via safeCreateByReflection |
| **StatusGiro** | string (size:2) | `calculateStatusGiro(headerTPHC, tipeTrans)` computed in `buildDetailRow()` | Inserted via safeCreateByReflection |
| **FlagSimbol** | string (size:2) | Defaults to `"RP"` if blank in `buildDetailRow()` | Inserted via safeCreateByReflection |
| **MyID** | *string (read-only) | GORM `BeforeCreate` hook (auto-filled from context `userID`) | Auto-filled in transaction |

**Insert method:** `InsertDetail(ctx, d *SDbTransaksi)` → calls `safeCreateByReflection(tx, "DBTRANSAKSI", d, optionalTransaksiCols)` where `optionalTransaksiCols = []string{"XSusut", "PerlakuanAktiva"}`. This probes INFORMATION_SCHEMA at runtime—if those columns exist, normal GORM `Create`; if not, raw INSERT skips them so same binary works on dev/prod.

**Update method:** `UpdateDetail(ctx, d *SDbTransaksi)` → `tx.Omit("FlagSimbol").Save(d)` (FlagSimbol never stored in DBTRANSAKSI intentionally).

**Delete method:** `DeleteDetail(ctx, noBukti, urut)` → first deletes from DBHUTPIUT where nobukti=? AND nomsk=?, then deletes DBTRANSAKSI row.

---

## TABLE 3: DBHUTPIUT (Sub-ledger Invoice Settlement / Hutang-Piutang)

Filling happens in loop `for i := range req.HutPiutList` after `normalizeHutPiut(req.HutPiutList)` pre-processing (synchronizes Urut ↔ NoMsk):

| Field | Type | Source | How written |
|---|---|---|---|
| **NoFaktur** | string (PK, size:30) | From `hp.NoFaktur` in HutPiutList (customer invoice number) | Inserted via safeCreateByReflection |
| **NoRetur** | string (PK, size:30) | From `hp.NoRetur` (blank unless return doc) | Inserted via safeCreateByReflection |
| **TipeTrans** | string (PK, size:3) | From `hp.TipeTrans` (HT=Hutang, PT=Piutang) | Inserted via safeCreateByReflection |
| **KodeCustSupp** | string (PK, size:15) | From `hp.KodeCustSupp` | Inserted via safeCreateByReflection |
| **NoBukti** | string (PK, size:30) | Current voucher number (`noBukti`) from header | Inserted via safeCreateByReflection |
| **NoMsk** | int (PK) | From `hp.NoMsk` (or `hp.Urut` if NoMsk=0), synchronized by `normalizeHutPiut()` | Inserted via safeCreateByReflection |
| **Urut** | int (PK) | From `hp.Urut` (or `hp.NoMsk`), synchronized by `normalizeHutPiut()` | Inserted via safeCreateByReflection |
| **Tanggal** | *time.Time | From `hp.Tanggal` (invoice date) | Inserted via safeCreateByReflection |
| **JatuhTempo** | *time.Time | From `hp.JatuhTempo` (due date) | Inserted via safeCreateByReflection |
| **Debet** | float64 | From `hp.Debet` | Inserted via safeCreateByReflection |
| **Kredit** | float64 | From `hp.Kredit` | Inserted via safeCreateByReflection |
| **Saldo** | float64 (read-only `->`) | Read-only field—never written during insert | Not included in INSERT |
| **Valas** | string (size:15) | From `hp.Valas` | Inserted via safeCreateByReflection |
| **Kurs** | float64 | From `hp.Kurs` | Inserted via safeCreateByReflection |
| **DebetD** | float64 (read-only `->`) | Read-only—never written | Not included in INSERT |
| **KreditD** | float64 (read-only `->`) | Read-only—never written | Not included in INSERT |
| **SaldoD** | *float64 (read-only `->`) | Read-only—never written | Not included in INSERT |
| **KodeSales** | string (size:15) | From `hp.KodeSales` | Inserted via safeCreateByReflection |
| **Tipe** | string (PK, size:4) | From `hp.Tipe` (DK type: D/K) | Inserted via safeCreateByReflection |
| **Perkiraan** | string (PK, size:25) | From `hp.Perkiraan` | Inserted via safeCreateByReflection |
| **Catatan** | string (size:800) | From `hp.Catatan` | Inserted via safeCreateByReflection |
| **MyID** | *string (read-only) | GORM `BeforeCreate` hook (auto-filled from context `userID`) | Auto-filled in transaction |
| **NOINVOICE** | string (size:50) | From `hp.NOINVOICE` | Inserted via safeCreateByReflection |
| **TGLINVOICE** | *time.Time | From `hp.TGLINVOICE` | Inserted via safeCreateByReflection |
| **NOPAJAK** | string (size:50) | From `hp.NOPAJAK` | Inserted via safeCreateByReflection |
| **TGLFPJ** | *time.Time | From `hp.TGLFPJ` | Inserted via safeCreateByReflection |
| **KodeVls_** | *string (size:20) | From `hp.KodeVls_` | Inserted via safeCreateByReflection |
| **Kurs_** | *float64 | From `hp.Kurs_` | Inserted via safeCreateByReflection |
| **KursBayar** | float64 | From `hp.KursBayar` | Inserted via safeCreateByReflection |
| **Tipebayar** | *int | From `hp.TipeBayar` | Inserted via safeCreateByReflection |
| **IsOtorisasi1..5** | *bool | Initially nil/false; set via authorization later (same as header) | Raw UPDATE on header DBTRANS only (no separate HutPiut auth in this flow yet) |
| **OtoUser1..5** | *string | Initially nil | — |
| **TglOto1..5** | *time.Time | Initially nil | — |
| **IsClose** | *bool | Initially nil | — |
| **NoJurnal** | *string (size:30) | Initially nil | Will be set when posting to journal |
| **NoUrutJurnal** | *string (size:5) | Initially nil | — |
| **TglJurnal** | *time.Time | Initially nil | — |
| **MaxOL** | *int | Initially nil | — |
| **Nourut** | string (size:10) | **Optional**—present in Go model but may be missing from legacy DB | Omitted from INSERT via `optionalHutPiutCols` if missing on target table |
| **KBLB** | string (size:3) | **Optional**—missing from legacy production DBHUTPIUT table | Omitted via `optionalHutPiutCols` |
| **TipeDK** | string (size:1) | **Optional**—mirrors Delphi @TipeDK parameter in sp_TempHutPiut (legacy DB lacks this column) | Omitted via `optionalHutPiutCols` |

**Insert method:** `safeCreateDBHutPiut(tx, hp)` → calls `safeCreateByReflection(tx, "DBHUTPIUT", row, optionalHutPiutCols)` where `optionalHutPiutCols = []string{"KBLB", "TipeDK", "Nourut"}`. These three columns are blacklisted if the legacy database doesn't have them, allowing the same binary to run on both dev (with extra columns) and prod (without).

**Delete:** Cascaded by `DeleteHeader` (step 4: `DELETE FROM DBHUTPIUT WHERE LTRIM(RTRIM(nobukti)) = ?`) and by `DeleteDetail` (step: `DELETE FROM DBHUTPIUT WHERE LTRIM(RTRIM(nobukti)) = ? AND nomsk = ?`). Uses `LTRIM/RTRIM` to handle legacy whitespace-padding on nobukti.

---

## COMPLETE INSERT FLOW: Create Voucher

```
POST /api/accounting/kasbank (frontend)
  ├─ Handler: CreateKasBank
  │   ├─ Extract userIDFromContext(c) ← JWT session (middleware.InjectUserContext)
  │   └─ svc.CreateHeader(userID, req)
  │        └─ Transaction start (gorm.DB)
  │             ├─ Step 1: Generate NoBukti + NOURUT from DBNOMOR (via settingsSvc.GenerateNoBuktiTx)
  │             ├─ Step 2: tx.Create(header) → BeforeCreate hook fills MyID = userID
  │             ├─ Step 3: UPDATE DBTRANS SET NoBuktiSem=?, Nobon=? WHERE NoBukti=? (raw SQL after Create)
  │             ├─ Step 4: For each detail req.Details[i]:
  │             │    a. buildDetailRow(...) → computes DebetRp, KreditRp, KodeP/KodeL, StatusAktiva*, etc.
  │             │    b. safeCreateDBTransaksi(tx, row) → GORM Create or raw INSERT skipping XSusut/PerlakuanAktiva if missing
  │             ├─ Step 5: Double-entry re-check: SUM(Debet)==SUM(Kredit) per NoBukti
  │             ├─ Step 6: For each Giro req.GiroList[i]: safeCreateByReflection(tx, "DBGIRO", ..., optionalGiroCols=nil)
  │             ├─ Step 7: For each Deposito req.DepositoList[i]: safeCreateByReflection(tx, "DBDEPOSITO", ..., optionalDepositoCols=nil)
  │             ├─ Step 8: normalizeHutPiut(req.HutPiutList) → sync Urut↔NoMsk
  │             ├─ Step 9: For each HutPiut req.HutPiutList[i]:
  │             │    safeCreateDBHutPiut(tx, hp) → GORM Create or raw INSERT skipping KBLB/TipeDK/Nourut if missing
            │    hp.NoBukti = noBukti (auto-assigned by backend)
  │             ├─ Step 10: For each Aktiva req.AktivaList[i]:
  │             │    aktiva.NoBuktiSem = &noBukti; safeCreateByReflection(tx, "DBAKTIVA", ..., optionalAktivaCols=nil)
  │             └─ Transaction commit → all tables atomically persisted!
```

## UPDATE FLOW (Replace-style)

`PUT /api/accounting/kasbank/:noBukti`

1. Validate header exists, `IsOtorisasi1=false`, period not locked.
2. Update header columns (`Tanggal`, `TipeTransHd`, `PerkiraanHd`, `Note`, `NoJurnal`, `TglJurnal`) via `tx.Save(existing)`.
3. **Extra fields** (`NoBuktiSem`, `Nobon`) via raw `UPDATE DBTRANS SET ... WHERE NoBukti=`.
4. **If Details provided:** `DELETE FROM DBTRANSAKSI WHERE NoBukti=?` → rebuild all details via `buildDetailRow` + `safeCreateDBTransaksi` → re-validate totals.
5. **Replace Giro/Deposito/Aktiva/HutPiut** similarly using `safeCreateByReflection` loops (full replace pattern).

## DELETE FLOW (Cascade Delete)

`DELETE /api/accounting/kasbank/:noBukti`

1. Validate header exists, `IsOtorisasi1||IsOtorisasi2=false`, period not locked.
2. Call `repo.DeleteHeader(ctx, noBukti)` which runs **one transaction**:
   - `DELETE FROM DBTRANSAKSI WHERE NoBukti = ?` (detail lines)
   - `DELETE FROM DBGIRO WHERE BuktiBuka=? AND TglCair IS NULL` (open giros)
   - `UPDATE DBGIRO SET BuktiCair='', urutBuktiCair=0, TglCair=NULL, Kredit=0, KreditRp=0, KeteranganCair='' WHERE BuktiCair=?` (clear cair links)
   - Same for `DBDEPOSITO`.
   - `DELETE FROM DBHUTPIUT WHERE LTRIM(RTRIM(nobukti)) = ?` (hutpiut sub-ledger entries)
   - `DELETE FROM DBTempHUTPIUT WHERE LTRIM(RTRIM(NoBukti)) = ?` (per-user staging)
   - `DELETE FROM DBTRANS WHERE NoBukti = ?` (header parent – last)

## AUTHORISATION FLOW (Level 1–5)

| Endpoint | Method | Action |
|---|---|---|
| `POST /api/accounting/kasbank/{noBukti}/otorisasi` | SetOtorisasi → repo.SetOtorisasi | `UPDATE DBTRANS SET IsOtorisasiN=1, OtoUserN=?, TglOtoN=? WHERE NoBukti=?` |
| `POST /api/accounting/kasbank/{noBukti}/batal-otorisasi` | CancelOtorisasi → repo.CancelOtorisasi | `UPDATE DBTRANS SET IsOtorisasiN=0, OtoUserN='', TglOtoN=NULL WHERE NoBukti=?` |

**Validation rules (enforced in service):** Level N can be set only if Level N-1 already approved; approver at level N must differ from level N-1; setting level N+1 while level N+1+1 is set is rejected.
