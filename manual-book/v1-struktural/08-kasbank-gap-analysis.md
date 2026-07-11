# Bab 8 — Analisis Gap & Perbandingan: trade-exchange (PHP) vs DAPEN-Backend (Go)

> **Status dokumen:** Living document — diperbarui setiap sprint.
> **Tanggal analisis terakhir:** 2026-03 (cut-off: master `master`, 397 baris dokumentasi kasbank).
> **Ruang lingkup:** Modul Akunting > Transaksi Kas Bank + sub-modul Settlement Hutang/Piutang (sub-ledger).

---

## 1. Ringkasan Eksekutif

Modul **Transaksi Kas Bank** di DAPEN-Backend (Go) saat ini berada pada **tingkat kematangan (4 dari 5)** dari target legacy trade-exchange (PHP):

| Area | trade-exchange (PHP) | DAPEN-Backend (Go) | Status |
|------|----------------------|--------------------|--------|
| Header BKM/BKK/BBM/BBK + CRUD + otorisasi 5 level | ✅ | ✅ | **Setara** |
| Generate nomor voucher (DBNOMOR + PEMISAH) | ✅ | ✅ | **Setara** |
| Validasi periode aktif (DBPERIODE) + tolak tanggal di luar | ✅ | ✅ | **Setara** |
| Double-entry balance (sum Debet == sum Kredit) + toleransi 0.01 | ✅ | ✅ | **Setara** |
| Lock setelah Otorisasi level 1 | ✅ | ✅ | **Setara** |
| Sequential approver (level N ≠ level N-1) | ✅ | ✅ | **Setara** |
| PDF download | ✅ | ✅ | **Setara** |
| **Sub-ledger Hutang/Piutang (dbTempHutPiut, dbPostHutPiut)** | ✅ | ❌ | **Gap besar** |
| **Sub-modul Giro (buka/cair giro)** | ✅ | ❌ | **Gap besar** |
| **Sub-modul Aktiva Tetap (AKV)** | ✅ | ❌ | **Gap besar** |
| **Lookup piutang jatuh tempo per customer** | ✅ | ❌ | **Gap besar** |
| **THPC (C/T/H/P) routing ke sub-modul** | ✅ | ❌ | **Gap besar** |
| **Auto-fill Debet/Kredit berdasarkan Tipe Transaksi** | ✅ | ⚠️ Partial | **Gap kecil** |

**Headline:** Fondasi inti sudah solid dan _feature-equivalent_ dengan PHP. Yang belum dibangun adalah seluruh **integration layer** sub-ledger — bagian terbesar dari pengalaman pengguna kasbank (~60% dari total UX).

---

## 2. Apa yang Sudah Setara (Fungsional Inti)

### 2.1 Header CRUD + Otorisasi Berjenjang

#### trade-exchange (PHP)

- File legacy: `app/Http/Controllers/Akunting/FrKasBankController.php` (Laravel controller)
- Field header dari form Delphi/VB: Jenis Transaksi, Tanggal, Devisi, No. Urut, No. Bukti (auto), Kode Bagian, THPC, No. Bon, Lampiran, Tgl Input, User ID, No. Reg.
- Otorisasi: kolom `IsOtorisasi1..5`, `OtoUser1..5`, `TglOto1..5` di DBTRANS.

#### DAPEN-Backend (Go)

- File: `backend/internal/features/accounting/kasbank/{entity,repository,service,handler,routes}.go`
- HTTP: `POST/PUT/DELETE /api/accounting/kasbank{,/detail,/detail/:urut,/otorisasi,/batal-otorisasi}` — lihat `routes.go:28-56`.
- Service rules: `service.go:565-610` (SetOtorisasi, CancelOtorisasi).
- Verdict: **Logika setara** — termasuk 5-level otorisasi dengan sequential approver rule.

### 2.2 Generate Nomor Voucher (Atomic)

#### trade-exchange (PHP)

- Stored procedure `sp_Nomor_Bukti` atau raw `SELECT DBNOMOR.NOBKK WITH (UPDLOCK, HOLDLOCK)`.
- Separator dari kolom `DBNOMOR.PEMISAH`: `0=':'`, `1='-'`, `2='/'`, `3=' '`.
- Format: `{TIPE}-{YYYYMM}{SEP}{SEQ:04}` (mis: `BKK-202606-0001`).

#### DAPEN-Backend (Go)

- File: `nomor.go:78-117` (`GenerateNoBukti`)
- Lock sama: `WITH (UPDLOCK, HOLDLOCK)` — `nomor.go:124`.
- Auto-reset SEQ per bulan, parse separator dari DBNOMOR via `DecodePemisah(pemisahCfg)`.
- Verdict: **Identik**.

### 2.3 Validasi Periode & Double-Entry

#### trade-exchange (PHP)

- Cek `DBPERIODE` (bulan, tahun) via `QuPeriode` saat insert; reject jika tanggal di luar.
- Double-entry: `SELECT SUM(Debet), SUM(Kredit) FROM DBTRANSAKSI WHERE NoBukti = ?` dengan toleransi `abs(diff) < 0.01`.

#### DAPEN-Backend (Go)

- `service.go:665-677` (`assertTanggalInPeriode`).
- `service.go:322-330` (re-validasi setelah insert) + `validateDoubleEntry()` dengan `floatEq` threshold 0.01.
- Verdict: **Identik**, dan Go melakukan **re-validation** di setiap mutasi (lebih disiplin dari PHP).

### 2.4 Lock Setelah Otorisasi

#### trade-exchange (PHP)

- Cek `IsOtorisasi1=1` sebelum koreksi/hapus via `dbTrans` query di controller.
- Hapus: reject jika `IsOtorisasi1 OR IsOtorisasi2`.

#### DAPEN-Backend (Go)

- `service.go:354-356, 460-462, 499-501` — semua mutasi guard dengan `IsOtorisasi1`.
- DeleteHeader: `service.go:441-444` reject jika level 1 ATAU 2 aktif.
- Verdict: **Setara**.

### 2.5 PDF Download

#### trade-exchange (PHP)

- DOMPDF/TCPDF: layout A4 portrait, kop surat, tanda tangan.
- Field binding: header + detail rows + footer (printed-by, printed-at).

#### DAPEN-Backend (Go)

- File: `backend/internal/features/accounting/kasbank/pdf.go` (223 baris).
- Endpoint: `GET /api/accounting/kasbank/pdf`.
- Verdict: **Setara**.

---

## 3. Gap yang Signifikan (Belum Diimplementasikan)

### 3.1 Sub-Ledger Settlement Hutang/Piutang (`dbTempHutPiut`)

#### Deskripsi bisnis

Saat user memilih Lawan = akun Piutang Dagang / Utang Dagang di baris detail, sistem menampilkan **sub-grid piutang/utang terbuka** dari customer/supplier terkait. User memilih faktur → input nominal pembayaran → sistem insert ke staging table `dbTempHutPiut`. Pada Save, record dipromosikan ke `dbKartuUtang` / `dbKartuPiutang` (kartu historis).

#### trade-exchange (PHP)

- Class `dbTempHutPiut` (models/DbTempHutPiut.php) + `dbPostHutPiut`.
- Stored proc `sp_QuHutPiut` — query faktur terbuka per entitas.
- Stored proc `sp_CekPelunasanMax` — validasi overpayment.
- UI Form: `FrKasBankSubDetail` (Delphi/Pascal) dimuat sebagai modal dari `FrKasBank`.
- 26 field di staging (lihat `08-kasbank.md:144-178`).

#### DAPEN-Backend (Go) — status

- ❌ Tidak ada file `dbTempHutPiut.go` di `models/`.
- ✅ Model `SDbPostHutPiut` ada (`models/dbposthutpiut.go`) tapi tidak dipakai service.
- ❌ Tidak ada endpoint `lookup-piutang-terbuka` / `lookup-utang-terbuka`.
- ❌ Service tidak insert ke staging table on save.
- **Gap:** seluruh sub-flow settlement hilang dari backend.

#### Dampak UX

Tanpa sub-ledger settlement, modul kasbank hanya bisa mencatat **transaksi kas/bank polos** — tidak bisa melunasi piutang customer atau utang supplier. Konsekuensi:

1. Akuntansi tidak bisa auto-posting ke kartu utang/piutang.
2. Laporan aging piutang/utang (`acc_piutang`, `acc_utang` di PHP) tidak ter-update.
3. Sub-ledger customer/supplier (history card) menjadi kosong.

#### Estimasi kompleksitas (T-shirt size)

- **L (Large)** — ~3-4 sprint: model baru, 5 endpoint baru, service settlement baru, integration ke CreateHeader, frontend sub-detail dialog.

### 3.2 Sub-Modul Giro (Buka / Cair Giro)

#### Deskripsi bisnis

THPC = `H` (Hutang Giro) atau `P` (Piutang Giro) mengaktifkan form Giro:
- **Buka Giro (H+):** BKK → simpan info giro (bank, no giro, tgl giro, jatuh tempo) → status `H+` di kartu giro.
- **Cair Giro (H-):** BBK → pilih giro supplier yang belum cair → tanggal cair → status `H-`.
- **Terima Giro Customer (P+):** BKM + THPC=`P` → simpan info giro masuk.
- **Cair Giro Customer (P-):** BKK/BBM + THPC=`P` → cairkan giro customer.

#### trade-exchange (PHP)

- Sub-form Delphi: `FrKasBankGiro` (dipanggil saat THPC=H/P di FrKasBank).
- Tabel: `dbGiro` (field: bank, no giro, tgl giro, jatuh tempo, status H+/H-/P+/P-, NoFaktur terkait).
- Service: `GiroService::buka()`, `GiroService::cair()`.

#### DAPEN-Backend (Go) — status

- ❌ Tidak ada model `dbGiro`.
- ❌ Tidak ada field `THPC` di `SDbTrans` (lihat `entity.go:36-103` — field THPC tidak ada).
- ❌ Tidak ada field `NoGiro`, `BankGiro`, `TglGiro`, `JatuhTempoGiro` di detail row `SDbTransaksi`.
- ❌ Tidak ada routing/handler untuk giro lifecycle.

#### Dampak UX

User tidak bisa input giro lewat kasbank — harus input manual di Modul Giro terpisah (yang juga belum dibuat di Go).

#### Estimasi kompleksitas

- **L** — model + 4 endpoint + service giro lifecycle + integrasi THPC di CreateHeader.

### 3.3 Sub-Modul Aktiva Tetap (AKV)

#### Deskripsi bisnis

Lawan = akun bertipe AKV (`dbPostHutPiut.Kode = 'AKV'`) → muncul form Aktiva (nama aset, qty, % susut, tgl pengakuan, tipe penyusutan Lurus/Menurun, akun akumulasi, akun biaya). Simpan cascade ke `dbAktiva`.

#### trade-exchange (PHP)

- Sub-form: `FrKasBankAktiva` (Delphi).
- Tabel: `dbAktiva` (~12 field).

#### DAPEN-Backend (Go) — status

- ❌ Tidak ada model `dbAktiva`.
- ❌ Tidak ada deteksi otomatis tipe AKV via `dbPostHutPiut`.

#### Estimasi kompleksitas

- **M** — model + 1 endpoint POST aktiva + service integrasi di CreateHeader.

### 3.4 Lookup Piutang/Utang Terbuka (Autocomplete Entitas)

#### trade-exchange (PHP)

- `QuHutPiut`: ambil customer/supplier + faktur terbuka (NoFaktur, Tanggal, JatuhTempo, Saldo, Valas, Kurs).
- Tampilkan di `FrKasBankSubDetail.quickSearch` (Delphi DBGrid).

#### DAPEN-Backend (Go) — status

- ✅ Sudah ada `LookupPerkiraan` (`service.go:247-254`) untuk autocomplete COA Lawan.
- ❌ Belum ada lookup entitas customer/supplier terkait (perlu join `DBSUPLIER` / `DBCUSTOMER`).
- ❌ Belum ada endpoint `GET /api/accounting/kasbank/open-invoices?perkiraan=PT.001&kode=EMP001`.

#### Estimasi kompleksitas

- **S** — 2 endpoint (open-piutang, open-utang) + join query.

### 3.5 THPC Routing

#### trade-exchange (PHP)

- Field THPC ada di DBTRANS (kolom `THPC CHAR(1)` atau `TpBayar`).
- Saat CreateHeader: jika THPC=H/P → muncul form Giro; jika THPC=C/T → tidak ada sub-form; jika Lawan=AKV → muncul form Aktiva.
- Routing logic di `FrKasBank.btnSimpanClick`.

#### DAPEN-Backend (Go) — status

- ❌ Field THPC belum ada di `SDbTrans` model.
- ❌ Field TPHC sudah ada di `SDbTransaksi` (`entity.go:67`) tapi unused di service logic.
- ❌ Tidak ada THPC-driven branching di CreateHeader.

#### Estimasi kompleksitas

- **S** — tambah kolom THPC, branching service untuk trigger giro/aktiva sub-form.

### 3.6 Auto-fill Debet/Kredit

#### trade-exchange (PHP)

- Form Delphi: kolom `Debet` / `Kredit` di grid di-trigger otomatis oleh `TipeTrans` saat row di-add.
- Logic: BKM → set `Debet=nilai, Kredit=0`; BKK → `Kredit=nilai, Debet=0`; BBM/BBK mengikuti.

#### DAPEN-Backend (Go) — status

- ⚠️ **Partial**: service menerima `SDetailInput` (lihat `dto.go`) dengan `Debet` dan `Kredit` masing-masing positif, dan double-entry validator mengharuskan satu sisi saja.
- ❌ Backend tidak auto-derive sisi Debet/Kredit dari Tipe Transaksi — frontend harus hitung sendiri.

#### Estimasi kompleksitas

- **S** — helper `deriveDK(tipe, nilai)` di service + auto-call saat AddDetail.

---

## 4. Detail Perbandingan Field-by-Field

### 4.1 Header (DBTRANS)

| Field | Tipe DB | PHP (trade-exchange) | Go (DAPEN-Backend) | Catatan |
|-------|---------|----------------------|--------------------|---------|
| NoBukti | PK VARCHAR | ✅ | ✅ `entity.go:49` | PK |
| Tanggal | DATETIME | ✅ | ✅ | |
| Note | VARCHAR(500) | ✅ ("Kode Project") | ✅ `entity.go:42` | |
| TipeTransHd | VARCHAR(10) | ✅ BKM/BKK/BBM/BBK | ✅ `entity.go:50` | |
| PerkiraanHd | VARCHAR(20) | ✅ (akun kas/bank) | ✅ `entity.go:51` | |
| NoJurnal | VARCHAR(50) | ✅ ("No. Order") | ✅ `entity.go:46` | |
| NoBuktiSem | VARCHAR(50) | ✅ ("No. Invoice") | ✅ `entity.go:48` | |
| TglJurnal | DATETIME | ✅ ("Batas Waktu") | ✅ `entity.go:44` | |
| IsOtorisasi1..5 | BIT | ✅ | ✅ | |
| OtoUser1..5 | VARCHAR(50) | ✅ | ✅ | |
| TglOto1..5 | DATETIME | ✅ | ✅ | |
| MaxOL | INT | ✅ (1-5) | ✅ `entity.go` + `service.go:640-645` | Default 2 |
| Devisi | VARCHAR(10) | ✅ | ✅ `entity.go` (di detail row) | |
| THPC | CHAR(1) | ✅ C/T/H/P | ❌ | **Gap 3.5** |
| KodeBagian | VARCHAR(10) | ✅ | ❌ | Gap kecil |
| NoBon | VARCHAR(50) | ✅ | ❌ | Gap kecil |
| Lampiran | INT | ✅ | ❌ | Gap kecil |
| TglInput | DATETIME | ✅ (audit) | ❌ | Bisa pakai `CreatedAt` GORM |
| UserID | VARCHAR(50) | ✅ | ❌ (auto dari JWT) | Bisa pakai `UpdatedBy` |
| NoReg | VARCHAR(50) | ✅ | ❌ | Auto-reg belum |

### 4.2 Detail (DBTRANSAKSI)

| Field | Tipe DB | PHP | Go | Catatan |
|-------|---------|-----|-----|---------|
| NoBukti | FK | ✅ | ✅ | |
| Urut | INT | ✅ | ✅ | |
| Perkiraan | VARCHAR(20) | ✅ | ✅ | |
| Lawan | VARCHAR(20) | ✅ | ✅ | |
| Debet | DECIMAL(18,2) | ✅ | ✅ | |
| Kredit | DECIMAL(18,2) | ✅ | ✅ | |
| DebetRp / KreditRp | DECIMAL | ✅ | ✅ `service.go:721-727` | Auto-fill |
| Valas | VARCHAR(10) | ✅ | ✅ | |
| Kurs | DECIMAL(18,4) | ✅ | ✅ (default 1) | |
| JumlahValas | DECIMAL | ✅ | ✅ (precomputed agg) | |
| JumlahRupiah | DECIMAL | ✅ | ✅ (precomputed agg) | |
| Keterangan | VARCHAR(500) | ✅ | ✅ | |
| TipeTrans | CHAR(10) | ✅ | ✅ | |
| TPHC | CHAR(1) | ✅ | ✅ tapi unused | **Gap 3.5** |
| Tanggal | DATETIME | ✅ (snapshot) | ✅ (snapshotted dari header) | |
| Devisi | VARCHAR(10) | ✅ | ✅ `service.go:715` (dari header) | |
| FlagSimbol | VARCHAR(10) | ✅ ("RP") | ✅ default `"RP"` `service.go:730` | |
| Status | CHAR(1) | ✅ ('A'/'D'/'R') | ❌ | Soft-delete belum |
| KeyUrut | VARCHAR(100) | ✅ (composite) | ❌ | PK alternatif legacy |
| SPK | VARCHAR(50) | ✅ (nomor SPK) | ❌ | Gap kecil |
| NoReg | VARCHAR(50) | ✅ | ❌ | |

### 4.3 Fitur Lintas (Cross-Cutting)

| Fitur | PHP | Go | Catatan |
|-------|-----|-----|---------|
| Pagination list | ✅ (Laravel paginator) | ✅ `SListKasBankQuery` | |
| Filter by tipe/tanggal/devisi/user | ✅ | ✅ | |
| Total agregat per halaman (N+1 prevention) | ✅ (Eager-load) | ✅ `GetAggregateTotals` `service.go:134-137` | Go lebih efisien |
| Row-level lock dengan UPDLOCK HOLDLOCK | ✅ | ✅ `nomor.go:124` | |
| Audit trail (CreatedAt/UpdatedAt/SoftDelete GORM) | ❌ | ✅ (ada di semua model) | **Go lebih baik** |

---

## 5. Perbedaan Arsitektur yang Penting

### 5.1 Transactional Integrity

- **PHP (Laravel):** menggunakan `DB::transaction()` di controller (`FrKasBankController@store`) — sama dengan Go.
- **Go (GORM):** `s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error { ... })` — di `service.go:282-334` (CreateHeader). Lebih eksplisit, error propagation lebih ketat.

**Verdict:** Setara. Go sedikit lebih strict (tidak ada fallback silent roll-back).

### 5.2 Error Mapping

- **PHP:** custom Exception classes → `Handler::render()` map ke HTTP code.
- **Go:** sentinel errors di `service.go:31-47` → handler maps ke 400/403/404/500 (lihat `handler.go`).

**Verdict:** Setara. Go lebih idiomatic.

### 5.3 Soft-Delete Strategy

- **PHP:** kolom `Flag` (A/D/R) di DBTRANSAKSI + `StatusUID='D'` di dbTempHutPiut. Tidak ada table-level soft-delete otomatis.
- **Go:** GORM `gorm.DeletedAt` di semua model — automatic soft-delete pada `DELETE` query.

**Verdict:** Go lebih aman (auto-filter di semua SELECT), tapi **PHP punya Flag/StatusUID untuk soft-delete di transaksi sub-ledger yang belum di-implement di Go** — perlu disain ulang saat bangun settlement.

### 5.4 Otorisasi Granularity

- **PHP:** 2-level minimum (Oto1, Oto2). 3-5 level jarang dipakai, default MaxOL = 2.
- **Go:** Sama — `defaultMaxOL = 2` di `service.go:56`, 5-level support lengkap di service.

**Verdict:** Setara.

---

## 6. Rekomendasi Urutan Implementasi

Berdasarkan dampak bisnis + effort, berikut urutan sprint yang disarankan:

### Sprint berikutnya (M1)

1. **THPC + auto-fill Debet/Kredit** (S) → unblocks giro dan aktiva.
2. **Lookup open piutang/utang** (S) → prerequisite untuk sub-ledger settlement.

### M2

3. **Model dbTempHutPiut + Sub-ledger Settlement service** (L) → blok utama yang hilang.
4. **Sub-modul Giro** (L) → blok kedua yang hilang.

### M3

5. **Sub-modul Aktiva (AKV)** (M).
6. **Flag/StatusUID soft-delete di DBTRANSAKSI** agar backward-compatible dengan PHP.

### Backlog (nice-to-have)

7. Field minor: KodeBagian, NoBon, Lampiran, NoReg, KeyUrut, SPK — tambahkan jika ada permintaan UI.
8. Audit trail: TglInput, UserID — bisa pakai GORM `CreatedAt`/`UpdatedAt`.

---

## 7. Test Coverage Comparison

| Layer | PHP (artisan test) | Go (go test) |
|-------|---------------------|--------------|
| Handler (HTTP) | ✅ | ✅ `handler_test.go` (463 baris) |
| Service (business) | ⚠️ partial | ✅ `service_test.go` (807 baris) |
| Repository | ⚠️ partial | ✅ `repository_test.go` (710 baris) |

**Verdict:** Go **jauh lebih disiplin** dengan _table-driven tests_ di 3 layer. PHP mengandalkan testing manual via UI.

---

## 8. Open Questions untuk Diskusi

1. Apakah THPC harus **wajib** di setiap transaksi kasbank (mirip PHP), atau cukup **opsional** dengan default `C` (cash)?
2. Apakah kita perlu **import data legacy dari MySQL PHP** ke SQL Server, atau **greenfield** tanpa migrasi?
3. Untuk **sub-ledger settlement**, apakah cukup implementasi **one-step** (langsung tulis ke kartu), atau perlu **two-step** via dbTempHutPiut seperti PHP?
4. Apakah giro membutuhkan **integration ke Modul Bank** terpisah, atau semua di dalam FrKasBank?

---

## 9. Catatan Penutup

Modul Kas Bank Go sudah **layak untuk basic voucher recording** (BKM/BKK/BBM/BBK + 5-level otorisasi) — bisa dipakai akuntan untuk input transaksi kas polos. Yang belum ada adalah **integration layer** ke sub-modul settlement/giro/aktiva.

Estimasi total untuk menutup seluruh gap: **3 sprint** (1 large + 1 large + 1 medium = ~12 minggu dev + 4 minggu QA).

Untuk sementara, jika user butuh flow settlement piutang/utang, mereka bisa:
- Input di **Modul Giro** (yang juga belum ada di Go — harus dibangun paralel).
- Atau **manual adjustment** di Modul Memorial (`09-memorial.md`) untuk kartu utang/piutang.

---

## 10. Lampiran A — Cross-Reference Tabel DB

| Tabel | trade-exchange PHP | DAPEN-Backend Go | Status |
|-------|--------------------|------------------|--------|
| DBTRANS | ✅ | ✅ `models/dbtrans.go` | Setara |
| DBTRANSAKSI | ✅ | ✅ `models/dbtransaksi.go` | Setara |
| DBNOMOR | ✅ | ✅ `models/dbnomor.go` | Setara |
| DBPERIODE | ✅ | ✅ `models/dbperiode.go` | Setara |
| DBPERKIRAAN | ✅ | ✅ `models/dbperkiraan.go` | Setara |
| DBHUTPIUT | ✅ | ✅ `models/dbhutpiut.go` | Setara (belum dipakai service) |
| DBPOSTHUTPIUT | ✅ | ✅ `models/dbposthutpiut.go` | Setara (belum dipakai service) |
| **DBTEMPHUTPIUT** | ✅ | ❌ | **Missing** |
| **DBKARTUUTANG** | ✅ | ❌ | **Missing** |
| **DBKARTUPIUTANG** | ✅ | ❌ | **Missing** |
| **DBGIRO** | ✅ | ❌ | **Missing** |
| **DBAKTIVA** | ✅ | ❌ | **Missing** |
| DBBON | ✅ | ❌ | Minor |

---

## 11. Lampiran B — Endpoint yang Akan Ditambahkan

```
# Settlement Hut/Piut (M2)
GET  /api/accounting/kasbank/open-invoices?perkiraan=PT.001&kode=EMP001
POST /api/accounting/kasbank/settlement  (insert staging + finalize)
DELETE /api/accounting/kasbank/settlement/:noFaktur/:urut  (soft-cancel)

# Giro (M2)
POST /api/accounting/kasbank/giro/buka
POST /api/accounting/kasbank/giro/cair
GET  /api/accounting/kasbank/giro/outstanding?perkiraan=PT.001

# Aktiva (M3)
POST /api/accounting/kasbank/aktiva

# Lookup kecil (M1)
GET  /api/accounting/kasbank/lookup-entities?perkiraan=HT.001
```

Total endpoint baru: **9** (dari 17 saat ini → 26 setelah M3 selesai).
