# Spec: Master Accounting

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Master Data > Master Accounting > [submenu] |
| **Akses** | User dengan akses Master Data + Akunting |
| **CRUD Ops** | Tampil, Koreksi, Hapus (per submenu) |
| **Validasi** | Saldo awal hanya boleh diisi di awal periode (sekali saja); COA General vs Detail harus konsisten |

## 2. Submenu Overview

| No | Submenu | Fungsi |
|----|---------|--------|
| 1 | Pergiroan (COA) | Chart of Accounts — daftar perkiraan |
| 2 | Aktiva Fisikal | Master aktiva tetap + depresiasi |
| 3 | Utang-Biutang | Setup klasifikasi utang/piutang |
| 4 | Labarugi | Template laporan laba rugi |
| 5 | Neraca | Template laporan neraca |
| 6 | Posting | Aturan auto-posting debit/credit. **PENTING:** Tabel `dbPostHutPiut` juga diisi dari sini (lihat 6.1) |
| 7 | Arus Kas | Template cash flow |
| 8 | Setting Lampiran | Lampiran dokumen per transaksi |

### 6.1 Posting Perkiraan (dbPostHutPiut) — Prasyarat Sub-Ledger Kas Bank

Tabel `dbPostHutPiut` adalah **mapping** yang menentukan kategori setiap perkiraan. Tabel ini dibaca oleh modul KasBank, Memorial, Pembelian, Penjualan untuk memutuskan apakah sebuah akun memicu sub-detail tertentu.

**Cara user mengisi (lewat FrmPosting → FrmPostHutPiut):**

| Tombol/Menu | mKode | Caption Form | Fungsi |
|-------------|-------|--------------|--------|
| **Piutang** | PT | "Piutang" | Akun piutang customer |
| **Hutang** | HT | "Hutang" | Akun hutang supplier |
| **Uang Muka Piutang** | UPT | "Uang Muka Piutang" | |
| **Uang Muka Hutang** | UHT | "Uang Muka Hutang" | |
| **Kelompok Kas** | KAS | "Kelompok Kas" | |
| **Kelompok Bank** | BANK | "Kelompok Bank" | |
| **Kelompok Aktiva** | AKV | "Kelompok Aktiva" | Butuh Biaya1, Biaya2, Persen=100% |
| **Akumulasi Penyusutan** | AKM | "Kelompok Akumulasi Penyusutan" | |
| **Pendapatan Lain-lain** | PD | "Pendapatan Lain-lain" | |
| **Pajak** | PJK | "Pajak" | |

**Field yang wajib diisi per posting:**
- **Perkiraan**: nomor akun dari dbPerkiraan (Enter → lookup)
- **Kas dan Bank?** (IsLokalExim, untuk PT/HT): centang jika akun ini bisa dipakai sebagai Lawan di transaksi KasBank
- **Biaya1 / Biaya2** (untuk AKV): akun beban susut, **persen total = 100%** (divalidasi sistem)

**Tanpa setting ini, sub-ledger settlement Kas Bank tidak akan muncul.**

## 3. Field Reference Table

### 3a. Pergiroan / COA

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Perkiraan | String | Ya | Unique, format hierarki (mis. 1-1001) |
| Keterangan | String | Ya | Nama akun |
| Kelompok | Enum | Ya | Aktiva, Kewajiban, Modal, Pendapatan, Beban |
| Tipe | Enum | Ya | General / Detail |
| Debit/Credit | Enum | Ya | Saldo normal: Debit atau Credit |
| Induk COA | Lookup | Tidak | Untuk sub-account |

### 3b. Aktiva Fisikal

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Aktiva | String | Ya | Unique |
| Nama Aktiva | String | Ya | — |
| Perkiraan | Lookup COA | Ya | Akun aktiva terkait |
| Tanggal Perolehan | Date | Ya | — |
| Kuantitas | Integer | Ya | Jumlah unit |
| Persentase Susut | Decimal (%) | Ya | Mis. 10% per tahun |
| Metode Susut | Enum | Ya | Garis lurus (default) |
| Periode Susut | Enum | Ya | Bulanan / Tahunan |
| Akumulasi Penyusutan | Lookup COA | Ya | Akun kontra-aktiva |
| Nilai Perolehan | Decimal | Ya | — |

### 3c. Saldo Awal (submenu COA)

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Perkiraan | Lookup | Ya | Referensi COA |
| Saldo Awal | Decimal | Ya | Nominal |
| Tanggal | Date | Ya | Default: hari pertama periode aktif |
| Editable | Boolean | - | Hanya `true` di awal periode |

## 4. Test Scenarios

### Skenario 1: Buat COA baru tipe General
```
Given saya di Master Accounting > Pergiroan
When saya input kode "1-1001", keterangan "Kas", kelompok "Aktiva"
And saya pilih tipe "General", debit/credit "Debit"
And klik Simpan
Then COA baru tersimpan
And saldo normal ter-set ke Debit (sesuai kelompok Aktiva)
```

### Skenario 2: Buat COA tipe Detail
```
Given saya membuat COA "1-2001" Piutang Dagang
When saya pilih tipe "Detail"
Then COA bisa dipakai di jurnal entry (memorial) detail
And tidak muncul sebagai induk sub-account
```

### Skenario 3: Koreksi COA yang sudah ada transaksi
```
Given COA "1-1001" sudah dipakai di 5 transaksi
When saya coba koreksi field "Kelompok" dari "Aktiva" ke "Pendapatan"
Then sistem menolak dengan pesan
  "COA sudah dipakai di transaksi, tidak bisa diubah kelompoknya"
```

### Skenario 4: Hapus COA Detail yang tidak terpakai
```
Given COA "1-9900" tipe Detail belum pernah dipakai
When saya klik Hapus dan konfirmasi
Then COA terhapus dari daftar
And audit log mencatat aksi hapus
```

### Skenario 5: Tambah aktiva tetap baru
```
Given saya di Master Aktiva
When saya input kode "AST-001", nama "Mesin Cetak", nilai "Rp 50.000.000"
And tanggal perolehan "2026-06-01", susut 10% garis lurus
And saya pilih COA aktiva "1-1500" dan akumulasi "1-1501"
And klik Simpan
Then aktiva tersimpan
And sistem menghitung penyusutan otomatis per tahun (Rp 5.000.000)
```

### Skenario 6: Saldo awal hanya di awal periode
```
Given periode kerja "Juni 2026" sudah lebih dari 7 hari berjalan
When saya coba input/edit saldo awal
Then sistem menolak dengan pesan
  "Saldo awal hanya dapat diedit di awal periode (7 hari pertama)"
```

### Skenario 7: Setting lampiran aktif
```
Given saya di Setting Lampiran
When saya centang "Lampirkan foto bukti" untuk transaksi Kas Bank
Then setiap simpan transaksi Kas Bank wajib upload minimal 1 lampiran
```

### Skenario 8: Posting rule debit/credit
```
Given saya di Master Posting
When saya buat rule: kode "BKM" → debit "Kas" + credit "Piutang Dagang"
And saya Simpan
Then setiap transaksi BKM akan auto-post sesuai rule ini
And field debit/credit terisi otomatis di jurnal memorial
```

## 5. Database Impact

| Aksi | Tabel Affected | Posting Debit/Credit |
|------|---------------|---------------------|
| Tambah COA | `tbl_coa` | — (master data) |
| Tambah Aktiva | `tbl_aktiva`, `tbl_coa` (akumulasi) | — |
| Hitung penyusutan bulanan | `tbl_penyusutan` | Debit Beban Penyusutan / Credit Akumulasi |
| Set saldo awal | `tbl_saldo_awal` | — (hanya initial balance) |
| Update posting rule | `tbl_posting_rule` | — |

## 6. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Kode COA duplikat | Tolak + pesan "Kode perkiraan sudah ada" |
| Hapus COA yang punya saldo | Tolak + tampilkan "Saldo saat ini: Rp X, pindahkan dulu" |
| Tipe COA salah (Detail untuk transaksi umum) | Tolak + saran gunakan COA General |
| Tanggal perolehan aktiva < tanggal periode aktif | Warning tapi boleh lanjut |
| Persentase susut > 100 | Tolak + pesan "Maksimal 100%" |
| Posting rule debit = credit (akun sama) | Tolak + pesan "Akun debit dan credit harus berbeda" |
