# ERP Trade Exchange — Manual Book Index

**Tujuan utama**: Panduan untuk end-user (operator accounting) menjalankan aplikasi ERP Trade Exchange.
**Disusun dari**: 12 transkrip audio (15 menit–15 menit per file) menggunakan AI Whisper untuk transkripsi suara.
**Tanggal generate**: 2026-06-26
**Versi**: 2.1 (updated: 14 modul — Pengadaan & Purchasing digabung jadi Procurement-to-Pay)

---

## 3 Versi Berbeda

Manual ini disediakan dalam **3 versi berbeda** untuk memenuhi kebutuhan berbeda. Pilih sesuai peran Anda:

| Versi | Untuk Siapa | Format | Mulai Dari |
|-------|-------------|--------|------------|
| **V1 — Struktural** | Operator accounting yang ingin **referensi cepat** per modul | Reference manual gaya Odoo/SAP, tabel field, validasi | [v1-struktural/index.md](v1-struktural/index.md) |
| **V2 — Naratif** | **End-user baru** yang ingin dipandu bertahap seperti tutorial | Walkthrough harian (Hari 1–10), callout, checklist | [v2-naratif/index.md](v2-naratif/index.md) |
| **V3 — Matriks** | QA tester & developer automation, butuh **test specification** | Spec matrix + Gherkin BDD scenarios | [v3-matriks/index.md](v3-matriks/index.md) |

---

## Rekomendasi Berdasarkan Peran

### Saya operator accounting baru
→ Mulai di **V2 Naratif** (`day01-setup.md`). Ikuti hari 1–5 bertahap. Setelah paham alur, gunakan **V1 Struktural** sebagai referensi cepat.

### Saya operator accounting berpengalaman
→ Langsung ke **V1 Struktural** untuk cek field & validation rules.

### Saya QA / tester
→ **V3 Matriks** punya spec + Gherkin test scenarios + Playwright executable siap pakai.

### Saya developer / migrasi sistem
→ Lihat **V3 api-reference.md** untuk mapping UI → database. V1 juga punya section integrasi di `10-integration.md` dan cross-ref per bab.

---

## Statistik

- **~70 file markdown** total
- **Ukuran total**: ~1 MB
- **14 modul ERP** didokumentasikan (5 master + 4 setup/transaksi + 5 operasional)
- **50+ istilah** di glossary (V1 + V2)
- **80+ test scenario** di V3 Gherkin features
- **14 chapter** di V1 (10 inti + 4 operasional — Pengadaan & Purchasing merged)
- **10 hari tutorial** di V2 (setup → transaksi → reporting → troubleshooting)
- **14 spec + 9 feature + 1 Playwright executable** di V3

---

## Struktur Folder

```
manual-book/
├── _plan.md                       ← Planning awal
├── README.md                      ← File ini (index navigasi)
│
├── v1-struktural/                 ← Reference manual gaya Odoo/SAP
│   ├── index.md                   ← TOC & konvensi pembacaan
│   ├── 01-navigation.md           ← 8 modul utama (overview)
│   ├── 02-setup.md                ← Menu Berkas (6 submenu)
│   ├── 03-master-accounting.md    ← COA, aktiva, posting
│   ├── 04-master-bahan.md         ← Gudang, group, item
│   ├── 05-master-supplier-customer.md
│   ├── 06-master-produksi.md      ← Machine & tarif TK
│   ├── 07-master-lain.md          ← Karyawan, departemen, jabatan
│   ├── 08-kasbank.md              ← BKM/BKK/BBM/BBK + sub-ledger
│   ├── 09-memorial.md             ← Jurnal entry
│   ├── 10-integration.md          ← Modul dependency map
│   ├── 11-purchasing.md           ← Procurement-to-Pay (PR→RFQ→PO→LPB→Retur→Faktur Pajak)
│   ├── 12-marketing.md            ← SO, Delivery Order, Invoice, Retur
│   ├── 13-gudang.md               ← Kartu Stok, MSK/KLR, Transfer, Opname
│   ├── 14-produksi.md             ← Job Order, BOM, Mesin, TK, HPP
│   └── appendix-glossary.md       ← 80+ istilah
│
├── v2-naratif/                    ← Walkthrough harian (Microsoft Learn style)
│   ├── index.md
���   ├── day01-setup.md             ← Setup awal (periode, perusahaan, user)
│   ├── day02-masterdata.md        ← Semua master data (COA, item, supplier, dll)
│   ├── day03-transactions.md      ← Transaksi harian (BKM/BKK/BBK)
│   ├── day04-reporting.md         ← Laporan keuangan
│   ├── day05-pengadaan.md         ← PR → PO → LPB → Faktur Pajak
│   ├── day06-marketing.md         ← SO → Invoice → Retur → Credit Note
│   ├── day07-produksi.md          ← SPK, Mesin, Bahan, Hasil, Finishing
│   ├── day08-gudang.md            ← Mutasi stok, Retur, Koreksi, Opname
│   ├── day09-utilitas.md          ← Posting, HPP, Audit Trail
│   ├── day10-troubleshooting.md   ← FAQ lintas modul
│   ├── cheatsheet.md              ← Quick reference semua modul
│   └── glossary.md                ← Glossary + acronim
│
└── v3-matriks/                    ← Spec & Gherkin test scenarios
    ├── index.md
    ├── specs/
    │   ├── spec-menu-navigasi.md  ← 8 modul overview
    │   ├── spec-setup-berkas.md   ← 6 submenu Menu Berkas
    │   ├── spec-master-accounting.md
    │   ├── spec-master-bahan.md
    │   ├── spec-master-supplier-customer.md
    │   ├── spec-master-produksi.md
    │   ├── spec-master-lain.md
    │   ├── spec-kas-bank.md       ← BKM/BKK/BBM/BBK + sub-ledger
    │   ├── spec-memorial.md       ← Journal entry
    │   ├── spec-pengadaan.md      ← PR → PO → LPB → Faktur Pajak
    │   ├── spec-marketing.md      ← SO → SPK → Invoice → Retur
    │   ├── spec-produksi.md       ← SPK, Mesin, Bahan, Hasil
    │   ├── spec-gudang.md         ← Pengeluaran, Retur, Koreksi, Opname
    │   └── spec-utilitas.md       ← Stock recalc, HPP, Posting, Audit
    ├── test-suite/
    │   ├── login.feature          ← 21 skenario auth & otorisasi
    │   ├── master-data.feature    ← 28 skenario CRUD master
    │   ├── kas-bank.feature       ← 19 skenario transaksi kas & bank
    │   ├── memorial.feature       ← 17 skenario jurnal entry
    │   ├── pengadaan.feature      ← 15 skenario purchasing cycle
    │   ├── marketing.feature      ← 15 skenario SO → invoice → retur
    │   ├── produksi.feature       ← 17 skenario SPK → hasil produksi
    │   ├── gudang.feature         ← 16 skenario mutasi & opname
    │   ├── utilitas.feature       ← 14 skenario posting & audit
    │   └── *.playwright.spec.ts   ← Executable Playwright tests
    └── api-reference.md           ← UI Form → DB tables mapping (all modules)
```

---

## 14 Modul ERP Lengkap

### Master Data (5 modul)

| # | Modul | V1 Chapter | V2 Day | V3 Spec |
|---|-------|------------|--------|---------|
| 1 | Chart of Accounts (COA) | 03-master-accounting | day02 | spec-master-accounting |
| 2 | Master Item/Barang | 04-master-bahan | day02 | spec-master-bahan |
| 3 | Master Supplier/Customer | 05-master-supplier-customer | day02 | spec-master-supplier-customer |
| 4 | Master Produksi (Mesin & TK) | 06-master-produksi | day02 | spec-master-produksi |
| 5 | Master Karyawan | 07-master-lain | day02 | spec-master-lain |

### Setup & Transaksi Harian (4 modul)

| # | Modul | V1 Chapter | V2 Day | V3 Spec |
|---|-------|------------|--------|---------|
| 6 | Menu Berkas (Setup) | 02-setup | day01 | spec-setup-berkas |
| 7 | Kas & Bank | 08-kasbank | day03 | spec-kas-bank |
| 8 | Memorial (Jurnal) | 09-memorial | day03 | spec-memorial |
| 9 | Navigasi | 01-navigation | day01 | spec-menu-navigasi |

### Operasional (5 modul)

| # | Modul | V1 Chapter | V2 Day | V3 Spec |
|---|-------|------------|--------|---------|
| 10 | Pengadaan & Purchasing (Procurement-to-Pay) | 11-purchasing | day05 | spec-pengadaan |
| 11 | Marketing (Sales) | 12-marketing | day06 | spec-marketing |
| 12 | Produksi | 14-produksi | day07 | spec-produksi |
| 13 | Gudang | 13-gudang | day08 | spec-gudang |
| 14 | Utilitas | (lihat V1 integration) | day09 | spec-utilitas |

---

## Cross-Reference (Versi Mana untuk Topik Apa)

| Topik | V1 | V2 | V3 |
|-------|----|----|-----|
| Login & otorisasi 5 level | 02-setup | day01 | login.feature |
| Setup periode kerja | 02-setup | day01 | spec-setup-berkas |
| Chart of Accounts (COA) | 03-master-accounting | day02 | spec-master-accounting |
| Master Item/Barang | 04-master-bahan | day02 | spec-master-bahan |
| Master Supplier/Customer | 05-master-supplier-customer | day02 | spec-master-supplier-customer |
| Master Karyawan | 07-master-lain | day02 | spec-master-lain |
| Transaksi BKM/BKK | 08-kasbank | day03 | spec-kas-bank, kas-bank.feature |
| Pelunasan piutang/utang | 08-kasbank | day03 | spec-kas-bank |
| Jurnal Memorial | 09-memorial | day03 | spec-memorial, memorial.feature |
| Penambahan aktiva | 09-memorial | day03 | spec-memorial |
| Reporting | (lihat V1) | day04 | (lihat V3) |
| Purchase Order (PO) | 11-purchasing | day05 | spec-pengadaan, pengadaan.feature |
| Sales Order (SO) | 12-marketing | day06 | spec-marketing, marketing.feature |
| Surat Perintah Kerja (SPK) | 14-produksi | day07 | spec-produksi, produksi.feature |
| Mutasi Stok | 13-gudang | day08 | spec-gudang, gudang.feature |
| Proses Posting | 10-integration | day09 | spec-utilitas, utilitas.feature |
| Audit Trail | (lihat V1) | day09 | spec-utilitas |
| Integrasi antar modul | 10-integration | (cross-ref) | api-reference |
| Istilah/Glossary | appendix-glossary | glossary | - |

---

## Catatan Penting

1. **Manual ini dihasilkan dari rekaman suara** menggunakan AI speech-to-text (Whisper). Beberapa istilah mungkin masih perlu diverifikasi oleh developer ERP yang asli.

2. **Versi 1 (Struktural)** paling cocok untuk reference cepat. Jika Anda menemukan detail yang kurang di V2/V3, cek V1.

3. **Test scenarios di V3** adalah output generatif dari transkrip, bukan actual test case yang sudah dijalankan. Gunakan sebagai template untuk test automation. Playwright executable (*.spec.ts) sudah siap dijalankan setelah disesuaikan dengan DOM real aplikasi.

4. **Icon legend**:
   - 📋 Reference — cocok untuk verifikasi cepat
   - 📖 Tutorial — cocok untuk belajar bertahap
   - 🧪 Test Spec — cocok untuk automation