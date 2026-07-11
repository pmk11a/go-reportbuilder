# Bab 13 — Transaksi Marketing (Penjualan)

## Overview

Modul **Marketing** adalah pusat pencatatan aktivitas penjualan barang/jasa kepada customer. Modul ini menangani **Sales Order (SO)**, **Delivery Order (DO / Surat Jalan)**, **Faktur Penjualan (Invoice)**, dan **Retur Penjualan**. Modul Marketing adalah **kebalikan** dari Purchasing — input di sini memicu kartu stok keluar (Gudang) dan piutang customer (Akunting). Sebelum modul ini digunakan, master **Customer**, **Sales**, **Barang**, dan **Gudang** wajib sudah terisi.

[SCREENSHOT: menu-marketing]

---

## 13.1 Jenis Dokumen Marketing

| Kode | Kepanjangan | Fungsi |
|------|-------------|--------|
| **SO** | Sales Order | Pesanan penjualan dari customer |
| **DO** | Delivery Order / Surat Jalan | Bukti pengiriman barang ke customer |
| **INV** | Invoice / Faktur Penjualan | Tagihan ke customer (dasar piutang) |
| **RPJ** | Retur Penjualan | Pengembalian barang dari customer |

[SCREENSHOT: jenis-dokumen-marketing]

---

## 13.2 Form Header Sales Order (SO)

### Tabel Field — Header

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor SO | Teks (auto) | Ya* | Format: `Urutan-KodePerusahaan-Tanggal` |
| Tanggal SO | Date | Ya* | Tanggal pesanan diterima |
| Customer | Dropdown | Ya* | Pilih dari Master Customer |
| Alamat Kirim | Teks | Ya* | Alamat tujuan pengiriman |
| Sales | Dropdown | Ya* | Pilih dari Master Sales (kategori Sales) |
| Mata Uang | Dropdown | Ya* | IDR, USD, SGD, dll |
| Kurs | Angka | Otomatis | Diambil otomatis sesuai mata uang |
| Termin Pembayaran | Dropdown | Ya* | Cash / Net 7 / Net 30 / Net 60 / Custom |
| Tanggal Kirim | Date | Ya* | Rencana tanggal pengiriman |
| Referensi | Teks | - | Referensi pesanan customer (PO customer, dll) |
| Keterangan | Teks | - | Catatan tambahan |

### Detail Customer (Auto-Fill)

| Field | Sumber | Keterangan |
|-------|--------|------------|
| NPWP | Master Customer | Untuk dokumen pajak |
| Kontak Person | Master Customer | Narahubung customer |
| Alamat Customer | Master Customer | Alamat lengkap |
| Sub-Detail Akun Default | Master Customer | Rekening piutang (lihat [Bab 5](05-master-supplier-customer.md)) |
| Plafon Piutang | Master Customer | Batas maksimum piutang customer ini |

[SCREENSHOT: so-header]

---

## 13.3 Form Detail SO (Sub-Grid)

### Tabel Field — Baris Detail

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Barang | Dropdown | Ya* | Pilih dari Master Bahan (filter: Barang Jadi) |
| Nama Barang | Auto | Auto | Terisi otomatis |
| Group/Subgroup | Auto | Auto | Terisi otomatis |
| Satuan | Dropdown | Ya* | Default dari Master Bahan |
| Kuantitas | Angka | Ya* | Jumlah pesanan (dalam satuan yang dipilih) |
| Harga Satuan | Angka | Ya* | Harga jual per satuan |
| Diskon (%) | Angka | - | Potongan per baris |
| PPN | Dropdown | Ya* | Include / Exclude / Non-PPN |
| Gudang Asal | Dropdown | Ya* | Lokasi barang diambil (lihat [Bab 4](04-master-bahan.md)) |
| Keterangan | Teks | - | Catatan per baris |

### Perhitungan Baris

```
Subtotal = Kuantitas × Harga Satuan
Diskon   = Subtotal × (Diskon% / 100)
DPP      = Subtotal - Diskon
PPN      = DPP × 11%
Total    = DPP + PPN
```

[SCREENSHOT: so-detail]

---

## 13.4 Alur Lengkap Sales Order

```
[Customer Kirim Pesanan]
        │
        ▼
[1] Input Sales Order (SO)
        │ - Pilih Customer, Sales, Barang
        │ - Simpan → Status = OPEN
        ▼
[2] Approval SO (berjenjang, tergantung nilai)
        │ - SO < plafon customer: langsung APPROVED
        │ - SO ≥ plafon customer: butuh approval manager
        │ - Status = APPROVED
        ▼
[3] Buat Delivery Order (DO)
        │ - Pilih SO yang APPROVED
        │ - Qty dikirim (≤ qty SO)
        │ - Simpan → Stok barang KELUAR (Gudang)
        │           → SO status = PARTIAL/FULL
        ▼
[4] Buat Invoice (INV)
        │ - Pilih DO acuan
        │ - Otomatis terposting ke Piutang Dagang
        │ - Sub-Ledger Customer ter-update
        │ - Status DO = INVOICED
        ▼
[5] Customer Bayar (Modul Akunting)
        │ - BKM (Bank Masuk) di [Bab 8]
        │ - Pilih Lawan = Piutang Dagang
        │ - Pilih Customer → muncul tagihan INV
        │ - Klik Pelunasan → Simpan
        ▼
[6] (Opsional) Retur Penjualan (RPJ)
        │ - Jika customer mengembalikan barang
        │ - Pilih DO acuan
        │ - Stok bertambah kembali, piutang berkurang
        ▼
[7] Reporting: Cetak laporan penjualan, kartu piutang
```

---

## 13.5 Delivery Order (DO / Surat Jalan)

Bukti pengiriman barang ke customer. DO memicu **pengurangan stok** di modul Gudang.

### Hubungan SO → DO

```
SO (APPROVED)
  │
  ├─ DO #1 (qty 50 dari 100)  → SO status = PARTIAL
  │
  └─ DO #2 (qty 50 dari 100)  → SO status = FULL
```

| Status SO | Keterangan |
|-----------|------------|
| **OPEN** | SO dibuat, belum ada barang dikirim |
| **APPROVED** | Disetujui, siap dikirim |
| **PARTIAL** | Sebagian barang sudah dikirim |
| **FULL** | Seluruh barang sudah dikirim |
| **INVOICED** | Sudah dibuat invoice |
| **CANCELLED** | SO dibatalkan |

### Tabel Field — DO

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor DO | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal Kirim | Date | Ya* | Tanggal barang fisik dikirim |
| SO Acuan | Dropdown | Ya* | Pilih SO yang APPROVED |
| Customer | Auto | Auto | Terisi otomatis dari SO |
| Sales | Auto | Auto | Terisi otomatis dari SO |
| Gudang Asal | Dropdown | Ya* | Sesuai SO atau gudang aktual |
| Ekspedisi | Teks | - | Jasa pengiriman (jika pakai) |
| No. Resi | Teks | - | Nomor resi pengiriman (opsional) |
| Keterangan | Teks | - | Catatan pengiriman |

### Validasi Stok

Sebelum DO dapat disimpan, sistem mengecek:
- Stok barang di gudang asal **harus cukup** (≥ qty yang akan dikirim).
- Jika stok tidak cukup, sistem **menolak** DO dan menampilkan pesan error.
- Solusi: lakukan produksi (lihat [Bab 15 Produksi](15-produksi.md)) atau transfer stok dari gudang lain.

### Dampak DO

| Modul | Dampak |
|-------|--------|
| **Kartu Stok (Gudang)** | Stok barang **berkurang** di gudang asal |
| **SO** | Status berubah (PARTIAL/FULL) |
| **Piutang** | Belum ter-update (piutang baru ada saat INV dibuat) |

[SCREENSHOT: form-do]

---

## 13.6 Invoice / Faktur Penjualan (INV)

Dokumen tagihan ke customer. INV adalah **dasar pengakuan piutang** di sub-ledger customer.

### Tabel Field — Invoice

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor INV | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal INV | Date | Ya* | Tanggal faktur dibuat |
| DO Acuan | Dropdown | Ya* | Pilih DO yang menjadi dasar |
| Customer | Auto | Auto | Terisi otomatis dari DO |
| Sales | Auto | Auto | Terisi otomatis dari DO |
| Termin Pembayaran | Dropdown | Ya* | Otomatis dari SO, bisa diubah |
| Tanggal Jatuh Tempo | Date | Otomatis | Tanggal INV + termin (misal: Net 30 = INV date + 30 hari) |
| Keterangan | Teks | - | Catatan tambahan |

### Auto-Posting INV

| Sisi | Akun | Nominal |
|------|------|---------|
| **Debit** | Piutang Dagang (sub-ledger: customer) | DPP + PPN |
| **Kredit** | Pendapatan Penjualan | DPP |
| **Kredit** | PPN Keluaran | PPN |

> **Catatan:** Auto-posting ini **terjadi otomatis** saat INV disimpan. Invoice tidak perlu di-input manual ke Memorial — sistem sudah menanganinya.

### Dampak INV

| Modul | Dampak |
|-------|--------|
| **Buku Besar (Akunting)** | Posting Piutang Dagang, Pendapatan, PPN Keluaran |
| **Sub-Ledger Customer** | Tagihan baru tercatat dengan tanggal jatuh tempo |
| **DO** | Status berubah menjadi INVOICED |

[SCREENSHOT: form-invoice]

---

## 13.7 Retur Penjualan (RPJ)

Dokumen untuk mencatat pengembalian barang dari customer karena kondisi tidak sesuai.

### Tabel Field — RPJ

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor RPJ | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal Retur | Date | Ya* | Tanggal barang diterima kembali |
| DO Acuan | Dropdown | Ya* | Pilih DO asal barang |
| Customer | Auto | Auto | Terisi otomatis |
| Alasan Retur | Dropdown | Ya* | Rusak / Salah Spec / Kadaluarsa / Kelebihan / Lainnya |
| Kondisi Barang | Dropdown | Ya* | Bisa Dijual Kembali / Rusak / Dimusnahkan |
| Keterangan | Teks | - | Penjelasan detail |

### Dampak RPJ

| Modul | Dampak |
|-------|--------|
| **Kartu Stok (Gudang)** | Stok barang **bertambah** kembali di gudang (jika Bisa Dijual Kembali) |
| **DO** | Anotasi retur (tidak menghapus DO) |
| **Sub-Ledger Customer** | Mengurangi nilai piutang customer (lewat jurnal Memorial) |
| **Pendapatan** | Berkurang (lewat jurnal Memorial — Retur Penjualan) |

[SCREENSHOT: form-retur-penjualan]

---

## 13.8 Auto-Posting Marketing

| Aksi | Debit | Kredit | Catatan |
|------|-------|--------|---------|
| **Delivery Order (DO)** | *(HPP dicatat saat INV)* | *(Pendapatan dicatat saat INV)* | DO hanya update stok, belum pengakuan pendapatan |
| **Invoice (INV)** | Piutang Dagang (sub-ledger customer) | Pendapatan Penjualan + PPN Keluaran | Piutang baru + Pendapatan baru |
| **Retur Penjualan (RPJ)** | Retur Penjualan / Persediaan | Piutang Dagang (sub-ledger customer) | Mengurangi piutang + menambah persediaan |
| **BKM (Bayar Piutang)** | Kas/Bank | Piutang Dagang (sub-ledger customer) | Lihat [Bab 8](08-kasbank.md) |

> **Catatan:** Berbeda dengan Purchasing yang pakai 2-step (PBL dulu, utang menyusul), Marketing juga pakai 2-step: **DO dulu** (stok keluar), **INV menyusul** (pendapatan + piutang). Ini mengikuti prinsip **revenue recognition** — pendapatan baru boleh diakui saat barang dikirim (DO), dan piutang baru terbentuk saat invoice diterbitkan (INV).

---

## Validation Rules

- **Periode kerja harus terbuka** (lihat [Bab 2](02-setup.md)).
- **Customer harus aktif** dan memiliki Sub-Detail Akun default (lihat [Bab 5](05-master-supplier-customer.md)).
- **Sales harus aktif** dan terkait dengan karyawan berkategori Sales (lihat [Bab 7](07-master-lain.md)).
- **Stok harus cukup** di gudang asal sebelum DO dapat disimpan.
- Kuantitas DO **tidak boleh melebihi** sisa qty SO yang belum dikirim.
- Kuantitas RPJ **tidak boleh melebihi** qty yang sudah dikirim di DO.
- SO yang sudah FULL/INVOICED **tidak dapat diedit**, hanya dapat dilihat dan dibuat RPJ.
- **Plafon piutang customer** harus dicek: total piutang berjalan + SO baru tidak boleh melebihi plafon. Jika melebihi, butuh approval manager.
- **Otorisasi berjenjang** berlaku sesuai level user (lihat [Bab 2](02-setup.md)).

---

## Hak CRUD & Otorisasi

| Aksi | Hak yang Diperlukan |
|------|---------------------|
| Buat SO baru | Tambah |
| Koreksi SO (status DRAFT) | Koreksi |
| Koreksi SO (status OPEN) | Koreksi + Otorisasi |
| Buat DO | Tambah |
| Buat INV | Tambah + Otorisasi (kecuali INV tanpa DO — hanya retur) |
| Buat RPJ | Tambah + Otorisasi Level ≥ 2 |
| Cetak Faktur | Tampil + Akses Report |
| Otorisasi SO (jika > plafon) | Otorisasi Manager |

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Periode sudah dikunci | "Periode tidak dapat dibuka. Hubungi administrator" |
| Customer tidak punya Sub-Detail Akun | "Customer belum memiliki akun default" |
| Stok gudang tidak cukup | "Stok barang tidak cukup di gudang [nama gudang]. Stok tersedia: X" |
| Qty DO > sisa SO | "Kuantitas pengiriman melebihi sisa qty SO" |
| Qty RPJ > qty DO | "Kuantitas retur melebihi qty yang sudah dikirim" |
| SO > plafon customer, belum approval | "Total piutang melebihi plafon customer. Butuh approval manager" |
| Barang tidak aktif | "Barang sudah tidak aktif" |
| Sales tidak terkait karyawan Sales | "Sales harus terkait dengan karyawan berkategori Sales" |
| INV tanpa DO acuan | "Pilih DO acuan terlebih dahulu" |
| SO sudah INVOICED, coba diedit | "SO dengan status INVOICED tidak dapat diedit" |
| Otorisasi gagal | "Level 1 harus diotorisasi terlebih dahulu" |
| User tanpa hak | "Anda tidak memiliki akses untuk modul Marketing" |

---

## Flow Lengkap (End-to-End)

```
[1] Marketing: Input SO
        │ - Pilih Customer, Sales
        │ - Pilih Barang + Gudang
        │ - Simpan → Status = OPEN/APPROVED
        ▼
[2] Marketing: DO (Pengiriman)
        │ - Acuan ke SO
        │ - Qty dikirim
        │ - Simpan → Stok berkurang (Gudang)
        │            → SO status = PARTIAL/FULL
        ▼
[3] Marketing: INV (Invoice)
        │ - Acuan ke DO
        │ - Simpan → Auto-posting:
        │     Debit: Piutang Dagang (sub-ledger customer)
        │     Kredit: Pendapatan Penjualan + PPN Keluaran
        │   → Sub-Ledger Customer: tagihan baru + jatuh tempo
        ▼
[4] Akunting: BKM (Terima Pembayaran Customer)
        │ - Pilih Lawan = Piutang Dagang
        │ - Pilih Customer → muncul INV belum lunas
        │ - Klik Pelunasan → Simpan
        │ - Sub-Ledger Customer: catat pelunasan
        ▼
[5] (Opsional) Marketing: RPJ
        │ - Jika ada barang diretur
        │ - Stok bertambah, piutang/pendapatan berkurang
        ▼
[6] Reporting: Cetak laporan penjualan, kartu piutang, laba rugi
```

---

## Hubungan dengan Modul Lain

- **Master Customer ([Bab 5](05-master-supplier-customer.md))** → SO memilih customer dari master ini.
- **Master Sales ([Bab 5](05-master-supplier-customer.md))** → Sales dipilih dari karyawan berkategori Sales.
- **Master Bahan ([Bab 4](04-master-bahan.md))** → Barang yang dijual harus di Master Bahan dengan kategori Barang Jadi.
- **Master Gudang ([Bab 4](04-master-bahan.md))** → DO memilih gudang asal barang.
- **Gudang ([Bab 14](14-gudang.md))** → Setiap DO otomatis kurangi stok di kartu stok.
- **Akunting ([Bab 8](08-kasbank.md), [Bab 9](09-memorial.md))** → INV otomatis posting jurnal; pembayaran piutang via BKM.

---

## Catatan Operator

> **2-Step Revenue Recognition:** Marketing juga menggunakan 2-step — DO dulu (stok keluar), INV menyusul (pendapatan + piutang). Ini mengikuti PSAK 23 (Pendapatan) — pendapatan baru boleh diakui saat barang dikirim. Jika ingin pengakuan pendapatan saat SO (bukan DO), konfigurasi dapat diubah di Master Posting ([Bab 3](03-master-accounting.md)).
>
> **Plafon Piutang:** Master Customer memiliki field plafon piutang. Jika SO baru menyebabkan total piutang > plafon, sistem meminta approval manager. Hal ini mencegah customer menumpuk piutang melebihi batas yang disepakati.
>
> **Retur Penjualan vs Retur Pembelian:** Retur penjualan **menambah** stok (barang kembali ke gudang). Retur pembelian **mengurangi** stok (barang keluar dari gudang). Perhatikan akun yang ter-impact di Memorial.
