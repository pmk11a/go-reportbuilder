# ERP Trade Exchange — Panduan Naratif

> Selamat datang di ERP Trade Exchange. Panduan ini dirancang khusus untuk **operator accounting baru** yang впервые menggunakan sistem. Ikuti alur dari hari pertama hingga hari keempat sebagai perjalanan belajar yang praktis.

---

## Cara Menggunakan Panduan Ini

Panduan ini disusun seperti cerita sehari-hari — Anda diajak menjalani proses mulai dari pengaturan awal sampai menghasilkan laporan keuangan. Setiap bab dilengkapi:

- **Checklist** untuk memastikan setiap langkah sudah dilakukan
- **Callout box** ("Penting!", "Tips:", "Apa yang terjadi di belakang layar?") untuk informasi tambahan
- **Troubleshooting Q&A** untuk常见问题

---

## Daftar Isi

| Hari | Topik | File |
|------|-------|------|
| **Hari 1** | Setup Awal — Periode, Perusahaan, User | [day01-setup.md](day01-setup.md) |
| **Hari 2** | Master Data — Accounting, Bahan, Supplier, Customer, Produksi | [day02-masterdata.md](day02-masterdata.md) |
| **Hari 3** | Transaksi Harian — Kas Bank, Memorial, Pelunasan | [day03-transactions.md](day03-transactions.md) |
| **Hari 4** | Reporting — Laporan Keuangan | [day04-reporting.md](day04-reporting.md) |
| **Hari 5** | Pengadaan — Purchasing Cycle (PR → PO → LPB → Faktur Pajak) | [day05-pengadaan.md](day05-pengadaan.md) |
| **Hari 6** | Marketing — Sales Order → SPK → Invoice → Retur | [day06-marketing.md](day06-marketing.md) |
| **Hari 7** | Produksi — SPK, Mesin & TK, Hasil Produksi, Finishing | [day07-produksi.md](day07-produksi.md) |
| **Hari 8** | Gudang — Mutasi Stok & Opname | [day08-gudang.md](day08-gudang.md) |
| **Hari 9** | Utilitas — Posting, HPP, Hitung Ulang, Audit Trail | [day09-utilitas.md](day09-utilitas.md) |
| **Hari 10** | Troubleshooting — FAQ Semua Modul | [day10-troubleshooting.md](day10-troubleshooting.md) |

**Referensi Cepat:**
- [Cheatsheet](cheatsheet.md) — Ringkasan kode transaksi, hotkeys, dan navigasi
- [Glossary](glossary.md) — Daftar istilah dan kepanjangannya

---

## 8 Modul ERP Trade Exchange

Sistem ini terdiri dari 8 modul utama yang terintegrasi:

```
1. Master Data      → Semua data dasar (COA, Item, Supplier, Customer, Karyawan)
2. Pengadaan & Purchasing → PR, RFQ, PO, LPB, retur, faktur pajak (Procurement-to-Pay)
3. Marketing        → Manajemen penjualan dan order
4. Produksi         → Jadwal dan tracking produksi
5. Gudang           → Inventory dan perpindahan stok
6. Akunting         → Kas Bank, Memorial, dan laporan keuangan
7. Reporting        → Semua laporan keuangan dan operasional
8. Utilities        → Admin panel, setup periode, user management
```

> **Tips:** Anda akan menghabiskan sebagian besar waktu di **Akunting** dan **Master Data** sebagai operator.

---

## Prasyarat Sebelum Memulai

Pastikan Anda sudah:
- ✅ Mendapat kredensial login (username & password)
- ✅ Mengetahui level otorisasi Anda (Level 1–5)
- ✅ Mengetahui modul mana yang bisa diakses

Jika belum, hubungi administrator sistem Anda (biasanya di **Menu Berkas > Set Pemakaian**).

---

## Alur Umum Belajar

Kami sarankan membaca dan mengikuti panduan secara berurutan:

```
Hari 1 (Setup)    →  Tanpa periode terbuka, transaksi tidak bisa dijalankan
      ↓
Hari 2 (Master)   →  Tanpa data dasar, transaksi tidak bisa diproses
      ↓
Hari 3 (Transaksi) →  Setelah setup dan master ready, saatnya transaksi
      ↓
Hari 4 (Report)   →  Verifikasi semua transaksi sudah terposting dengan benar
```

Setiap hari merupakan fondasi untuk hari berikutnya. Jangan melewatkan langkah.

---

> **Penting!** Semua data yang dimasukkan dalam panduan ini bersifat edukatif. Pada lingkungan produksi, pastikan Anda memiliki otorisasi yang tepat untuk setiap tindakan.
