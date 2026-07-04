# Bab 3 — Master Accounting

## Overview

Modul **Master Accounting** adalah pusat pengaturan seluruh akun (perkiraan) yang menjadi tulang punggung pembukuan. Modul ini mencakup Chart of Accounts (COA), Aktiva, Utang-Piutang, Laba Rugi, Neraca, Posting, Arus Kas, dan Setting Lampiran. Pengisian master ini **wajib** dilakukan sebelum transaksi apapun.

[SCREENSHOT: master-accounting-menu]

---

## 3.1 Perkiraan (Chart of Accounts / COA)

Daftar seluruh akun/perkiraan pembukuan yang digunakan untuk transaksi.

### Tipe Perkiraan

| Tipe | Penggunaan |
|------|------------|
| **General** | Akun untuk transaksi umum |
| **Detail** | Akun untuk transaksi jurnal (journal entry) dan sub-ledger |

### Tabel Field

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Perkiraan | Teks | Ya* | Kode unik akun (misal 1-1001 untuk Kas) |
| Keterangan | Teks | Ya* | Nama akun (misal "Kas Besar") |
| Kelompok | Dropdown | Ya* | Aktiva, Kewajiban, Modal, Pendapatan, Beban |
| Tipe | Dropdown | Ya* | General / Detail |
| Saldo Normal | Dropdown | Ya* | Debit / Credit |
| Debit | Angka | - | Posisi debit (otomatis sesuai saldo normal) |
| Credit | Angka | - | Posisi credit (otomatis sesuai saldo normal) |

### Sub-Submenu: Saldo Awal

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Kode Perkiraan | Dropdown | Ya* | Akun yang diisi saldonya |
| Periode | Date | Ya* | Hanya awal periode |
| Saldo Awal Debit | Angka | - | Nominal saldo awal sisi debit |
| Saldo Awal Credit | Angka | - | Nominal saldo awal sisi credit |

**Validation Rules:**
- Pengisian saldo awal **hanya** dapat dilakukan di awal periode (bulan pertama tahun aktif).
- Setelah periode berjalan, saldo awal **tidak dapat diubah** kecuali melalui transaksi memorial.
- Satu akun hanya boleh memiliki satu saldo awal per periode.

[SCREENSHOT: coa-form]

### Flow Input Saldo Awal

```
[Buka Submenu Saldo Awal] --> [Pilih Periode (wajib awal)] --> [Pilih Akun] --> [Isi Nominal Debit/Credit]
                              --> [Simpan] --> [Saldo awal tercatat di buku besar]
```

---

## 3.2 Aktiva (Aktiva Tetap)

Modul untuk mengelola aset tetap perusahaan (mesin, kendaraan, bangunan, dll) dan perhitungan penyusutannya.

### Tabel Field — Grup Aktiva

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Grup | Teks | Ya* | Pengelompokan berdasarkan akun aktiva |
| Nama Grup | Teks | Ya* | Nama deskriptif |
| Akun Perkiraan | Dropdown | Ya* | Kelompok akun aktiva terkait |

### Tabel Field — Aktiva Fisik

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Aktiva | Teks | Ya* | Identifier unik |
| Nama Aktiva | Teks | Ya* | Deskripsi aset (Mesin, Kendaraan, dll) |
| Grup Aktiva | Dropdown | Ya* | Pilih dari Grup Aktiva |
| Tanggal Perolehan | Date | Ya* | Kapan aset diperoleh |
| Kuantitas | Angka | Ya* | Jumlah unit/unit fisik |
| Persentase Susut | Angka (%) | Ya* | Tingkat penyusutan |
| Metode Penyusutan | Dropdown | Ya* | Garis lurus (straight-line) |
| Periode Penyusutan | Dropdown | Ya* | Bulanan / Tahunan |
| Akumulasi Penyusutan | Dropdown | Ya* | Akun perkiraan untuk akumulasi |

### Perhitungan Penyusutan

```
Penyusutan per Periode = (Nilai Aktiva - Nilai Residu) × (% Susut) / Periode
```

### Validation Rules
- Aktiva **harus** terhubung ke akun perkiraan yang termasuk kelompok aktiva.
- Master aktiva bisa juga di-*create* otomatis dari transaksi memorial (lihat [Bab 9](09-memorial.md)).
- Akumulasi penyusutan akan terposting otomatis ke akun akumulasi sesuai master posting.

[SCREENSHOT: master-aktiva]

---

## 3.3 Modul Accounting Lainnya

| Modul | Deskripsi Singkat |
|-------|-------------------|
| **Utang-Piutang** | Setup rekening utang/piutang untuk menghubungkan dengan supplier/customer |
| **Laba Rugi** | Akun-akun untuk laporan laba rugi (pendapatan & beban) |
| **Neraca** | Akun-akun untuk laporan posisi keuangan |
| **Posting** | Konfigurasi rekening debit/credit otomatis tiap jenis transaksi |
| **Arus Kas** | Pengelompokan akun untuk laporan arus kas |
| **Setting Lampiran** | Pengaturan attachment/dokumen pendukung per transaksi |

> **Catatan:** Detail teknis modul di atas hanya sebatas pengenalan. Pengaturan lebih lanjut dilakukan oleh administrator sistem. Modul-modul ini menjadi fondasi untuk transaksi di [Bab 8](08-kasbank.md) dan [Bab 9](09-memorial.md).

---

### 3.3.1 Posting — Mengkategorikan Perkiraan untuk Sub-Ledger

Tabel internal `dbPostHutPiut` adalah **mapping** yang menentukan kategori setiap perkiraan. Tabel ini yang dibaca oleh modul KasBank, Memorial, Pembelian, Penjualan untuk memutuskan apakah sebuah akun memicu sub-detail tertentu (settlement piutang, settlement hutang, pencatatan aktiva, dsb).

**Cara user mengisi (lewat FrmPosting → FrmPostHutPiut):**

1. Buka **Setting → Posting → Post Perkiraan** (FrmPosting)
2. Pilih kategori posting yang sesuai. Setiap kategori membuka form FrmPostHutPiut dengan `mKode` tertentu:

   | Tombol/Menu | mKode | Caption Form | Fungsi |
   |-------------|-------|--------------|--------|
   | **Piutang** | PT | "Piutang" | Akun piutang customer |
   | **Hutang** | HT | "Hutang" | Akun hutang supplier |
   | **Uang Muka Piutang** | UPT | "Uang Muka Piutang" | Akun uang muka yang diterima dari customer |
   | **Uang Muka Hutang** | UHT | "Uang Muka Hutang" | Akun uang muka yang dibayar ke supplier |
   | **Kelompok Kas** | KAS | "Kelompok Kas" | Akun kas |
   | **Kelompok Bank** | BANK | "Kelompok Bank" | Akun bank |
   | **Kelompok Aktiva** | AKV | "Kelompok Aktiva" | Akun aktiva tetap (perlu Biaya1, Biaya2, Persen susut) |
   | **Akumulasi Penyusutan** | AKM | "Kelompok Akumulasi Penyusutan" | Akun lawan susut |
   | **Pendapatan Lain-lain** | PD | "Pendapatan Lain-lain" | Akun pendapatan non-operasional |
   | **Pajak** | PJK | "Pajak" | Akun pajak |

3. Setelah form terbuka, klik **Tambah** (atau tekan INSERT)
4. Isi field-field berikut:

   | Field | Wajib | Keterangan |
   |-------|-------|------------|
   | **Perkiraan** | Ya | Nomor akun dari dbPerkiraan (Enter → lookup ke master Perkiraan) |
   | **Kas dan Bank?** (IsLokalExim) | Ya, untuk PT/HT | Centang jika akun ini bisa dipilih sebagai Lawan di transaksi KasBank |
   | **Akumulasi** (untuk AKV) | Ya | Akun akumulasi penyusutan lawannya |
   | **Biaya1 / Biaya2** (untuk AKV) | Ya | Akun biaya penyusutan; **persen biaya1 + persen biaya2 harus = 100%** (sistem validasi) |
   | **Persen Biaya1 / Biaya2** (untuk AKV) | Ya | Persentase alokasi biaya; total = 100% |
   | **IsBeliJual** | Tidak | Penanda akun ini untuk transaksi beli atau jual |

5. Klik **Simpan** (F2)
6. Ulangi untuk semua perkiraan yang perlu dikategorikan

**Penting untuk transaksi KasBank (Bab 8):**
- Akun yang akan dipakai sebagai "Perkiraan Lawan" di transaksi kas/bank **harus** sudah di-posting di sini, dengan centang **"Kas dan Bank?"** = Ya
- Jika akun lawan tidak ada di dbPostHutPiut, form sub-ledger settlement **tidak akan muncul** (lihat Bab 8.4)
- Untuk akun aktiva, harus lengkap: posting AKV (akun aktiva) + AKM (akumulasi) + Biaya1/Biaya2 (akun beban susut) + Persen = 100%

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Saldo awal diinput setelah periode berjalan | "Saldo awal hanya dapat diisi di awal periode" |
| Akun tanpa saldo normal | "Akun harus memiliki saldo normal Debit atau Credit" |
| Aktiva tanpa grup | "Aktiva harus terhubung ke grup aktiva" |
| Duplikat kode perkiraan | "Kode perkiraan sudah digunakan" |

---

## Hubungan dengan Modul Lain

- **Master Supplier/Customer** → setiap supplier/customer punya detail akun (perkiraan kas/piutang/utang).
- **Transaksi Kas Bank** → akun kas/bank dari COA digunakan sebagai default lawan.
- **Memorial** → debit/credit jurnal selalu merujuk ke perkiraan di COA.