# Spec: Menu Navigasi

## 1. Spec Table

| Properti | Value |
|----------|-------|
| **Path Menu** | Header utama aplikasi (selalu tampil setelah login) |
| **Akses** | Semua user yang sudah login (tergantung hak akses per modul) |
| **CRUD Ops** | N/A (hanya navigasi) |
| **Validasi** | User harus login; tiap menu child hanya muncul jika user punya akses |

## 2. Daftar 8 Modul Utama

| No | Modul | Modul Setara (Transkrip) | Submenu Inti |
|----|-------|--------------------------|--------------|
| 1 | Master Data | Naga Data | Accounting, Bahan, Supplier/Customer, Produksi, Lain |
| 2 | Pengadaan & Purchasing | Perkas / Mengadaan | PR, RFQ, PO, LPB, retur, faktur pajak (Procurement-to-Pay) |
| 3 | Marketing | Marketing | Sales & order |
| 4 | Produksi | Produksi | Master mesin, tarif TK |
| 5 | Gudang | Gudang | Inventory |
| 6 | Akunting | Akunting | Kas Bank, Memorial |
| 7 | Reporting | Raporan | Report viewer |
| 8 | Utilities | Yutilitas | Setup, user management |

## 3. Field Reference Table — Modul Header

| Field | Tipe | Required | Keterangan |
|-------|------|----------|------------|
| Nama Modul | String | Ya | Label yang ditampilkan di header |
| Icon | Image | Opsional | Ikon visual per modul |
| Urutan | Integer | Ya | Urutan tampil (1–8) |
| Hak Akses per Modul | Relasi ke tabel user | Ya | Tampil/Sembunyi per user |

## 4. Test Scenarios

### Skenario 1: Tampil 8 modul terurut setelah login
```
Given saya belum login
When saya input username dan password valid
And saya klik tombol "Login"
Then sistem menampilkan header dengan 8 modul terurut
And label tiap modul terbaca: Master Data, Pengadaan & Purchasing,
    Marketing, Produksi, Gudang, Akunting, Reporting, Utilities
```

### Skenario 2: Klik menu Master Data membuka submenu
```
Given saya sudah login sebagai user dengan akses Master Data
When saya klik menu "Master Data"
Then sistem menampilkan daftar submenu:
  - Master Accounting
  - Master Bahan Barang
  - Master Supplier Customer
  - Master Produksi
  - Master Lain-Lain
```

### Skenario 3: Modul tersembunyi jika user tidak berhak
```
Given saya login sebagai user "staff_gudang" yang hanya punya akses Gudang
When saya melihat header aplikasi
Then hanya modul Gudang dan Master Data (read-only) yang tampil
And modul Akunting, Marketing, Pengadaan & Purchasing tersembunyi
```

### Skenario 4: Klik Pengadaan & Purchasing membuka PO form
```
Given saya login dengan akses Pengadaan & Purchasing
When saya klik menu "Pengadaan & Purchasing"
Then form Purchase Order tampil di area kerja utama
```

## 5. Database Impact

| Aksi | Tabel Affected | Keterangan |
|------|---------------|------------|
| Load header menu | `tbl_user_access` JOIN `tbl_module` | Filter berdasarkan user_id |
| Klik submenu | Tidak ada write ke DB | Hanya navigasi client-side |

## 6. Edge Cases

| Kondisi | Expected Behavior |
|---------|-------------------|
| Session expired saat klik menu | Redirect ke halaman login dengan pesan "Sesi berakhir" |
| User punya akses Tambah tapi tidak Tampil | Menu tetap tampil; tombol CRUD aktif sesuai level |
| Browser back button setelah sub-menu terbuka | Kembali ke state menu collapse (sesuai histori) |
| Hak akses berubah di tengah sesi (admin update) | Berlaku efektif pada login berikutnya, bukan sesi aktif |
