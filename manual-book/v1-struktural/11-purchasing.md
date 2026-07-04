# Bab 11 — Transaksi Pengadaan & Purchasing (Procurement-to-Pay)

## Overview

Modul **Pengadaan & Purchasing** mencakup seluruh alur pembelian barang dan jasa — dari identifikasi kebutuhan hingga barang diterima di gudang. Alur ini terbagi menjadi dua tahap:

| Tahap | Cakupan | Output |
|-------|---------|--------|
| **Pengadaan (Procurement)** — Hulu | Identifikasi kebutuhan, permintaan pembelian, penawaran supplier, evaluasi, kontrak | PO siap eksekusi |
| **Purchasing** — Hilir | Eksekusi pesanan, penerimaan barang, retur pembelian | Barang masuk gudang + jurnal ke buku besar |

> **Catatan:** Di sistem Delphi PWT, kedua tahap ini tidak memiliki modul terpisah. Dokumen procurement (PR, RFQ, QT) tersebar di beberapa folder transaksi: `SPP/`, `PO/`, `PO1/`, `Beli/`, `Pembelian/`, `CLOSINGPR/`, `RBELI/`, `Retur Beli/`.

---

## 11.1 Jenis Dokumen

| Kode | Dokumen | Tahap | Keterangan |
|------|---------|-------|------------|
| **PR** | Purchase Requisition | Pengadaan | Permintaan pembelian dari departemen |
| **RFQ** / **PQ** | Request for Quotation / Permintaan Penawaran | Pengadaan | Dokumen permintaan harga ke supplier |
| **QT** | Quotation | Pengadaan | Penawaran harga dari supplier |
| **EV** | Evaluasi Penawaran | Pengadaan | Perbandingan beberapa quotation |
| **CT** | Kontrak | Pengadaan | Perjanjian jangka panjang dengan supplier |
| **SPB** | Surat Pesanan Barang | Pengadaan | Output akhir sebelum di-generate jadi PO |
| **PO** | Purchase Order | Purchasing | Surat pesanan resmi ke supplier |
| **PBL** / **LPB** | Penerimaan Barang / Laporan Penerimaan Barang | Purchasing | Bukti barang diterima di gudang |
| **RPB** | Retur Pembelian | Purchasing | Dokumen pengembalian barang ke supplier |

[SCREENSHOT: jenis-dokumen-pengadaan-purchasing]

---

## 11.2 Alur End-to-End

```
[Departemen/User Butuh Barang]
            │
            ▼
[1] Purchase Requisition (PR)
        │ - Departemen peminta isi: barang, qty, tanggal butuh
        │ - Status PR = DRAFT
        │ - Submit → Status PR = WAITING APPROVAL
        ▼
[2] Approval PR
        │ - Atasan approve → Status PR = APPROVED
        │ - PR siap diproses procurement
        ▼
[3] Procurement Proses PR
        │ - Pilih supplier yang akan dimintai penawaran
        │ - Generate RFQ dari PR
        │ - Status PR = IN PROGRESS
        ▼
[4] Supplier Kirim Quotation (QT)
        │ - Input harga, termin, lead time dari supplier
        │ - Beberapa supplier bisa kirim QT untuk 1 RFQ
        ▼
[5] Evaluasi Penawaran (EV)
        │ - Sistem tampilkan side-by-side semua QT
        │ - Kriteria: harga, kualitas, lead time, histori
        │ - Pilih supplier pemenang
        ▼
[6] Generate SPB / PO
        │ - Dari QT pemenang → generate Surat Pesanan Barang
        │ - Atau langsung generate Purchase Order
        │ - PO bisa dibuat tanpa melalui PR (pembelian langsung)
        ▼
[7] Purchase Order (PO) — TAHAP PURCHASING DIMULAI
        │ - Header: supplier, tanggal, mata uang, termin
        │ - Detail: barang, qty, harga, diskon, PPN
        │ - Otorisasi L1 → L2
        ▼
[8] Supplier Kirim Barang
        │
        ▼
[9] Penerimaan Barang (PBL / LPB)
        │ - Input barang yang datang
        │ - Bandingkan dengan PO: qty, spesifikasi
        │ - Otorisasi L1 → L2
        │ - Trigger jurnal ke buku besar + kartu stok gudang
        ▼
[10] Barang Masuk Gudang
            │
            ├─ PBL PARIAL → PO.qty_received < PO.qty_ordered
            │     └─ Tunggu kiriman berikutnya → buat PBL lagi
            │
            ├─ PBL FULL → PO.qty_received = PO.qty_ordered
            │     └─ PO.status = CLOSED
            │
            └─ BUAT RETUR PEMBELIAN (RPB)
                  └─ Pilih PBL acuan → barang yang diretur
                        → Jurnal balik ke supplier
```

---

## 11.3 Purchase Requisition (PR)

Form awal untuk mengajukan kebutuhan pembelian.

### Tabel Field — Header PR

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor PR | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal PR | Date | Ya* | Tanggal permintaan dibuat |
| Departemen Peminta | Dropdown | Ya* | Pilih dari master Departemen |
| Pemohon | Dropdown | Ya* | User yang mengajukan |
| Keperluan | Teks | - | Alasan pembelian |
| Tanggal Dibutuhkan | Date | Ya* | Kapan barang harus tersedia |

### Tabel Field — Baris Detail PR

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Barang | Dropdown | Ya* | Dari Master Bahan |
| Nama Barang | Teks (auto) | - | Terisi otomatis |
| Spesifikasi | Teks | - | Detail teknis yang dibutuhkan |
| Kuantitas | Numerik | Ya* | Jumlah yang diminta |
| Satuan | Dropdown | - | Unit of measure |
| Gudang Tujuan | Dropdown | Ya* | Lokasi barang akan diletakkan |
| Keterangan | Teks | - | Catatan per baris |

### Status PR

| Status | Keterangan |
|--------|------------|
| **DRAFT** | Baru dibuat, belum disubmit |
| **WAITING APPROVAL** | Sudah disubmit, menunggu atasan |
| **APPROVED** | Disetujui, siap diproses procurement |
| **IN PROGRESS** | Sedang dalam proses pengadaan (RFQ/QT) |
| **CLOSED** | Semua barang sudah di-PO-kan atau PR dibatalkan |
| **REJECTED** | Ditolak oleh approver |

### Aturan Validasi PR

- Barang yang sudah ada PO tidak bisa dihapus dari PR
- PR dengan status APPROVED tidak bisa diedit (harus reject dulu)
- Kuantitas PR tidak bisa diubah setelah ada PO yang mengacu

---

## 11.4 Permintaan Penawaran (RFQ / PQ)

Dokumen yang dikirim ke beberapa supplier untuk meminta quotation.

### Tabel Field — RFQ

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor RFQ | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal RFQ | Date | Ya* | Tanggal RFQ dikirim |
| Acuan PR | Dropdown | - | PR yang menjadi referensi |
| Supplier | Dropdown | Ya* | Supplier yang dimintai penawaran |
| Batas Penawaran | Date | Ya* | Deadline supplier kirim QT |
| Syarat Pembayaran | Teks | - | Termin, cara bayar |

### Tabel Field — Baris Detail RFQ (dari PR)

| Nama Field | Keterangan |
|------------|------------|
| Kode Barang | Otomatis dari PR |
| Nama Barang | Otomatis dari PR |
| Kuantitas | Dari PR (bisa disesuaikan) |
| Satuan | Dari PR |
| Spesifikasi | Dari PR |

---

## 11.5 Quotation (QT)

Supplier mengirim balik dokumen penawaran. Data QT diinput ke sistem oleh bagian procurement.

### Tabel Field — Quotation

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor QT | Teks (auto) | Ya* | Penomoran otomatis |
| Acuan RFQ | Dropdown | Ya* | RFQ yang direferensi |
| Supplier | Teks (auto) | - | Dari RFQ |
| Tanggal QT | Date | Ya* | Tanggal penawaran diterima |
| Harga Satuan | Numerik | Ya* | Harga per unit dari supplier |
| Diskon (%) | Numerik | - | Diskon dari supplier |
| PPN | Pilihan | Ya* | Include / Exclude / Non-PPN |
| Lead Time (hari) | Numerik | - | Estimasi waktu pengiriman |
| Termin Pembayaran | Teks | - | Syarat bayar dari supplier |
| Mata Uang | Dropdown | Ya* | IDR / USD / etc. |

---

## 11.6 Evaluasi Penawaran (EV)

Sistem menampilkan side-by-side perbandingan beberapa QT untuk memilih supplier terbaik.

Kriteria evaluasi:
- **Harga total** (setelah diskon + PPN)
- **Lead time** pengiriman
- **Termin pembayaran**
- **Histori supplier** (on-time delivery, kualitas, retur)

Setelah evaluasi: pilih QT pemenang → lanjut ke Kontrak atau langsung generate SPB/PO.

---

## 11.7 Purchase Order (PO) — Header

Setelah supplier dipilih, PO dibuat sebagai surat pesanan resmi.

### Tabel Field — Header PO

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor PO | Teks (auto) | Ya* | Format: `Urutan-KodePerusahaan-Tanggal` (lihat [Bab 2](02-setup.md)) |
| Tanggal PO | Date | Ya* | Tanggal pesanan dibuat |
| Supplier | Dropdown | Ya* | Pilih dari Master Supplier |
| Mata Uang | Dropdown | Ya* | IDR / USD |
| Kurs | Numerik | - | Nilai tukar (jika non-IDR) |
| Termin | Dropdown | Ya* | COD / Net 30 / Net 60 / etc. |
| Tanggal Kirim | Date | - | Estimasi tanggal barang sampai |
| Acuan SPB / PR | Dropdown | - | Referensi dari pengadaan (jika ada) |
| Alamat Kirim | Teks | - | Lokasi pengiriman (default: gudang) |
| Keterangan | Teks | - | Catatan header |

### Sub Tipe PO

| Sub Tipe | Digunakan Untuk |
|----------|-----------------|
| **Lokal** | Supplier dalam negeri |
| **Impor** | Supplier luar negeri (ada field PIB, HS Code, dll) |

[SCREENSHOT: po-header]

---

## 11.8 Purchase Order (PO) — Detail

Setelah header diisi, klik tombol **Tambah** untuk memasukkan baris detail barang.

### Tabel Field — Baris Detail

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Barang | Dropdown | Ya* | Dari Master Bahan |
| Nama Barang | Teks (auto) | - | Terisi otomatis |
| Kuantitas | Numerik | Ya* | Jumlah dipesan |
| Satuan | Dropdown | Ya* | Unit of measure |
| Harga Satuan | Numerik | Ya* | Harga per unit |
| Diskon (%) | Numerik | - | Diskon per baris |
| PPN | Pilihan | Ya* | Include / Exclude / Non-PPN |
| Gudang Tujuan | Dropdown | - | Lokasi penyimpanan |
| Spesifikasi | Teks | - | Detail teknis per baris (opsional) |
| Tanggal Kirim | Date | - | Per-baris delivery date |

### Perhitungan Baris

```
Subtotal = Kuantitas × Harga Satuan
Diskon   = Subtotal × (Diskon% / 100)
DPP      = Subtotal - Diskon
PPN      = DPP × 11% (jika Include/Exclude, lihat aturan PPN)
Total    = DPP + PPN
```

[SCREENSHOT: po-detail]

---

## 11.9 Penerimaan Barang (PBL / LPB)

Setelah supplier mengirim barang, petugas gudang mencatat penerimaan.

### Tabel Field — Header LPB

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor LPB | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal LPB | Date | Ya* | Tanggal barang diterima |
| Acuan PO | Dropdown | Ya* | Pilih PO yang barangnya datang |
| Supplier | Teks (auto) | - | Otomatis dari PO |
| Gudang | Dropdown | Ya* | Gudang tempat barang disimpan |
| Nomor Surat Jalan | Teks | - | Nomor dokumen pengiriman supplier |
| Keterangan | Teks | - | Catatan penerimaan |

### Tabel Field — Baris Detail LPB

| Nama Field | Keterangan |
|------------|------------|
| Kode Barang | Otomatis dari PO |
| Kuantitas PO | Jumlah yang dipesan (read-only) |
| Kuantitas Diterima | Jumlah yang datang — diisi manual |
| Satuan | Dari PO |
| Keterangan | Catatan per baris |

### Status PO Setelah LPB

| Kondisi | Status PO |
|---------|-----------|
| Belum ada LPB | OPEN |
| Sebagian diterima (qty_received < qty_ordered) | PARTIAL |
| Semua diterima (qty_received = qty_ordered) | CLOSED |

---

## 11.10 Retur Pembelian (RPB)

Barang yang sudah diterima bisa diretur ke supplier.

### Tabel Field — RPB

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor RPB | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal RPB | Date | Ya* | Tanggal retur |
| Acuan PBL | Dropdown | Ya* | Pilih penerimaan yang diretur |
| Supplier | Teks (auto) | - | Dari PBL |
| Alasan Retur | Teks | Ya* | Cacat, salah kirim, tidak sesuai spesifikasi |
| Kuantitas Retur | Numerik | Ya* | Jumlah yang dikembalikan |

---

## 11.11 Otorisasi & Jurnal Otomatis

### Level Otorisasi

| Level | Aksi |
|-------|------|
| L1 | Otorisasi awal (entry) |
| L2 | Approval final → trigger jurnal ke buku besar |

### Jurnal Otomatis (setelah Otorisasi L2)

| Aksi | Target |
|------|--------|
| Otorisasi LPB | Buku besar + kartu hutang supplier (sub-ledger) |
| Otorisasi RPB | Buku besar — jurnal balik hutang supplier |
| Otorisasi PO | Tidak langsung trigger jurnal; jurnal terjadi saat LPB |

### Yang Terjadi Saat LPB Diotorisasi

1. **Jurnal otomatis** dibuat:
   - Debit: Persediaan (atau Akun Beban sesuai COA)
   - Kredit: Hutang Dagang — Sub-ledger Supplier

2. **Kartu stok gudang** ter-update otomatis:
   - Stok barang bertambah sesuai qty diterima

3. **Kartu hutang supplier** ter-update:
   - Saldo hutang supplier bertambah

---

## 11.12 Aturan Edit & Hapus Dokumen

### Syarat Hapus

| Dokumen | Syarat |
|---------|--------|
| Hapus PR | Status DRAFT atau WAITING APPROVAL; tidak ada PO yang mengacu |
| Hapus PO | Status OPEN; belum ada PBL/LPB yang mengacu |
| Hapus LPB | Belum diotorisasi L1; jurnal belum terbuat |
| Hapus RPB | Belum diotorisasi |

### Syarat Edit

| Dokumen | Syarat |
|---------|--------|
| Edit PR | Sama seperti hapus PR |
| Edit PO | Sama seperti hapus PO |
| Edit LPB | Sama seperti hapus LPB |

### Kuantitas Berlanjut (Quantity Carry-Through)

```
PR.qty_ordered → PO.qty_ordered → PBL.qty_received → Stok.qty_on_hand
                  (qty tidak bisa > dari PR)
                                    (qty tidak bisa > dari PO)
```

---

## 11.13 Faktur Pajak

Setelah LPB diotorisasi, informasi faktur pajak dari supplier dapat diinput melalui form **Pembelian** (folder `Pembelian/` di Delphi PWT).

| Nama Field | Keterangan |
|------------|------------|
| Nomor Faktur Pajak | Dari supplier |
| Tanggal Faktur | Tanggal faktur diterbitkan |
| DPP | Dasar Pengenaan Pajak |
| PPN | Jumlah PPN (11% × DPP) |
| Keterangan | Catatan faktur |

> **Catatan:** Faktur pajak adalah dokumen terpisah dari LPB. Satu LPB bisa memiliki beberapa faktur pajak (partial invoicing), dan satu faktur bisa mencakup beberapa LPB.

---

## 11.14 ASC & Closing PR

### Penerimaan ASC

ASC (Acceptance) adalah konfirmasi akhir dari departemen peminta bahwa barang sudah sesuai. Di sistem Delphi, ini ditangani oleh form `CLOSINGPR/`.

- Form hanya menampilkan **tombol Koreksi** karena data sudah terisi dari LPB
- Yang bisa dikoreksi hanya **harga** (bukan kuantitas)
- Setelah koreksi harga → otorisasi → jurnal buku besar

### Outstanding PR

PR yang belum semua kuantitasnya di-PO-kan akan muncul di daftar **Outstanding PR**. Procurement bisa memonitor dan menindaklanjuti PR yang masih OPEN.

---

## 11.15 Hubungan dengan Modul Lain

| Modul | Hubungan |
|-------|----------|
| **Master Supplier** | Supplier dipilih di PO, LPB, RPB |
| **Master Bahan** | Barang yang dibeli ada di Master Bahan |
| **Master Accounting** | COA menentukan akun Debit di jurnal LPB |
| **Gudang** | LPB menambah stok; RPB mengurangi stok |
| **Kas Bank** | Pembayaran ke supplier |
| **Memorial** | Jurnal penyesuaian hutang (jika ada selisih) |

---

## 11.16 Perbedaan Pengadaan vs Purchasing (Ringkasan)

| Aspek | Pengadaan (Bab 11A) | Purchasing (Bab 11B) |
|-------|---------------------|----------------------|
| **Fokus** | Memutuskan beli apa & dari siapa | Memesan & menerima barang |
| **Dokumen** | PR, RFQ, QT, EV, CT, SPB | PO, PBL/LPB, RPB |
| **User** | Procurement, PPIC, Manajer | Accounting, Gudang |
| **Output** | PO siap eksekusi | Barang di gudang + jurnal |
| **Perusahaan kecil** | Bisa skip (langsung PO) | Wajib |
| **Perusahaan besar** | Wajib (kontrol procurement formal) | Wajib |

