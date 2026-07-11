# Bab 10 — Peta Integrasi Antar Modul

## Overview

Bab ini memetakan seluruh keterkaitan antar modul di **ERP Trade Exchange**: urutan setup, dependency (modul mana yang menjadi prasyarat modul lain), alur posting otomatis (auto-posting), dan cross-link antar transaksi. Tujuannya agar operator memahami **dampak satu transaksi** terhadap modul lain.

[SCREENSHOT: integration-map-overview]

---

## 10.1 Urutan Setup Sistem (Dependency Order)

Modul-modul harus di-setup dalam urutan sebagai berikut. Melewatkan urutan akan menyebabkan error saat input transaksi.

```
[Berkas > Setup Periode Kerja]              [Bab 2]
            │
            ▼
[Berkas > Set Perusahaan & Nomor]           [Bab 2]
            │
            ▼
[Berkas > Set Pemakaian — User Management]  [Bab 2]
            │
            ▼
[Master Accounting > COA + Saldo Awal]      [Bab 3]
            │
            ▼
[Master Accounting > Master Aktiva]         [Bab 3]
            │
            ▼
[Master Accounting > Master Posting]        [Bab 3]
            │
            ├──► [Master Bahan > Gudang, Group, Subgroup, Item]   [Bab 4]
            │
            ├──► [Master Supplier/Customer > Area, Kota, Supplier, Customer, Sales]  [Bab 5]
            │            │
            │            └──► [Master Lain > Departemen, Jabatan, Karyawan]  [Bab 7]
            │
            └──► [Master Produksi > Machine, Tarif Tenaga Kerja]  [Bab 6]
                              │
                              └──► [Tarif TK butuh Master Karyawan]
            │
            ▼
[Berkas > Kunci Periode Kerja (jika perlu)]  [Bab 2]
            │
            ▼
[Transaksi: Purchasing / Marketing / Produksi / Gudang / Akunting]
            │
            └──► [Akunting > Kas Bank]     [Bab 8]
            └──► [Akunting > Memorial]     [Bab 9]
```

---

## 10.2 Modul Dependency Map

Visualisasi ketergantungan antar modul:

```
                              ┌─────────────────────┐
                              │  Periode Kerja (Berkas)│
                              └──────────┬──────────┘
                                         │
                ┌────────────────────────┼────────────────────────┐
                ▼                        ▼                        ▼
        ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
        │  User Mgmt    │        │  Perusahaan   │        │  COA / Saldo  │
        │  (Set Pemakaian)        │  (Profil)    │        │  Awal         │
        └──────┬────────┘        └───────────────┘        └──────┬────────┘
               │                                                │
               ▼                                                ▼
        ┌──────────────────────────────────────────────────────────────┐
        │                    MASTER DATA                                │
        ├──────────────┬──────────────┬──────────────┬─────────────────┤
        │ Accounting   │ Bahan/Barang │ Supplier/    │ Produksi +      │
        │ (COA, Aktiva,│ (Gudang,     │ Customer     │ Lain-Lain       │
        │  Posting)    │  Group, Item)│ (Area, Kota, │ (Mesin, Tarif,  │
        │              │              │  Supplier,   │  Departemen,    │
        │              │              │  Customer,   │  Jabatan,       │
        │              │              │  Sales)      │  Karyawan,      │
        │              │              │              │  Desain)        │
        └──────┬───────┴──────┬───────┴──────┬───────┴────┬────────────┘
               │              │              │            │
               └──────────────┴──────────────┴────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │     TRANSAKSI        │
                          ├─────────────────────┤
                          │ Purchasing          │
                          │ Marketing           │
                          │ Produksi            │
                          │ Gudang              │
                          │ Akunting:           │
                          │   ├─ Kas Bank  (BKM/BKK/BBM/BBK)  [Bab 8]
                          │   └─ Memorial (Jurnal)            [Bab 9]
                          └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │     REPORTING        │
                          │   (Modul Reporting)  │
                          └─────────────────────┘
```

---

## 10.3 Tabel Auto-Posting (Mapping Transaksi → Jurnal)

Setiap jenis transaksi menghasilkan **posting otomatis** ke buku besar. Tabel ini menjadi acuan validasi hasil transaksi.

### Auto-Posting: Kas Bank

| Jenis | Debit | Kredit | Catatan |
|-------|-------|--------|---------|
| **BKM** (Bank Masuk) | Kas/Bank | Lawan (piutang/pendapatan) | Sub-ledger customer update jika ada pelunasan |
| **BKK** (Bank Keluar) | Lawan (beban/utang) | Kas/Bank | Nominal positif; sisi Kredit diisi otomatis; sub-ledger supplier update jika ada pelunasan |
| **BBM** (Buku Masuk) | Akun target (kas/bank/piutang) | Lawan (sumber non-tunai) | Penerimaan non-tunai |
| **BBK** (Bukti Bank Keluar) | Lawan (sumber/tujuan) | Akun target | Pengeluaran non-tunai |

### Auto-Posting: Memorial

| Jenis Memorial | Debit | Kredit | Catatan |
|----------------|-------|--------|---------|
| Jurnal biasa | Akun beban/biaya | Akun sumber dana (kas/bank/lain) | Manual pairing |
| Tambah Aktiva | Perkiraan Aktiva | Kas/Bank | Auto-create ke Master Aktiva |
| Hapus Aktiva | Kas/Bank | Perkiraan Aktiva | Hapus dari Master Aktiva |
| Tambah Utang | Akun beban/kas/bank | Utang Dagang | Sub-ledger supplier + tagihan baru |
| Lunas Utang | Utang Dagang | Kas/Bank | Sub-ledger supplier update |
| Tambah Piutang | Sumber dana/bayaran | Piutang Dagang | Sub-ledger customer + tagihan baru |
| Lunas Piutang | Piutang Dagang | Kas/Bank | Sub-ledger customer update |

---

## 10.4 Cross-Link antar Modul

### Master → Transaksi

| Modul Master | Digunakan Oleh | Keterangan |
|--------------|----------------|------------|
| **Master Accounting (COA)** | Semua modul transaksi | Daftar akun untuk debit/credit |
| **Master Aktiva** | Memorial, Kas Bank | Penambahan/penghapusan aktiva |
| **Master Posting** | Kas Bank, Memorial | Konfigurasi akun otomatis per jenis transaksi |
| **Master Gudang** | Transaksi stok, produksi | Lokasi fisik barang |
| **Master Bahan** | Purchasing, Produksi, Marketing | Item barang yang dijual/dibeli/diproduksi |
| **Master Supplier** | Purchasing, Kas Bank, Memorial | Pihak supplier + sub-ledger utang |
| **Master Customer** | Marketing, Kas Bank, Memorial | Pihak customer + sub-ledger piutang |
| **Master Sales** | Marketing/Sales Order | Karyawan berkategori Sales |
| **Master Karyawan** | Sales, Tarif TK, Otorisasi | Referensi data personalia |
| **Master Departemen/Jabatan** | Karyawan, User Management | Struktur organisasi |
| **Master Machine & Tarif** | Produksi | Perhitungan biaya mesin |
| **Master Desain** | Reporting | Layout dokumen cetak |

### Transaksi → Modul Lain (Dampak)

| Transaksi | Dampak ke |
|-----------|-----------|
| **BKM (Bank Masuk)** | Buku Besar (Debit Kas), Sub-Ledger Customer (jika ada pelunasan) |
| **BKK (Bank Keluar)** | Buku Besar (Kredit Kas), Sub-Ledger Supplier (jika ada pelunasan) |
| **BBM (Buku Masuk)** | Buku Besar |
| **BBK (Bukti Bank Keluar)** | Buku Besar |
| **Memorial — Tambah Aktiva** | Buku Besar + Master Aktiva (auto-create) |
| **Memorial — Hapus Aktiva** | Buku Besar + Master Aktiva (remove) |
| **Memorial — Utang** | Buku Besar + Sub-Ledger Supplier |
| **Memorial — Piutang** | Buku Besar + Sub-Ledger Customer |

---

## 10.5 Posting Reconciliation (Sub-Ledger vs Buku Besar)

Setiap transaksi yang melibatkan sub-ledger harus dijaga **keseimbangan**:

```
Total Posting di Sub-Ledger = Total Posting di Buku Besar
```

**Mekanisme:**
1. Transaksi diinput → simpan
2. Sistem otomatis post ke **Buku Besar** (debit/credit total)
3. Sistem otomatis post ke **Sub-Ledger** per supplier/customer (detail per entitas)
4. Kedua posting harus selalu balance — jika tidak, sistem menampilkan error rekonsiliasi

[SCREENSHOT: reconciliation-view]

---

## 10.6 Alur Transaksi End-to-End (Contoh: Pembelian Bahan Baku)

```
[1] Purchasing: Input PO (Purchase Order)
        │ - Pilih Supplier (dari Master Supplier/Customer)
        │ - Pilih Bahan (dari Master Bahan)
        │ - Pilih Gudang (dari Master Gudang)
        ▼
[2] Penerimaan Barang di Gudang
        │ - Posting ke Kartu Stok
        ▼
[3] Akunting: Memorial — Tambah Utang (jika belum bayar)
        │ - Debit: Persediaan Bahan
        │ - Kredit: Utang Dagang
        │ - Sub-Ledger Supplier: catat tagihan baru
        ▼
[4] Akunting: BKK (Bayar Utang Supplier)
        │ - Debit: Utang Dagang
        │ - Kredit: Kas/Bank
        │ - Sub-Ledger Supplier: catat pelunasan
        │ - Historis kartu utang update
        ▼
[5] Reporting: Cetak laporan utang, kartu stok, buku besar
```

---

## 10.7 Akses User antar Modul

Setiap user memiliki akses yang diatur di **Set Pemakaian** ([Bab 2](02-setup.md)):

| Modul | Hak yang Mungkin |
|-------|------------------|
| Master Accounting | Tampil, Tambah, Koreksi, Hapus (per role) |
| Master Bahan | Tampil, Tambah, Koreksi, Hapus |
| Master Supplier/Customer | Tampil, Tambah, Koreksi, Hapus |
| Master Lain-Lain | Tampil, Tambah, Koreksi, Hapus |
| Master Produksi | Tampil, Tambah, Koreksi, Hapus |
| Transaksi Kas Bank | Tampil, Tambah, Koreksi, Hapus, Otorisasi |
| Transaksi Memorial | Tampil, Tambah, Koreksi, Hapus, Otorisasi |
| Reporting | Akses Report, Desain Report |
| Akses COA | Filter perkiraan yang boleh diakses |

---

## 10.8 Validasi Lintas Modul

Saat input transaksi, sistem melakukan **cross-module validation**:

| Validasi | Penjelasan |
|----------|------------|
| Periode terbuka | Berlaku untuk semua transaksi |
| User punya hak | Per modul + per COA filter |
| Akun aktif | Perkiraan yang dipilih harus aktif di COA |
| Supplier/Customer aktif | Sub-ledger hanya muncul untuk entitas aktif |
| Master referensi tersedia | Misal: Sales Order butuh master Sales |
| Saldo cukup | Untuk transaksi yang mengurangi saldo akun (jika relevan) |

---

## 10.9 Rekomendasi Operasional

> **Urutan Kerja Harian:**
> 1. Login & buka periode aktif ([Bab 1](01-navigation.md), [Bab 2](02-setup.md))
> 2. Input transaksi harian (Kas Bank + Memorial) → [Bab 8](08-kasbank.md), [Bab 9](09-memorial.md)
> 3. Cek sub-ledger untuk memastikan rekonsiliasi
> 4. Generate laporan (Modul Reporting)
> 5. Tutup hari dengan **Lock** ([Bab 2](02-setup.md))
>
> **Master Data hanya diubah jika:**
> - Ada supplier/customer baru
> - Ada barang baru (Master Bahan)
> - Ada karyawan baru (terutama kategori Sales)
> - Perubahan struktur organisasi (Departemen/Jabatan)
>
> **Hindari perubahan master di tengah periode aktif** karena dapat merusak integritas data historis.

---

## Ringkasan Cross-Reference Bab

| Topik | Bab Terkait |
|-------|-------------|
| Setup awal | [Bab 2](02-setup.md) |
| Akun perkiraan | [Bab 3](03-master-accounting.md) |
| Master barang | [Bab 4](04-master-bahan.md) |
| Master supplier/customer | [Bab 5](05-master-supplier-customer.md) |
| Master produksi | [Bab 6](06-master-produksi.md) |
| Master personalia | [Bab 7](07-master-lain.md) |
| Transaksi kas/bank | [Bab 8](08-kasbank.md) |
| Transaksi jurnal | [Bab 9](09-memorial.md) |
| Daftar istilah | [Lampiran Glossary](appendix-glossary.md) |