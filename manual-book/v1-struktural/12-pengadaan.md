# Bab 12 — Transaksi Pengadaan (Procurement)

## Overview

Modul **Pengadaan (Procurement)** adalah alur hulu (upstream) sebelum **Purchasing**. Modul ini menangani proses identifikasi kebutuhan, permintaan pembelian, permintaan penawaran, hingga kontrak dengan supplier. Berbeda dengan Purchasing yang fokus pada dokumen pesanan (PO), Pengadaan fokus pada **proses permintaan, evaluasi, dan negosiasi** yang menghasilkan PO. Modul ini biasanya digunakan oleh bagian procurement/PPIC, bukan langsung oleh accounting.

[SCREENSHOT: menu-pengadaan]

---

## 12.1 Jenis Dokumen Pengadaan

| Kode | Kepanjangan | Fungsi |
|------|-------------|--------|
| **PR** | Permintaan Pembelian (Purchase Request) | Dokumen permintaan dari departemen/user |
| **PQ** | Permintaan Penawaran (Price Quotation Request) | Dokumen RFQ ke beberapa supplier |
| **QT** | Quotation (Penawaran dari Supplier) | Dokumen penawaran harga dari supplier |
| **EV** | Evaluasi Penawaran | Perbandingan beberapa quotation untuk pilih supplier |
| **CT** | Kontrak (Contract) | Perjanjian jangka panjang dengan supplier |
| **SPB** | Surat Pesanan Barang | Output akhir sebelum di-generate jadi PO |

[SCREENSHOT: jenis-dokumen-pengadaan]

---

## 12.2 Alur Pengadaan End-to-End

```
[Departemen/User Butuh Barang]
        │
        ▼
[1] Input Purchase Request (PR)
        │ - Pilih departemen peminta
        │ - Pilih barang & qty
        │ - Tanggal dibutuhkan
        │ - Status = OPEN
        ▼
[2] Approval PR (berjenjang)
        │ - Atasan departemen
        │ - Manager procurement
        │ - (Opsional) Direksi
        │ - Status = APPROVED / REJECTED
        ▼
[3] Generate RFQ (Permintaan Penawaran)
        │ - Pilih PR yang sudah APPROVED
        │ - Pilih 2–N supplier kandidat
        │ - Kirim RFQ (via email/cetak/portal)
        │ - Status = SENT
        ▼
[4] Supplier Kirim Quotation (QT)
        │ - Input harga, termin, lead time
        │ - Status PR = IN PROGRESS
        ▼
[5] Evaluasi Penawaran (EV)
        │ - Sistem tampilkan side-by-side semua QT
        │ - Kriteria: harga, kualitas, lead time, historis
        │ - Pilih supplier pemenang
        │ - Status = EVALUATED
        ▼
[6] Generate Kontrak (CT) [Opsional]
        │ - Untuk pembelian rutin/jangka panjang
        │ - Isi: periode, harga deal, MOQ, termin pembayaran
        │ - Status = ACTIVE
        ▼
[7] Generate SPB / PO
        │ - SPB = Surat Pesanan Barang (dokumen internal)
        │ - PO = Purchase Order (lihat Bab 11)
        │ - PO ter-link ke supplier pemenang dari EV
        │ - Status PR = CLOSED
        ▼
[8] (Lanjut ke Modul Purchasing) → [Bab 11]
```

---

## 12.3 Purchase Request (PR)

Dokumen permintaan pembelian yang diinput oleh departemen/user yang membutuhkan barang.

### Tabel Field — Header PR

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor PR | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal PR | Date | Ya* | Tanggal permintaan dibuat |
| Departemen Peminta | Dropdown | Ya* | Pilih dari Master Departemen (lihat [Bab 7](07-master-lain.md)) |
| Pemohon | Dropdown | Ya* | Karyawan yang mengajukan (lihat [Bab 7](07-master-lain.md)) |
| Tanggal Dibutuhkan | Date | Ya* | Kapan barang harus tersedia |
| Prioritas | Dropdown | Ya* | Rendah / Sedang / Tinggi / Mendesak |
| Keterangan | Teks | - | Justifikasi permintaan |

### Tabel Field — Detail PR

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Barang | Dropdown | Ya* | Pilih dari Master Bahan |
| Nama Barang | Auto | Auto | Terisi otomatis |
| Kuantitas | Angka | Ya* | Jumlah yang diminta |
| Satuan | Dropdown | Ya* | Default dari Master Bahan |
| Gudang Tujuan | Dropdown | Ya* | Lokasi barang akan diletakkan |
| Spesifikasi | Teks | - | Detail teknis yang dibutuhkan |
| Keterangan | Teks | - | Catatan per baris |

### Status PR

| Status | Keterangan |
|--------|------------|
| **DRAFT** | Baru dibuat, belum disubmit |
| **OPEN** | Sudah disubmit, menunggu approval |
| **APPROVED** | Disetujui, siap untuk RFQ |
| **REJECTED** | Ditolak oleh approver |
| **IN PROGRESS** | Sedang dalam proses RFQ/Evaluasi |
| **CLOSED** | Sudah di-generate jadi PO |
| **CANCELLED** | Dibatalkan oleh pemohon |

[SCREENSHOT: form-pr]

---

## 12.4 Permintaan Penawaran (RFQ / PQ)

Dokumen RFQ yang dikirim ke beberapa supplier untuk meminta quotation.

### Tabel Field — RFQ

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor RFQ | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal RFQ | Date | Ya* | Tanggal RFQ dikirim |
| PR Acuan | Dropdown | Ya* | Pilih PR yang sudah APPROVED |
| Supplier Kandidat | Multi-select | Ya* | Pilih 2-N supplier dari Master Supplier |
| Batas Akhir Penawaran | Date | Ya* | Deadline supplier kirim QT |
| Keterangan | Teks | - | Syarat teknis/khusus yang diminta |

### Cara Kirim RFQ

- **Cetak** — di-print lalu dikirim via pos/kurir
- **Email** — langsung kirim ke email supplier (jika fitur email integration aktif)
- **Portal** — supplier login ke portal untuk akses RFQ (jika fitur portal aktif)

[SCREENSHOT: form-rfq]

---

## 12.5 Quotation (QT) — Penawaran dari Supplier

Setelah supplier menerima RFQ, mereka mengirim balik dokumen penawaran. Data QT diinput ke sistem oleh bagian procurement.

### Tabel Field — Quotation

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor QT | Teks (auto) | Ya* | Penomoran otomatis |
| RFQ Acuan | Dropdown | Ya* | Pilih RFQ yang sedang diproses |
| Supplier | Auto | Auto | Terisi otomatis dari RFQ |
| Tanggal QT | Date | Ya* | Tanggal quotation dibuat supplier |
| Masa Berlaku | Date | Ya* | Sampai kapan harga berlaku |
| Termin Pembayaran | Dropdown | Ya* | Cash / Net 7 / Net 30 / dll |
| Lead Time | Angka | Ya* | Hari kerja dari PO sampai barang datang |
| Kuantitas | Angka | Ya* | Sesuai PR |
| Harga Satuan | Angka | Ya* | Harga penawaran per satuan |
| Diskon (%) | Angka | - | Opsional |
| PPN | Dropdown | Ya* | Include / Exclude / Non-PPN |
| Keterangan | Teks | - | Syarat tambahan dari supplier |

[SCREENSHOT: form-qt]

---

## 12.6 Evaluasi Penawaran (EV)

Modul perbandingan side-by-side beberapa quotation untuk memilih supplier pemenang.

### Antarmuka Evaluasi

Sistem menampilkan tabel perbandingan:

| Kriteria | Supplier A | Supplier B | Supplier C | Bobot |
|----------|-----------|-----------|-----------|-------|
| Harga Satuan | 10.000 | 9.500 | 10.200 | 40% |
| Total Harga | 50.000.000 | 47.500.000 | 51.000.000 | (auto) |
| Lead Time (hari) | 14 | 21 | 10 | 30% |
| Termin | Net 30 | Net 7 | Net 60 | 15% |
| Kualitas (rating 1-5) | 4 | 3 | 5 | 15% |
| **Skor Total** | 78 | 72 | 88 | 100% |

### Tabel Field — EV

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor EV | Teks (auto) | Ya* | Penomoran otomatis |
| RFQ Acuan | Dropdown | Ya* | Pilih RFQ yang dievaluasi |
| Tanggal Evaluasi | Date | Ya* | Tanggal evaluasi dilakukan |
| Supervisor Procurement | Dropdown | Ya* | Karyawan yang melakukan evaluasi |
| Supplier Pemenang | Dropdown | Ya* | Dipilih dari daftar QT yang masuk |
| Justifikasi | Teks | Ya* | Alasan pemilihan (untuk audit trail) |
| Bobot Kriteria | Konfigurasi | - | Bobot per kriteria (admin) |

[SCREENSHOT: form-evaluasi]

---

## 12.7 Kontrak (CT)

Untuk pembelian rutin atau jangka panjang, kontrak digunakan untuk **mengunci** harga, termin, dan kondisi dengan supplier.

### Tabel Field — Kontrak

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor Kontrak | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal Mulai | Date | Ya* | Awal periode kontrak |
| Tanggal Akhir | Date | Ya* | Akhir periode kontrak |
| Supplier | Dropdown | Ya* | Pihak yang menandatangani |
| Jenis Kontrak | Dropdown | Ya* | Harga Tetap / Call Off / Framework / Spot |
| MOQ | Angka | Ya* | Minimum order quantity |
| Harga Deal | Angka | Ya* | Harga yang disepakati (bisa per item atau total) |
| Termin Pembayaran | Dropdown | Ya* | Cash / Net 7 / Net 30 / Custom |
| Klausul Denda | Teks | - | Penalty jika ada wanprestasi |
| Lampiran Kontrak | File | - | Dokumen kontrak PDF/scan |

### Status Kontrak

| Status | Keterangan |
|--------|------------|
| **DRAFT** | Baru dibuat |
| **ACTIVE** | Berlaku dan bisa digunakan untuk PO |
| **EXPIRED** | Sudah lewat tanggal akhir |
| **TERMINATED** | Diakhiri sebelum tanggal akhir |

[SCREENSHOT: form-kontrak]

---

## 12.8 Generate PO dari Pengadaan

Setelah supplier pemenang dipilih (atau kontrak aktif), sistem dapat **generate PO otomatis** dengan data dari PR/Quotation/Kontrak.

### Alur Generate

```
[Pilih PR APPROVED] + [Pilih QT Pemenang] / [Pilih Kontrak ACTIVE]
        │
        ▼
[Sistem auto-fill form PO]
        - Supplier (dari QT)
        - Barang + Qty (dari PR)
        - Harga (dari QT atau Kontrak)
        - Termin (dari QT atau Kontrak)
        │
        ▼
[Review & Simpan PO] → Lanjut ke [Bab 11 Purchasing]
        │
        ▼
[Update Status PR → CLOSED]
```

### Kontrol Validasi Generate

- Hanya PR berstatus **APPROVED** yang bisa di-generate.
- Quotation harus **masih berlaku** (tidak kadaluarsa).
- Kontrak harus berstatus **ACTIVE** dan belum **EXPIRED**.
- Satu PR dapat menghasilkan satu atau lebih PO (jika qty besar atau supplier berbeda per item).

---

## Validation Rules

- **Periode kerja harus terbuka** untuk semua dokumen Pengadaan.
- PR yang sudah CLOSED **tidak dapat diedit** lagi.
- Quotation yang sudah dipakai di PO berstatus **LOCKED** (tidak bisa diedit).
- Kontrak yang EXPIRED tidak dapat dipilih untuk PO baru.
- Satu evaluasi hanya bisa memilih **satu supplier pemenang**.
- Tanggal akhir kontrak harus **setelah** tanggal mulai.
- PR tidak bisa dibuat untuk barang yang **tidak ada di Master Bahan** (lihat [Bab 4](04-master-bahan.md)).
- Departemen peminta harus **aktif** (lihat [Bab 7](07-master-lain.md)).
- **Otorisasi berjenjang** berlaku untuk PR ≥ nilai tertentu (lihat [Bab 2](02-setup.md) untuk level otorisasi).

### Aturan Approval PR

| Nilai PR (estimasi) | Approver yang Diperlukan |
|---------------------|--------------------------|
| < Rp 5.000.000 | Supervisor Departemen |
| Rp 5.000.000 – 50.000.000 | Manager Departemen + Manager Procurement |
| > Rp 50.000.000 | Manager + Direksi |

> **Catatan:** Threshold nilai di atas adalah default/asumsi umum. Konfigurasi threshold dapat diubah oleh admin.

---

## Hak CRUD & Otorisasi

| Aksi | Hak yang Diperlukan |
|------|---------------------|
| Buat PR | Tambah |
| Submit PR | Tambah + Otorisasi |
| Approve/Reject PR | Otorisasi (per level) |
| Buat RFQ | Tambah |
| Input Quotation | Tambah |
| Buat Evaluasi | Tambah + Otorisasi |
| Pilih Supplier Pemenang | Otorisasi Manager Procurement |
| Buat Kontrak | Tambah + Otorisasi Direksi |
| Generate PO | Tambah + Otorisasi |
| Edit Kontrak ACTIVE | Koreksi + Otorisasi Direksi |

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Periode sudah dikunci | "Periode tidak dapat dibuka. Hubungi administrator" |
| PR belum APPROVED, generate PO | "PR harus disetujui terlebih dahulu" |
| Quotation kadaluarsa | "Masa berlaku quotation sudah habis" |
| Kontrak EXPIRED | "Kontrak sudah tidak berlaku" |
| Tanggal akhir ≤ tanggal mulai | "Tanggal akhir kontrak harus setelah tanggal mulai" |
| Supplier tidak punya Sub-Detail Akun | "Supplier belum memiliki akun default" |
| Barang tidak di Master Bahan | "Barang belum terdaftar di Master Bahan" |
| Generate PO tanpa pilih supplier pemenang | "Pilih supplier pemenang dari evaluasi terlebih dahulu" |
| Edit Kontrak ACTIVE tanpa otorisasi | "Hanya direksi yang dapat mengubah kontrak aktif" |
| User tanpa hak procurement | "Anda tidak memiliki akses untuk modul Pengadaan" |

---

## Hubungan dengan Modul Lain

- **Master Bahan ([Bab 4](04-master-bahan.md))** → PR memilih barang dari master ini.
- **Master Supplier ([Bab 5](05-master-supplier-customer.md))** → RFQ dan Quotation memilih supplier dari master ini.
- **Master Departemen ([Bab 7](07-master-lain.md))** → PR membutuhkan departemen peminta.
- **Master Karyawan ([Bab 7](07-master-lain.md))** → Pemohon dan approver memilih dari master ini.
- **Purchasing ([Bab 11](11-purchasing.md))** → Output akhir Pengadaan adalah PO yang di-generate dan dilanjutkan ke modul Purchasing.
- **Akunting ([Bab 8](08-kasbank.md), [Bab 9](09-memorial.md))** → Setelah barang datang (PBL) dan invoice diterima, jurnal Memorial Tambah Utang dilakukan.

---

## Catatan Operator

> **Pengadaan ≠ Purchasing:** Modul Pengadaan fokus pada **proses** (request → RFQ → evaluasi → kontrak). Modul Purchasing fokus pada **dokumen pesanan** (PO → PBL → RPB). Untuk perusahaan kecil, kedua modul bisa digabung; untuk perusahaan besar dengan proses procurement formal, kedua modul wajib terpisah.
>
> **Kontrak vs Quotation:** Kontrak digunakan untuk **kerjasama jangka panjang** (harga deal, periode, MOQ). Quotation digunakan untuk **transaksi spot** (satu kali pesanan). Jika supplier sudah punya kontrak aktif, RFQ dan Quotation bisa dilewati — langsung generate PO dari kontrak.
>
> **Evaluasi sebagai Audit Trail:** Hasil evaluasi (skor, justifikasi, supplier pemenang) **wajib** diinput lengkap dan tidak dapat dihapus. Data ini menjadi jejak audit untuk transparansi pemilihan supplier.
