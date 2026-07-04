# Bab 14 — Transaksi Produksi (Production)

## Overview

Modul **Produksi** adalah pusat pencatatan aktivitas produksi internal. Modul ini mengelola **Job Order (JO)** atau **Production Order (PO)** yang menghitung kebutuhan bahan baku, alokasi mesin, jam kerja tenaga kerja, dan menghasilkan barang jadi. Output Produksi akan **menambah stok barang jadi** (Gudang) dan **mengurangi stok bahan baku** (Gudang). Sebelum modul ini digunakan, master **Barang**, **Gudang**, **Machine & Tarif** ([Bab 6](06-master-produksi.md)), dan **Karyawan** ([Bab 7](07-master-lain.md)) wajib sudah terisi.

[SCREENSHOT: menu-produksi]

---

## 15.1 Jenis Dokumen Produksi

| Kode | Kepanjangan | Fungsi |
|------|-------------|--------|
| **JO** | Job Order | Perintah kerja produksi untuk satu batch |
| **PO** | Production Order | Sinonim Job Order (tergantung konvensi perusahaan) |
| **WIP** | Work In Process | Status barang yang sedang diproduksi |
| **FG** | Finished Goods | Status barang yang sudah selesai diproduksi |

[SCREENSHOT: jenis-dokumen-produksi]

---

## 15.2 Alur Produksi End-to-End

```
[1] Perencanaan Produksi
        │ - Berdasarkan SO (Marketing) atau permintaan internal
        │ - Tentukan qty, deadline, jenis barang
        ▼
[2] Input Job Order (JO)
        │ - Pilih barang jadi yang akan diproduksi
        │ - Tentukan qty produksi
        │ - Sistem auto-generate Bill of Materials (BOM)
        │ - Pilih mesin & alokasi tarif TK
        │ - Status = PLANNED
        ▼
[3] Release JO
        │ - Material Released ke produksi
        │ - Stok bahan baku KELUAR (Gudang)
        │ - Stok WIP BERTAMBAH (Gudang)
        │ - Status = RELEASED
        ▼
[4] Eksekusi Produksi
        │ - Mesin jalan, TK bekerja
        │ - Catat jam kerja aktual, output, scrap
        │ - Status = IN PROGRESS
        ▼
[5] Penyelesaian Produksi
        │ - Hasil produksi selesai
        │ - Stok barang jadi BERTAMBAH (Gudang)
        │ - Stok WIP BERKURANG (Gudang)
        │ - Status = COMPLETED
        ▼
[6] Closing JO
        │ - Hitung selisih biaya produksi (standard vs actual)
        │ - Posting variance (jika ada)
        │ - Status = CLOSED
        ▼
[7] Reporting: Cetak laporan produksi, HPP produksi, efisiensi
```

---

## 15.3 Form Header Job Order (JO)

### Tabel Field — Header

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nomor JO | Teks (auto) | Ya* | Penomoran otomatis |
| Tanggal JO | Date | Ya* | Tanggal JO dibuat |
| SO Acuan (opsional) | Dropdown | - | Jika produksi untuk memenuhi SO tertentu (lihat [Bab 12](12-marketing.md)) |
| Barang Jadi | Dropdown | Ya* | Pilih dari Master Bahan (kategori: Barang Jadi Produksi) |
| Nama Barang | Auto | Auto | Terisi otomatis |
| Kuantitas Produksi | Angka | Ya* | Jumlah barang jadi yang akan diproduksi |
| Satuan | Dropdown | Ya* | Default dari Master Bahan |
| Gudang Bahan Baku | Dropdown | Ya* | Sumber bahan baku |
| Gudang Barang Jadi | Dropdown | Ya* | Tujuan barang jadi |
| Tanggal Mulai | Date | Ya* | Rencana mulai produksi |
| Tanggal Selesai | Date | Ya* | Target selesai produksi |
| Penanggung Jawab | Dropdown | Ya* | Supervisor produksi (karyawan kategori Produksi) |
| Prioritas | Dropdown | Ya* | Rendah / Sedang / Tinggi / Mendesak |
| Keterangan | Teks | - | Catatan tambahan |

[SCREENSHOT: form-jo-header]

---

## 15.4 Form Detail JO (Sub-Grid)

Detail JO terdiri dari 3 sub-grid: **Bahan Baku (BOM)**, **Mesin**, dan **Tenaga Kerja**.

### 15.4.1 Sub-Grid Bahan Baku (BOM)

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Bahan | Dropdown | Ya* | Pilih dari Master Bahan (filter: Bahan Baku, Bahan Bantu) |
| Nama Bahan | Auto | Auto | Terisi otomatis |
| Kuantitas per Unit | Angka | Ya* | Kebutuhan bahan untuk 1 unit barang jadi |
| Kuantitas Total | Auto | Auto | Kuantitas per Unit × Kuantitas Produksi |
| Satuan | Dropdown | Ya* | Default dari Master Bahan |
| Stok Tersedia | Angka | Auto | Stok sistem di gudang bahan baku |
| Status | Auto | Auto | Available / Shortage / Not Available |

### Bill of Materials (BOM)

BOM adalah **resep produksi** yang menentukan kebutuhan bahan per unit barang jadi. Sistem akan otomatis generate BOM dari Master Bahan (relasi parent-child) atau dari BOM history produksi sebelumnya.

**Contoh BOM Kertas A4:**
| Bahan | Qty per Unit | Satuan |
|-------|--------------|--------|
| Pulp Kayu | 0.5 | kg |
| Air | 2.0 | liter |
| Pewarna | 0.05 | kg |
| Energi (overhead) | auto | - |

[SCREENSHOT: bom-detail]

### 15.4.2 Sub-Grid Mesin

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Kode Mesin | Dropdown | Ya* | Pilih dari Master Machine (lihat [Bab 6](06-master-produksi.md)) |
| Nama Mesin | Auto | Auto | Terisi otomatis |
| Tarif per Jam | Angka | Auto | Dari Master Machine |
| Estimasi Jam Kerja | Angka | Ya* | Perkiraan durasi penggunaan mesin |
| Total Biaya Mesin | Auto | Auto | Tarif × Estimasi Jam |

### 15.4.3 Sub-Grid Tenaga Kerja

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Nama Karyawan | Dropdown | Ya* | Pilih dari Master Karyawan (kategori Produksi, lihat [Bab 7](07-master-lain.md)) |
| Nick Name | Auto | Auto | Terisi otomatis |
| Tarif per Jam | Angka | Auto | Dari Tarif Tenaga Kerja (lihat [Bab 6](06-master-produksi.md)) |
| Estimasi Jam Kerja | Angka | Ya* | Perkiraan durasi kerja |
| Total Biaya TK | Auto | Auto | Tarif × Estimasi Jam |

---

## 15.5 Status Job Order

| Status | Keterangan | Stok yang Terpengaruh |
|--------|------------|------------------------|
| **DRAFT** | Baru dibuat, belum disubmit | - |
| **PLANNED** | Sudah disubmit, menunggu release | - |
| **RELEASED** | Material sudah dikeluarkan, produksi siap jalan | Bahan baku KELUAR, WIP MASUK |
| **IN PROGRESS** | Produksi sedang berjalan | - (belum ada perubahan stok tambahan) |
| **COMPLETED** | Produksi selesai, barang jadi sudah di gudang | WIP KELUAR, Barang Jadi MASUK |
| **CLOSED** | Semua biaya sudah dihitung, JO final | - |
| **CANCELLED** | JO dibatalkan | Reversal stok (jika sudah RELEASED) |

[SCREENSHOT: status-jo]

---

## 15.6 Alur Detail Job Order

### 15.6.1 Perencanaan (DRAFT → PLANNED)

```
[Input Header + Detail JO]
        │
        ▼
[Klik "Generate BOM"] → Sistem ambil BOM dari master
        │
        ▼
[Review Bahan, Mesin, TK]
        │
        ├─ Stok bahan CUKUP → Lanjut
        │
        └─ Stok bahan KURANG → Warning, bisa lanjut atau buat PR (Pengadaan)
                │
                ▼
[Simpan JO] → Status = PLANNED
```

### 15.6.2 Release (PLANNED → RELEASED)

```
[KLIK "Release Material"]
        │
        ▼
[Sistem Cek Stok Bahan Baku]
        │
        ├─ Stok CUKUP → Lanjut
        │     │
        │     ▼
        │   [Auto-Stok Keluar Bahan Baku]
        │   [Auto-Stok Masuk WIP]
        │   [Auto-Posting ke Buku Besar]
        │
        │   Debit: WIP (Bahan Baku)
        │   Kredit: Persediaan Bahan Baku
        │
        │   [Status JO = RELEASED]
        │
        └─ Stok TIDAK CUKUP → ERROR
              "Stok bahan tidak cukup. Buat PR dulu atau revisi JO"
```

### 15.6.3 Eksekusi (RELEASED → IN PROGRESS)

```
[Produksi Dimulai]
        │
        ▼
[Catat Realisasi per Shift]
        │ - Jam kerja aktual (TK)
        │ - Jam jalan mesin
        │ - Output barang jadi (partial)
        │ - Scrap (barang gagal)
        │
        ▼
[Update Realisasi Biaya]
        │ - Biaya TK aktual (Tarif × Jam Aktual)
        │ - Biaya Mesin aktual (Tarif × Jam Aktual)
        │ - Bahan baku tambahan (jika ada)
        │
        ▼
[Status JO = IN PROGRESS]
```

### 15.6.4 Penyelesaian (IN PROGRESS → COMPLETED)

```
[KLIK "Selesaikan Produksi"]
        │
        ▼
[Input Qty Hasil Produksi]
        │ - Qty Lolos QC
        │ - Qty Scrap (gagal)
        │
        ▼
[Sistem Auto-Proses]
        │
        ├─ [Auto-Stok Keluar WIP]
        ├─ [Auto-Stok Masuk Barang Jadi (qty lolos QC)]
        ├─ [Auto-Stok Keluar Scrap (jika scrap dimusnahkan)]
        │
        └─ [Auto-Posting Buku Besar]
              Debit: Persediaan Barang Jadi
              Kredit: WIP

              (Untuk scrap):
              Debit: Beban Scrap
              Kredit: WIP
        │
        ▼
[Status JO = COMPLETED]
```

### 15.6.5 Closing (COMPLETED → CLOSED)

```
[KLIK "Close JO"]
        │
        ▼
[Hitung Variance (Selisih Biaya)]
        │ - Standard Cost (estimasi awal)
        │ - Actual Cost (realisasi)
        │ - Variance = Actual − Standard
        │
        ▼
[Posting Variance]
        │ - Jika Actual > Standard → Variance NEGATIF
        │   Debit: Beban Selisih Biaya Produksi
        │   Kredit: WIP
        │
        │ - Jika Actual < Standard → Variance POSITIF
        │   Debit: WIP
        │   Kredit: Pendapatan Selisih Biaya Produksi
        │
        ▼
[Status JO = CLOSED] (final, tidak dapat diedit)
```

[SCREENSHOT: closing-jo]

---

## 15.7 Perhitungan Biaya Produksi (HPP Produksi)

### Komponen Biaya

| Komponen | Sumber | Cara Hitung |
|----------|--------|-------------|
| **Biaya Bahan Baku** | Sub-grid Bahan | Qty × Harga Bahan |
| **Biaya Tenaga Kerja Langsung** | Sub-grid TK | Jam Kerja × Tarif TK |
| **Biaya Overhead Mesin** | Sub-grid Mesin | Jam Jalan × Tarif Mesin |
| **Biaya Overhead Pabrik** | Alokasi (opsional) | % dari BTKL atau unit produced |

### Formula HPP Produksi

```
HPP Produksi per Unit = (Total Biaya Bahan + Total Biaya TK + Total Biaya Overhead) / Qty Produksi
```

**Contoh:**
- Qty Produksi: 100 unit
- Total Bahan: Rp 5.000.000
- Total TK: Rp 2.000.000
- Total Mesin: Rp 1.500.000
- Total Overhead: Rp 500.000
- **Total Biaya**: Rp 9.000.000
- **HPP per Unit**: Rp 90.000

---

## 15.8 Auto-Posting Produksi

| Aksi | Debit | Kredit | Catatan |
|------|-------|--------|---------|
| **Release Material** | WIP (Bahan Baku) | Persediaan Bahan Baku | Stok bahan keluar, WIP bertambah |
| **Selesai Produksi (FG Lolos QC)** | Persediaan Barang Jadi | WIP | Stok barang jadi bertambah |
| **Selesai Produksi (Scrap)** | Beban Scrap | WIP | Scrap dibebankan |
| **Actual Biaya TK** | WIP (BTKL) | Utang Gaji / Kas | Saat pembayaran gaji |
| **Actual Biaya Mesin** | WIP (BOP) | Akumulasi Biaya Mesin | Saat periode closing |
| **Variance Negatif** | Beban Selisih Biaya | WIP | Actual > Standard |
| **Variance Positif** | WIP | Pendapatan Selisih Biaya | Actual < Standard |

---

## Validation Rules

- **Periode kerja harus terbuka** untuk semua transaksi Produksi.
- **Barang Jadi Produksi** harus sudah ada di Master Bahan ([Bab 4](04-master-bahan.md)) dengan kategori yang sesuai.
- **BOM** harus lengkap dan valid sebelum JO bisa di-release.
- **Stok bahan baku** harus cukup sebelum release material — sistem mengecek otomatis.
- **Mesin** yang dipilih harus aktif (lihat [Bab 6](06-master-produksi.md)).
- **Karyawan TK** harus berkategori Produksi dan aktif (lihat [Bab 7](07-master-lain.md)).
- JO yang sudah CLOSED **tidak dapat diedit** — bersifat final.
- **Qty hasil produksi (lolos QC)** tidak boleh melebihi qty JO yang direncanakan (jika melebihi, sistem warning).
- **Scrap** tidak boleh melebihi total output.
- **Otorisasi berjenjang** berlaku untuk JO dengan nilai produksi signifikan.

---

## Hak CRUD & Otorisasi

| Aksi | Hak yang Diperlukan |
|------|---------------------|
| Buat JO | Tambah |
| Koreksi JO (DRAFT/PLANNED) | Koreksi |
| Release Material | Tambah + Otorisasi Supervisor Produksi |
| Input Realisasi | Tambah |
| Selesaikan Produksi | Tambah + Otorisasi |
| Close JO | Otorisasi Manager Produksi |
| Batal JO (RELEASED) | Koreksi + Otorisasi Manager |
| Lihat Laporan Produksi | Tampil + Akses Report |

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Periode sudah dikunci | "Periode tidak dapat dibuka. Hubungi administrator" |
| BOM tidak lengkap | "BOM belum lengkap. Tambahkan semua komponen bahan" |
| Stok bahan baku tidak cukup | "Stok [Nama Bahan] tidak cukup. Stok tersedia: X" |
| Mesin tidak aktif | "Mesin sudah tidak aktif. Pilih mesin lain" |
| TK bukan kategori Produksi | "Karyawan harus berkategori Produksi" |
| Qty scrap > qty produksi | "Qty scrap melebihi qty produksi" |
| Close JO tanpa realisasi lengkap | "Lengkapi realisasi jam kerja dan output terlebih dahulu" |
| Edit JO yang sudah CLOSED | "JO dengan status CLOSED tidak dapat diedit" |
| User tanpa hak produksi | "Anda tidak memiliki akses untuk modul Produksi" |

---

## Laporan Produksi

| Laporan | Isi | Filter |
|---------|-----|--------|
| **Job Order Report** | Daftar semua JO dengan status | Periode, Status, Barang |
| **Realisasi Produksi** | Qty aktual vs rencana | Periode, Barang |
| **HPP Produksi** | Total biaya produksi per JO | Periode, Barang |
| **Variance Analysis** | Selisih biaya standard vs actual | Periode, Barang |
| **Efisiensi Mesin** | Jam rencana vs jam aktual | Periode, Mesin |
| **Efisiensi TK** | Output per jam kerja | Periode, Karyawan |
| **Scrap Report** | Daftar barang gagal produksi | Periode, Barang, Alasan |

---

## Hubungan dengan Modul Lain

- **Master Bahan ([Bab 4](04-master-bahan.md))** → Bahan baku dan barang jadi dipilih dari master ini.
- **Master Gudang ([Bab 4](04-master-bahan.md))** → Release dan penyelesaian produksi terkait gudang.
- **Master Machine & Tarif ([Bab 6](06-master-produksi.md))** → Sub-grid mesin merujuk ke master ini.
- **Tarif Tenaga Kerja ([Bab 6](06-master-produksi.md))** → Sub-grid TK merujuk ke tarif ini.
- **Master Karyawan ([Bab 7](07-master-lain.md))** → TK yang dipilih harus kategori Produksi.
- **Marketing ([Bab 12](12-marketing.md))** → SO bisa menjadi acuan JO (Make to Order).
- **Gudang ([Bab 13](13-gudang.md))** → Release kurangi stok bahan, penyelesaian tambah stok barang jadi.
- **Akunting ([Bab 8](08-kasbank.md), [Bab 9](09-memorial.md))** → Biaya produksi terposting ke WIP, lalu ke HPP saat barang dijual.

---

## Catatan Operator

> **Produksi = Cross-Modul:** Modul Produksi adalah yang **paling kompleks** karena mengintegrasikan banyak master: Bahan (bahan baku + barang jadi), Mesin, TK, dan Gudang. Pastikan semua master terkait sudah terisi lengkap sebelum memulai produksi pertama.
>
> **BOM Management:** Bill of Materials (BOM) perlu **dirawat secara berkala** — jika ada perubahan resep atau komponen, update BOM di master. BOM yang tidak akurat akan menghasilkan perencanaan biaya yang salah.
>
> **Standard vs Actual Cost:** ERP Trade Exchange mendukung metode **Standard Costing** — biaya produksi dihitung dari tarif standar (estimasi), lalu di-adjust dengan variance saat closing. Metode ini memudahkan analisis efisiensi dan pricing.
>
> **WIP (Work In Process):** Selama produksi berjalan, barang **belum** masuk ke "Barang Jadi" — melainkan di akun WIP (Work In Process). WIP hanya berpindah ke Barang Jadi saat produksi **selesai**. Hal ini mengikuti prinsip pengakuan pendapatan dan persediaan.
>
> **Hubungan dengan Marketing:** Jika produksi dilakukan untuk memenuhi **Sales Order (Make to Order)**, tautkan JO dengan SO. Saat JO selesai, status SO akan otomatis update (partial/full) untuk DO.
