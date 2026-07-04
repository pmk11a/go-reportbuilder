# ERP Trade Exchange — Manual Versi 1 (Struktural Reference Manual)

> **Dokumen Referensi End-User Operator**
> Format: Reference manual terstruktur (gaya Odoo/SAP)
> Bahasa: Indonesia formal

---

## Tentang Manual Ini

Manual ini berfungsi sebagai **referensi teknis cepat** untuk operator aplikasi **ERP Trade Exchange**. Setiap bab berdiri sendiri-sendiri (standalone) dan dapat dicari secara independen. Manual disusun mengikuti alur kerja umum: dari setup awal, pengisian master data, hingga transaksi harian dan integrasi antar modul.

**Kapan menggunakan manual ini:**
- Ingin tahu field apa saja yang harus diisi pada sebuah form
- Ingin memastikan langkah benar saat input transaksi
- Ingin memahami aturan validasi sebelum menyimpan
- Ingin menelusuri keterkaitan antar modul

**Yang TIDAK dibahas di manual ini:**
- Skema teknis internal (database, query, API)
- Instalasi aplikasi atau administrasi server
- Modul Marketing, Produksi penuh, Warehouse (di luar lingkup transkrip)

---

## Daftar Isi

| No. | Bab | Topik | File |
|-----|-----|-------|------|
| 1 | Navigasi & Menu Utama | 8 modul ERP, struktur header | [01-navigation.md](01-navigation.md) |
| 2 | Setup & Konfigurasi (Berkas) | Periode kerja, perusahaan, user, COA | [02-setup.md](02-setup.md) |
| 3 | Master Accounting | COA, Aktiva, Neraca, Posting | [03-master-accounting.md](03-master-accounting.md) |
| 4 | Master Bahan & Barang | Gudang, Group, Subgroup, Item | [04-master-bahan.md](04-master-bahan.md) |
| 5 | Master Supplier & Customer | Area, Kota, Supplier, Customer, Sales | [05-master-supplier-customer.md](05-master-supplier-customer.md) |
| 6 | Master Produksi | Mesin, Tarif Tenaga Kerja | [06-master-produksi.md](06-master-produksi.md) |
| 7 | Master Lain-Lain | Departemen, Jabatan, Karyawan, Desain | [07-master-lain.md](07-master-lain.md) |
| 8 | Transaksi Kas Bank | BKM, BKK, BBM, BBK | [08-kasbank.md](08-kasbank.md) |
| 9 | Memorial (Jurnal Entry) | Penyesuaian, aktiva, utang-piutang | [09-memorial.md](09-memorial.md) |
| 10 | Peta Integrasi | Keterkaitan antar modul | [10-integration.md](10-integration.md) |
| 11 | Procurement-to-Pay (Purchasing + Pengadaan) | PR, RFQ, PO, LPB, retur, faktur pajak | [11-purchasing.md](11-purchasing.md) |
| 12 | Transaksi Marketing | Sales Order, Delivery Order, Invoice, Retur | [12-marketing.md](12-marketing.md) |
| 13 | Transaksi Gudang | Kartu Stok, Masuk/Keluar, Transfer, Opname | [13-gudang.md](13-gudang.md) |
| 14 | Transaksi Produksi | Job Order, BOM, Mesin, TK, HPP Produksi | [14-produksi.md](14-produksi.md) |
| A | Lampiran Glossary | Daftar istilah ERP | [appendix-glossary.md](appendix-glossary.md) |

---

## Konvensi Pembacaan

Setiap bab mengikuti struktur tetap:

1. **Overview** — paragraf pembuka yang menjelaskan tujuan bab
2. **Tabel Field** — daftar lengkap field, tipe, status wajib/opsional
3. **Validation Rules** — aturan validasi yang harus dipenuhi
4. **Screenshot Placeholder** — penanda visual `[SCREENSHOT: nama-form]`
5. **Flow Diagram** — diagram ASCII untuk proses 3 langkah atau lebih
6. **Error Cases** — pesan kesalahan yang umum dijumpai

---

## Simbol & Notasi

| Simbol | Arti |
|--------|------|
| `[SCREENSHOT: nama]` | Tempat screenshot form diharapkan |
| `*` (pada kolom Required) | Field wajib diisi |
| `-` (pada kolom Required) | Field opsional |
| `→` | Menghasilkan / menghubungkan |
| `├──` `└──` | Struktur hierarki menu |

---

## Kode Transaksi Ringkas

Untuk referensi cepat seluruh modul, kode bukti transaksi berikut berlaku seragam:

| Kode | Kepanjangan | Jenis |
|------|-------------|-------|
| BKM | Bank Masuk | Penerimaan kas/bank (Debit Kas) |
| BKK | Bank Keluar | Pengeluaran kas/bank (Kredit Kas) |
| BBM | Buku Masuk | Penerimaan memorial (pemasukan non-tunai) |
| BBK | Bukti Bank Keluar | Pengeluaran kas/bank non-tunai (Kredit Bank) |
| BNM | Bukti Memorial | Jurnal umum |
| BCK | Bukti Koleksi | Penerimaan piutang |

---

## Versi Dokumen

| Versi | Tanggal | Catatan |
|-------|---------|---------|
| 1.0 | 2026-06-26 | Edisi pertama — berdasarkan transkrip audio |
| 1.1 | 2026-06-26 | Penambahan 5 bab baru (Bab 11–15): Purchasing, Pengadaan, Marketing, Gudang, Produksi |
| 1.2 | 2026-07-03 | Merge Bab 11+12 → Procurement-to-Pay end-to-end; renumber Bab 13→12, 14→13, 15→14 |
| 2.0 | 2026-07-10 | Revisi besar: 15 modul → 14 modul. Pengadaan & Purchasing digabung jadi Procurement-to-Pay. V2: 10 hari, V3: 14 spec + 9 feature |

---

**Mulai dari sini:** Jika Anda baru pertama kali menggunakan sistem, buka **[Bab 2 — Setup & Konfigurasi](02-setup.md)** untuk menyiapkan periode kerja dan perusahaan sebelum input transaksi.