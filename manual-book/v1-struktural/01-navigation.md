# Bab 1 — Navigasi & Menu Utama

## Overview

Setelah berhasil login, pengguna akan masuk ke **header utama** aplikasi yang menampilkan 8 modul ERP. Modul disusun berdasarkan alur logis: data master lebih dulu, lalu transaksi, lalu utilitas administrasi. Bab ini menjelaskan urutan modul, fungsi umum, dan cara masuk ke submenu.

[SCREENSHOT: main-menu-header]

---

## Daftar 8 Modul Utama

| No. | Modul | Fungsi |
|-----|-------|--------|
| 1 | **Master Data** | Pusat input semua data referensi: akun, barang, supplier, customer, karyawan, dll |
| 2 | **Pengadaan & Purchasing** | Procurement-to-pay: PR, RFQ, PO, penerimaan barang, retur pembelian |
| 3 | **Marketing** | Modul penjualan dan aktivitas pemasaran |
| 4 | **Produksi (Production)** | Perencanaan dan eksekusi produksi |
| 5 | **Gudang (Warehouse)** | Manajemen stok, kartu stok, mutasi barang |
| 6 | **Akunting (Accounting)** | Transaksi kas-bank, memorial, buku besar, laporan |
| 7 | **Reporting** | Report viewer — laporan keuangan, stok, penjualan |
| 8 | **Utilities** | Menu Berkas, admin panel, pengaturan sistem |

---

## Tabel Field — Layar Login

| Nama Field | Tipe | Required | Keterangan |
|------------|------|----------|------------|
| Username | Teks | Ya* | Identitas pengguna, diisi saat setup user |
| Password | Teks (masked) | Ya* | Kata sandi, dapat diganti lewat Ganti Password |
| Perusahaan | Dropdown | Ya* | Pilih perusahaan aktif (jika multi-company) |
| Periode | Dropdown | Ya* | Periode kerja yang akan dibuka |

[SCREENSHOT: login-screen]

---

## Alur Masuk Aplikasi

```
[Halaman Login] --input kredensial--> [Verifikasi User] --sukses--> [Header 8 Modul]
                                                  │
                                                  └--gagal--> [Pesan: User/Password salah]
```

---

## Struktur Hierarki Menu (Ringkas)

```
HEADER UTAMA (8 Modul)
├── 1. Master Data
│   ├── Master Accounting, Bahan, Supplier/Customer, Produksi, Lain-Lain
├── 2. Pengadaan & Purchasing
│   ├── PR, RFQ, Quotation, Evaluasi, Kontrak
│   └── PO, Penerimaan Barang, Retur Pembelian
├── 3. Marketing
├── 4. Produksi
├── 5. Gudang
├── 6. Akunting
│   ├── Transaksi Kas Bank
│   └── Transaksi Memorial
├── 7. Reporting
└── 8. Utilities
    ├── Menu Berkas (6 submenu, lihat Bab 2)
    └── Admin Panel
```

---

## Validation Rules

- Username dan password **wajib** diisi. Sistem menolak login kosong.
- Periode kerja harus dalam status **terbuka** (belum dikunci).
- Bila user tidak memiliki hak akses untuk sebuah modul, menu tersebut **tidak tampil** atau tampil abu-abu.
- Session akan otomatis terputus setelah waktu idle tertentu (lihat konfigurasi admin).

---

## Error Cases

| Situasi | Pesan Sistem |
|---------|--------------|
| Username/password salah | "User atau password tidak valid" |
| Periode kerja terkunci | "Periode tidak dapat dibuka. Hubungi administrator" |
| User tidak punya hak akses modul | "Anda tidak memiliki akses untuk modul ini" |
| Session habis (timeout) | "Sesi telah berakhir, silakan login ulang" |

---

## Catatan Operator

- Urutan menu di aplikasi sudah diurutkan ulang secara logis ERP — **bukan** urutan kronologis penyebutan pada transkrip audio asli.
- Nama aplikasi di rekaman audio adalah "Trade Exchange" (kemungkinan salah sebut). Identitas resmi aplikasi: **ERP Trade Exchange**.
- Untuk mulai bekerja, **wajib** menyelesaikan Setup Periode Kerja lebih dulu (lihat [Bab 2](02-setup.md)).