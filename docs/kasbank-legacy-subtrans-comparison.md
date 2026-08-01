# KasBank Sub-Transaction - Delphi vs Go Comparison

## Overview

This document details the differences between the Delphi (FrmKasBank.pas / sp_TransaksiKasBank) 
and Go (service.go / buildDetailRow) implementations for Kas Bank sub-transaction handling.

**Key finding**: Delphi stores sub-transaction data primarily in the DBTRANSAKSI detail row 
(via sp_TransaksiKasBank), with fields like NoAktivaP, NoAktivaL, KodeP, KodeL, StatusAktivaP, 
StatusAktivaL, XSusut, PerlakuanAktiva, CustSuppP, CustSuppL, StatusGiro, and also in 
separate sub-ledger tables (DBGIRO, DBDEPOSITO, DBHUTPIUT, DBAKTIVA). The Go implementation 
only sets KodeP/KodeL/StatusP/StatusL via resolveSubTransaction.

---

## 1. SimpanData Procedure Flow (Delphi)

User fills detail row, then SimpanData(Choice) calls in order:
1. SimpanDataAktiva(pChoice)  -- BEFORE sp_Transaksi.ExecProc
2. sp_Transaksi.ExecProc  -- INSERT/UPDATE DBTRANSAKSI via sp_TransaksiKasBank
3. SimpanDataGiro(pChoice)   -- AFTER ExecProc

Critical: Aktiva form variables (NoAktivaP, XSusut, PerlakuanAktiva) must be set 
BEFORE ExecProc because they are read from form variables, not from the QuAktiva dataset.

---

## 2. sp_TransaksiKasBank Parameters to DBTRANSAKSI Mapping

| Index | Param Name       | Delphi Source                           | Go buildDetailRow     | Status       |
|-------|------------------|-----------------------------------------|-----------------------|--------------|
| 2     | Nobukti          | NOBUKTI.Text                           | noBukti (param)       | OK         |
| 3     | NoUrut           | NoUrut.Text                            | urut (auto)           | OK         |
| 4     | Tanggal          | TANGGAL.Date                           | Tanggal (from header) | OK         |
| 5     | Note             | Terima.Text                            | note (from header)    | OK         |
| 7     | Devisi           | Devisi.Text                            | headerDevisi          | OK         |
| 8     | Perkiraan        | Perkiraan.Text                          | d.Perkiraan           | OK         |
| 9     | Lawan            | Lawan.Text                             | d.Lawan               | OK         |
| 10    | Keterangan       | KETERANGAN.Text                        | d.Keterangan         | OK         |
| 12    | Debet            | Jumlah.Value                           | d.Debet               | OK         |
| 13    | Kredit           | 0                                      | d.Kredit              | OK         |
| 14    | Valas            | Valas.Text                             | valas (IDR default)   | OK         |
| 15    | Kurs             | Kurs.Value                             | d.Kurs                | OK         |
| 16    | DebetRp          | Jumlah.Value * Kurs.Value               | DebetRp (computed)    | OK         |
| 18    | TipeTrans        | Mode.Text (BKM/BKK/BBM/BBK)           | tipeTrans             | OK         |
| 19    | TPHC             | Copy(THPC.Text,2,1)                   | headerTPHC            | PARTIAL     |
| 20    | CustSuppP        | kodeCustSuppP.Text                    | d.KodeCustSupp        | MISMATCH    |
| 21    | CustSuppL        | kodeCustSuppL.Text                    | NOT SET               | MISSING     |
| 23    | NoAktivaP        | NoAktivaP (from Aktiva sub-form)      | NOT SET               | MISSING     |
| 24    | NoAktivaL        | NoAktivaL (from Aktiva sub-form)      | NOT SET               | MISSING     |
| 25    | StatusAktivaP    | StatusAktivaP (from Aktiva sub-form)   | subRes.StatusP        | PARTIAL     |
| 26    | StatusAktivaL    | StatusAktivaL (from Aktiva sub-form)   | subRes.StatusL        | PARTIAL     |
| 27    | NoBon            | NoBon.Text                            | headerNoBon           | OK         |
| 28    | Kodebag          | KodeBag.Text                          | d.KodeBag             | OK         |
| 29    | KodeP            | KodeP (from CekLawanDiPosting)        | subRes.Kode           | DIFFERENT   |
| 30    | KodeL            | KodeL (from CekLawanDiPosting)        | subRes.Kode           | DIFFERENT   |
| 31    | StatusGiro       | StatusGiro (from THPC+Mode)            | calculateStatusGiro() | OK         |
| 32    | Simbol           | Simbol.Text                           | FlagSimbol            | OK         |
| 33    | PerkiraanHd      | mPerkiraan.Text (header Kas/Bank)       | header devisi perk.   | DIFFERENT   |
| 34    | XSusut           | XSusut (from Aktiva sub-form)          | NOT SET               | MISSING     |
| 35    | PerlakuanAktiva  | PerlakuanAktiva (from Aktiva sub-form) | NOT SET               | MISSING     |

---

## 3. Detailed Differences

### 3.1 KodeP/KodeL - DIFFERENT (critical)

Delphi CekLawanDiPosting(mLawan, DK):
- For BKK/BBK: uses mLawan (the expense/revenue counter-account)
- For BKM/BBM: uses mLawan (the Kas/Bank account)

Go ResolveSubTransaction always uses d.Perkiraan.

The fix: buildDetailRow should call CekLawanDiPosting(mLawan, DK) where mLawan is d.Lawan.

### 3.2 CustSuppL - MISSING

Delphi sets both kodeCustSuppP and kodeCustSuppL from the HutPiut sub-form.
Go only sets CustSuppP.

Fix: Add custSuppL to SDetailInput and set it in buildDetailRow.

### 3.3 NoAktivaP / NoAktivaL / XSusut / PerlakuanAktiva - MISSING

Delphi Aktiva sub-form sets form variables (NoAktivaP, XSusut, PerlakuanAktiva)
that are then passed to sp_TransaksiKasBank to populate DBTRANSAKSI columns.

Go saves Aktiva to DBAKTIVA table but does NOT set these fields on DBTRANSAKSI.

Fix: Add these fields to SDetailInput, pass from AktivaSubForm, set in buildDetailRow.

### 3.4 DBHUTPIUT - No DELETE before INSERT

Delphi SimpanDataHutPiut always does DELETE WHERE nobukti=xxx AND nomsk=yyy first.
Go just tx.Create(&hp) - creates duplicates on re-save.

### 3.5 DBGIRO - INSERT only, no UPDATE for settlements

Delphi: H- and P- trigger UPDATE DBGIRO to settle an open giro.
Go: Only does INSERT, never UPDATE.

### 3.6 DBDEPOSITO - INSERT only, no UPDATE for settlements

Same as DBGIRO: DP- should UPDATE existing DBDEPOSITO record.

### 3.7 TPHC - Should be per-detail

Delphi: Each detail row has its own THPC selection.
Go: Uses header-level TPHC for all details.

---

## 4. Fix Implementation

### Go service.go changes needed:

1. SDetailInput DTO: add CustSuppP, CustSuppL, NoAktivaP, NoAktivaL, XSusut, PerlakuanAktiva
2. buildDetailRow: use d.Lawan for KodeP/KodeL lookup (not d.Perkiraan), set all new fields
3. CreateHeader: DBHUTPIUT - DELETE WHERE nobukti=? AND nomsk=? before INSERT
4. CreateHeader: DBGIRO - INSERT for new giro (TglCair=nil), UPDATE for settle (TglCair set)
5. CreateHeader: DBDEPOSITO - same INSERT/UPDATE logic
6. DBGIRO: Set KAS field = PerkiraanHd, Tipe = HT/PT based on StatusGiro

### Go model changes needed:

1. SDbTransaksi: Add XSusut, PerlakuanAktiva fields
2. SDBGIRO: KAS field exists but not populated - need to set it
3. SDBDEPOSITO: Add Tipe field if missing
