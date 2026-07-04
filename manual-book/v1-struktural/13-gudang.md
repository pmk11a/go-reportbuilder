# Bab 13 — Transaksi Gudang (Warehouse)

## Overview

Modul **Gudang (Warehouse)** mengelola **kartu stok** dan pergerakan barang di setiap gudang: masuk (dari pembelian/produksi), keluar (untuk penjualan/pemakaian internal), dan transfer antar gudang. Modul ini **jarang diinput manual** karena sebagian besar pergerakan stok dipicu otomatis dari modul lain: **Penerimaan Barang (PBL)** di Purchasing menambah stok, **Delivery Order (DO)** di Marketing mengurangi stok, dan **Produksi** memindahkan stok bahan ke barang jadi. Input manual hanya untuk kasus khusus (stok opname, koreksi stok, transfer).

[SCREENSHOT: menu-gudang]

---

## 14.1 Jenis Transaksi Gudang

| Kode | Kepanjangan | Fungsi | Trigger |
|------|-------------|--------|---------|
| **MSK** | Stok Masuk | Penambahan stok | PBL Purchasing, Hasil Produksi, Stok Opname + |
| **KLR** | Stok Keluar | Pengurangan stok | DO Marketing, Pemakaian Bahan Produksi, Stok Opname − |
| **TRF** | Transfer | Perpindahan antar gudang | Manual / Transfer Produksi |
| **OPM** | Stok Opname | Penyesuaian stok fisik vs sistem | Manual (periodik) |
| **KRT** | Kartu Stok | Laporan mutasi per barang per gudang | Auto-generated |

[SCREENSHOT: jenis-dokumen-gudang]

---

## 14.2 Kartu Stok

**Kartu stok** adalah pusat dari modul Gudang. Setiap barang di setiap gudang memiliki kartu stok yang mencatat **riwayat mutasi** masuk dan keluar.

### Informasi di Kartu Stok

| Field | Tipe | Keterangan |
|-------|------|------------|
| Kode Barang | Teks | Identifier barang (lihat [Bab 4](04-master-bahan.md)) |
| Nama Barang | Teks | Nama barang |
| Group/Subgroup | Teks | Kategori barang |
| Satuan | Teks | Unit of measure |
| Gudang | Teks | Lokasi penyimpanan |
| **Saldo Awal** | Angka | Stok per awal periode |
| **Mutasi Masuk** | Angka | Total barang masuk periode ini |
| **Mutasi Keluar** | Angka | Total barang keluar periode ini |
| **Saldo Akhir** | Angka | Saldo Awal + Masuk − Keluar |
| Detail per Transaksi | Tabel | Daftar semua transaksi yang mempengaruhi stok |

### Tampilan Detail Kartu Stok

| Tanggal | No Bukti | Keterangan | Masuk | Keluar | Saldo |
|---------|----------|------------|-------|--------|-------|
| 2026-06-01 | - | Saldo Awal | - | - | 100 |
| 2026-06-05 | PBL-001 | Pembelian PO-001 | 50 | - | 150 |
| 2026-06-10 | DO-002 | Penjualan SO-001 | - | 30 | 120 |
| 2026-06-15 | TRF-005 | Transfer dari GD-02 | 20 | - | 140 |
| 2026-06-20 | PROD-003 | Hasil Produksi | 40 | - | 180 |
| 2026-06-25 | DO-008 | Penjualan SO-005 | - | 50 | 130 |

[SCREENSHOT: kartu-stok]

---

## 14.3 Stok Masuk (MSK)

Pencatatan penambahan stok. Umumnya dipicu otomatis dari modul lain, namun bisa juga diinput manual untuk kasus khusus (stok opname +, koreksi sistem, dll).

### Sumber Stok Masuk

| Sumber | Trigger | Akun Kredit | Keterangan |
|--------|---------|-------------|------------|
| **Penerimaan Barang (PBL)** | Purchasing | Barang di Perjalanan (Unbilled Receipt) | Stok bertambah saat PBL disimpan |
| **Hasil Produksi** | Produksi | WIP / Bahan Baku / Biaya Produksi | Stok barang jadi bertambah |
| **Stok Opname +** | Manual (OPM) | Selisih Stok / Akun Penyesuaian | Stok fisik > stok sistem |
| **Transfer Masuk** | Gudang (TRF) | Stok di Gudang Asal | Stok masuk dari gudang lain |
| **Retur Pembelian (RPB)** | Purchasing | Utang Dagang (reverse) | Stok kembali dari supplier |
| **Retur Penjualan (RPJ)** | Marketing | Retur Penjualan (reverse) | Stok kembali dari customer |

### Tabel Field — MSK (Input Manual)

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor MSK | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal | Date | Ya* | Tanggal stok masuk |
| Gudang Tujuan | Dropdown | Ya* | Gudang penerima |
| Kode Barang | Dropdown | Ya* | Pilih dari Master Bahan |
| Kuantitas | Angka | Ya* | Jumlah masuk (dalam satuan) |
| Satuan | Dropdown | Ya* | Default dari Master Bahan |
| Acuan | Teks | - | Referensi dokumen sumber (jika ada) |
| Keterangan | Teks | Ya* | Alasan masuk stok |

### Auto-Posting MSK (dari PBL)

| Sisi | Akun | Nominal |
|------|------|---------|
| **Debit** | Persediaan Bahan (sub-ledger: gudang) | Nilai HPP |
| **Kredit** | Barang di Perjalanan (Unbilled Receipt) | Nilai HPP |

[SCREENSHOT: form-msk]

---

## 14.4 Stok Keluar (KLR)

Pencatatan pengurangan stok. Umumnya dipicu otomatis, namun bisa diinput manual untuk kasus khusus (pemakaian internal, koreksi, dll).

### Sumber Stok Keluar

| Sumber | Trigger | Akun Debit | Keterangan |
|--------|---------|------------|------------|
| **Delivery Order (DO)** | Marketing | HPP (Harga Pokok Penjualan) | Stok berkurang saat DO disimpan |
| **Pemakaian Bahan Produksi** | Produksi | WIP / Barang Dalam Proses | Bahan baku dipakai untuk produksi |
| **Stok Opname −** | Manual (OPM) | Selisih Stok / Akun Penyesuaian | Stok fisik < stok sistem |
| **Transfer Keluar** | Gudang (TRF) | Stok di Gudang Tujuan | Stok keluar ke gudang lain |

### Tabel Field — KLR (Input Manual)

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor KLR | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal | Date | Ya* | Tanggal stok keluar |
| Gudang Asal | Dropdown | Ya* | Gudang pengirim |
| Kode Barang | Dropdown | Ya* | Pilih dari Master Bahan |
| Kuantitas | Angka | Ya* | Jumlah keluar (tidak boleh > saldo) |
| Satuan | Dropdown | Ya* | Default dari Master Bahan |
| Acuan | Teks | - | Referensi dokumen sumber (jika ada) |
| Keterangan | Teks | Ya* | Alasan keluar stok |

### Auto-Posting KLR (dari DO)

| Sisi | Akun | Nominal |
|------|------|---------|
| **Debit** | HPP (Harga Pokok Penjualan) | Nilai HPP barang yang keluar |
| **Kredit** | Persediaan Bahan (sub-ledger: gudang) | Nilai HPP |

[SCREENSHOT: form-klr]

---

## 14.5 Transfer Stok (TRF)

Perpindahan barang dari satu gudang ke gudang lain. Contoh: dari gudang produksi ke gudang barang jadi, atau dari gudang pusat ke gudang cabang.

### Alur Transfer

```
[Gudang A: Stok Keluar (TRF-OUT)]
        │
        ▼
[Dalam Perjalanan] (akun transit, opsional)
        │
        ▼
[Gudang B: Stok Masuk (TRF-IN)]
        │
        ▼
[Status: COMPLETED]
```

### Tabel Field — TRF

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor TRF | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal | Date | Ya* | Tanggal transfer |
| Gudang Asal | Dropdown | Ya* | Gudang pengirim |
| Gudang Tujuan | Dropdown | Ya* | Gudang penerima (tidak boleh sama dengan asal) |
| Kode Barang | Dropdown | Ya* | Pilih dari Master Bahan |
| Kuantitas | Angka | Ya* | Jumlah yang ditransfer |
| Satuan | Dropdown | Ya* | Default dari Master Bahan |
| Ekspedisi | Teks | - | Jasa pengiriman (jika ada) |
| Estimasi Tiba | Date | - | Estimasi tanggal sampai |
| Keterangan | Teks | - | Catatan tambahan |

### Auto-Posting TRF

**Jika tanpa akun transit (langsung):**
| Sisi | Akun | Nominal |
|------|------|---------|
| **Debit** | Persediaan di Gudang Tujuan | Nilai HPP |
| **Kredit** | Persediaan di Gudang Asal | Nilai HPP |

**Jika dengan akun transit (2-step):**
| Sisi | Akun | Nominal |
|------|------|---------|
| **Debit** (saat keluar) | Stok Dalam Perjalanan | Nilai HPP |
| **Kredit** (saat keluar) | Persediaan di Gudang Asal | Nilai HPP |
| **Debit** (saat sampai) | Persediaan di Gudang Tujuan | Nilai HPP |
| **Kredit** (saat sampai) | Stok Dalam Perjalanan | Nilai HPP |

[SCREENSHOT: form-trf]

---

## 14.6 Stok Opname (OPM)

Penyesuaian stok fisik dengan stok sistem. Dilakukan **periodik** (bulanan/tahunan) atau **insidentil** (jika ada kehilangan/kerusakan).

### Tabel Field — OPM

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor OPM | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal OPM | Date | Ya* | Tanggal opname dilakukan |
| Gudang | Dropdown | Ya* | Gudang yang diopname |
| Penanggung Jawab | Dropdown | Ya* | Karyawan yang melakukan opname |
| Keterangan | Teks | - | Catatan umum opname |

### Detail per Barang (Sub-Grid)

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Barang | Dropdown | Ya* | Pilih dari Master Bahan |
| Nama Barang | Auto | Auto | Terisi otomatis |
| Stok Sistem | Angka | Auto | Stok saat ini di sistem (read-only) |
| Stok Fisik | Angka | Ya* | Hasil penghitungan fisik |
| Selisih | Angka | Auto | Stok Fisik − Stok Sistem |
| Keterangan | Teks | - | Catatan selisih (hilang/rusak/ditemukan) |

### Auto-Posting OPM (per Baris Selisih)

**Selisih Positif (Stok Fisik > Sistem):**
| Sisi | Akun | Nominal |
|------|------|---------|
| **Debit** | Persediaan di Gudang | Nilai selisih |
| **Kredit** | Selisih Stok / Penyesuaian Persediaan | Nilai selisih |

**Selisih Negatif (Stok Fisik < Sistem):**
| Sisi | Akun | Nominal |
|------|------|---------|
| **Debit** | Selisih Stok / Penyesuaian Persediaan | Nilai selisih |
| **Kredit** | Persediaan di Gudang | Nilai selisih |

> **Catatan:** Selisih yang signifikan (misal >5% dari stok sistem) memerlukan approval manager sebelum disimpan.

[SCREENSHOT: form-opm]

---

## 14.7 Validasi Stok

Setiap transaksi yang mengurangi stok (KLR, DO, Transfer Keluar) **wajib** melalui validasi:

| Validasi | Penjelasan |
|----------|------------|
| **Stok Tersedia** | Stok sistem ≥ qty yang akan keluar |
| **Barang Aktif** | Barang tidak dalam status non-aktif |
| **Gudang Aktif** | Gudang tidak dalam status non-aktif |
| **Periode Terbuka** | Periode kerja belum dikunci |
| **Konversi Satuan** | Jika satuan berbeda dari master, harus ada konversi yang valid |
| **Barang di Gudang Benar** | Stok yang diambil dari gudang yang benar (jika multi-gudang) |

### Pesan Error Stok Tidak Cukup

```
Stok barang [Nama Barang] di gudang [Nama Gudang] tidak cukup.
Stok tersedia: 80 | Qty diminta: 100
```

Solusi: lakukan produksi, transfer dari gudang lain, atau revisi qty.

---

## 14.8 Auto-Posting Ringkasan Gudang

| Transaksi | Debit | Kredit |
|-----------|-------|--------|
| **MSK dari PBL** | Persediaan (gudang) | Barang di Perjalanan |
| **KLR dari DO** | HPP | Persediaan (gudang) |
| **TRF langsung** | Persediaan (gudang tujuan) | Persediaan (gudang asal) |
| **TRF 2-step** | Stok Dalam Perjalanan → Persediaan (gudang tujuan) | Persediaan (gudang asal) → Stok Dalam Perjalanan |
| **OPM + (selisih)** | Persediaan (gudang) | Selisih Stok |
| **OPM − (selisih)** | Selisih Stok | Persediaan (gudang) |
| **Hasil Produksi** | Persediaan Barang Jadi | WIP |
| **Pemakaian Bahan** | WIP | Persediaan Bahan Baku |

---

## Validation Rules

- **Periode kerja harus terbuka** untuk semua transaksi Gudang.
- **Stok tidak boleh negatif** — kuantitas keluar tidak boleh melebihi saldo tersedia.
- **Konversi satuan** harus valid jika satuan berbeda dari satuan master.
- **Multi-gudang**: jika ada multi-gudang, sistem mengecek stok **per gudang**, bukan total.
- **Stok opname** yang memiliki selisih > threshold (default 5%) butuh approval manager.
- **Transfer**: gudang asal dan tujuan **tidak boleh sama**.
- **Barang yang sudah diretur (RPB/RPJ)** akan menambah/kurangi stok sesuai kondisi barang (lihat [Bab 11](11-purchasing.md) dan [Bab 12](12-marketing.md)).
- **Otorisasi berjenjang** berlaku untuk adjustment (OPM, koreksi manual) dengan nilai signifikan.

---

## Hak CRUD & Otorisasi

| Aksi | Hak yang Diperlukan |
|------|---------------------|
| Lihat Kartu Stok | Tampil |
| Lihat Laporan Stok | Tampil + Akses Report |
| Input MSK Manual | Tambah + Otorisasi |
| Input KLR Manual | Tambah + Otorisasi |
| Input TRF | Tambah + Otorisasi |
| Input OPM | Tambah + Otorisasi Manager (untuk selisih besar) |
| Koreksi Saldo (langsung) | Koreksi + Otorisasi Direksi |

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Periode sudah dikunci | "Periode tidak dapat dibuka. Hubungi administrator" |
| Stok tidak cukup | "Stok barang tidak cukup. Stok tersedia: X" |
| Barang tidak aktif | "Barang sudah tidak aktif" |
| Gudang tidak aktif | "Gudang sudah tidak aktif" |
| Gudang asal = tujuan (TRF) | "Gudang asal dan tujuan tidak boleh sama" |
| Konversi satuan tidak valid | "Tidak ditemukan konversi satuan yang valid" |
| Selisih OPM > 5% | "Selisih melebihi threshold. Butuh approval manager" |
| User tanpa hak | "Anda tidak memiliki akses untuk modul Gudang" |
| Transfer melebihi stok | "Stok di gudang asal tidak cukup untuk transfer" |

---

## Laporan Gudang

| Laporan | Isi | Filter |
|---------|-----|--------|
| **Kartu Stok** | Riwayat mutasi per barang per gudang | Barang, Gudang, Periode |
| **Posisi Stok** | Stok terkini per barang per gudang | Gudang, Group, Periode |
| **Stok Minimum** | Daftar barang dengan stok < minimum | Gudang, Group |
| **Barang Slow Moving** | Barang dengan mutasi lambat | Periode, Threshold hari |
| **History Mutasi** | Semua mutasi masuk/keluar (audit trail) | Barang, Gudang, Periode, Jenis |

---

## Hubungan dengan Modul Lain

- **Master Bahan ([Bab 4](04-master-bahan.md))** → setiap kartu stok terkait dengan item di master ini.
- **Master Gudang ([Bab 4](04-master-bahan.md))** → setiap mutasi terkait dengan gudang di master ini.
- **Purchasing ([Bab 11](11-purchasing.md))** → PBL otomatis tambah stok; RPB otomatis kurangi stok.
- **Marketing ([Bab 12](12-marketing.md))** → DO otomatis kurangi stok; RPJ otomatis tambah stok.
- **Produksi ([Bab 14](14-produksi.md))** → output produksi tambah stok barang jadi; bahan baku yang dipakai kurangi stok bahan baku.
- **Akunting ([Bab 8](08-kasbank.md), [Bab 9](09-memorial.md))** → setiap mutasi stok menghasilkan auto-posting ke buku besar (HPP, Persediaan, Selisih Stok).
- **Reporting** → Kartu Stok adalah sumber data untuk laporan stok, laporan produksi, dan laporan penjualan.

---

## Catatan Operator

> **Modul Gudang Mostly Otomatis:** Mayoritas pergerakan stok **tidak perlu diinput manual** — sistem akan menambah/mengurangi stok otomatis saat dokumen PBL, DO, atau Produksi disimpan. Input manual hanya untuk kasus khusus: koreksi, opname, transfer non-produksi.
>
> **Kartu Stok sebagai Audit Trail:** Kartu Stok adalah **jejak audit** untuk semua pergerakan barang. Setiap baris mutasi mencatat tanggal, nomor bukti, qty, dan referensi dokumen sumber. Saat ada selisih stok, kartu stok adalah alat utama untuk menelusuri penyebabnya.
>
> **Multi-Gudang:** Jika perusahaan punya lebih dari satu gudang, perhatikan **gudang asal/tujuan** di setiap transaksi. Stok dihitung **per gudang**, bukan total. Transfer stok adalah mekanisme resmi untuk memindahkan barang antar gudang.
>
> **Nilai Stok:** Kartu stok menampilkan **qty** (jumlah fisik) dan **nilai** (HPP). Nilai dihitung dari harga perolehan saat barang masuk. Metode HPP yang umum: **FIFO** (First In First Out), **Average**, atau **Standard Cost** — konfigurasi di Master Bahan.
