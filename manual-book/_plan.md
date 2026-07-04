# ERP Trade Exchange — Panduan Manual Book: 3 Pendekatan Berbeda

> **Status**: Planning — belum eksekusi
> **Tujuan**: Menggabungkan 6 transkrip audio (Daftar Menu, Menu Berkas, Master Data, Kas Bank, Memorial) menjadi dokumen panduan yang berguna untuk:
> 1. Manusia (end-user, tester, developer)
> 2. AI (context untuk test generation, code review, migration)

---

## Konteks Input

File transkrip tersedia di `d:/fiturlaporan/transcrpit/`:
- Daftar Menu.md — 8 modul ERP (Purchasing & Pengadaan digabung jadi Procurement-to-Pay)
- Menu Berkas.md — 6 submenu (setup, user, reporting, password, lock)
- Master Data — Lengkap.md — 5 submodule (Accounting, Bahan, Supplier/Customer, Produksi, Lain)
- Kas Bank.md — Transaksi BKM/BKK/BBM/BBK + subledger
- Memorial.md — Jurnal manual + aktiva + utang/piutang

Total audio: ~75 menit, 3500+ kata ter-transkrip.

---

## Rencana Output: 3 Versi Berbeda

Setiap versi disimpan di folder terpisah untuk perbandingan:

```
d:/fiturlaporan/manual-book/
├── v1-struktural/     (Pendekatan 1)
├── v2-naratif/        (Pendekatan 2)
└── v3-matriks/        (Pendekatan 3)
```

---

## Pendekatan 1: V1 — STRUKTURAL (Reference Manual)

**Inspirasi**: SAP Business One Help Center, Odoo Documentation, Laravel Docusaurus

**Format**: Dokumen teknis berbasis halaman/per halaman. Setiap modul = satu chapter. Fokus pada presisi informasi.

**Struktur**:
- Bab 1: Logging In & Navigation (8 modul utama)
- Bab 2: Setup & Configuration (Menu Berkas 6 submenu)
- Bab 3: Master Data (Accounting, Bahan, Supplier/Customer, Produksi, Lain)
- Bab 4: Transaksi Kas Bank
- Bab 5: Memorial (Journal Entry)
- Bab 6: Integrasi Antar Modul

**Fitur unik per bab**:
- Screenshot placeholder `[FORM_SCREENSHOT]`
- Tabel field lengkap (nama, tipe, required/optional)
- Flow diagram ASCII untuk proses kompleks
- Tabel referensi kode transaksi (BKM, BKK, dll)
- Validation rules & error messages

**Output file**:
- `index.md` — Table of Contents
- `01-navigation.md` — 8 modul menu
- `02-setup.md` — Menu Berkas (setup, user, reporting)
- `03-master-accounting.md` — COA, Aktiva, Utang, Neraca
- `04-master-bahan.md` — Gudang, Group, Subgroup, Item
- `05-master-supplier-customer.md` — Area, Kota, Supplier, Customer, Sales
- `06-master-produksi.md` — Machine, Tariff
- `07-master-lain.md` — Karyawan, Departemen, Jabatan
- `08-kasbank.md` — Transaksi Kas Bank
- `09-memorial.md` — Journal Entry
- `10-integration.md` — Map integrasi antar modul

**Kelebihan**: Mudah dicari (searchable), reference-ready, cocok untuk developer migration
**Kekurangan**: Kurang enganging, butuh skimming skill dari pembaca

---

## Pendekatan 2: V2 — NARATIF (Story-Driven User Guide)

**Inspirasi**: Microsoft Learn "Walkthrough", Notion Templates, Loom video scripts

**Format**: Cerita end-to-end dari sudut pandang pengguna baru. Dibagi menjadi "hari-hari" bekerja dengan sistem.

**Struktur**:

**Hari 1: Setup Awal**
> "Selamat datang di ERP Trade Exchange. Hari ini kita akan menyiapkan perusahaan..."
> - Langkah-langkah: Setup Periode → Kunci Periode → Config Perusahaan
> - "Kenapa ini penting? Karena tanpa periode, semua transaksi tidak bisa jalan."

**Hari 2: Master Data**
> "Setelah sistem siap, mari kita masukkan data dasar..."
> - Substory A: Setup User & Hak Akses (Set Pemakaian)
> - Substory B: Setup Chart of Accounts (Master Accounting)
> - Substory C: Setup Item & Gudang (Master Bahan)
> - Substory D: Setup Supplier & Customer

**Hari 3: Transaksi Harian**
> "Sekarang saatnya bekerja. Mari kita coba berbagai jenis transaksi..."
> - Kas Masuk (BKM) — menerima pembayaran customer
> - Kas Keluar (BKK) — bayar supplier
> - Journal Entry (Memorial) — penyesuaian & aktiva
> - Pelunasan Utang/Piutang

**Fitur unik**:
- Side-notes "Penting!" untuk warning
- "Apa yang terjadi di belakang layar?" untuk explain auto-posting
- Checklist per chapter
- Troubleshooting Q&A ("Kenapa saya tidak bisa klik X?")

**Output file**:
- `index.md` — Overview & navigation
- `day01-setup.md` — Period, Company, User
- `day02-masterdata.md` — Semua master data
- `day03-transactions.md` — Kas Bank + Memorial
- `day04-reporting.md` — Report yang bisa dilihat
- `cheatsheet.md` — Quick reference (kode transaksi, hotkeys, etc.)
- `glossary.md` — Istilah ERP

**Kelebihan**: Ramah untuk end-user baru, mudah dipahami, engaging
**Kekurangan**: Sulit mencari info spesifik, tidak cocok untuk developer reference

---

## Pendekatan 3: V3 — MATRIKS (Test-Driven Documentation)

**Inpirasi**: Cucumber/Gherkin syntax, Playwright test spec, REST API documentation

**Format**: Setiap fitur = tabel + test scenario dalam format readable untuk manusia DAN AI.

**Struktur**:

**Matriks Fitur** (contoh Kas Bank):

| Properti | Value |
|----------|-------|
| Path Menu | Akunting > Transaksi Kas Bank |
| Akses | User dengan akses Kas/Bank |
| CRUD | Tambah, Koreksi, Hapus, Batal Otorisasi |
| Validasi | Periode harus terbuka, wajib pilih akun |

**Test Scenarios** (format human-readable):

```
Scenario: Buat Transaksi Kas Masuk (BKM)
  Given saya berada di halaman Transaksi Kas Bank
  And saya memiliki akses user level 1
  When saya pilih jenis transaksi "Bank Masuk"
  And saya pilih mata uang "IDR"
  And saya input tanggal "2026-06-26"
  And saya input nominal "Rp 1.500.000"
  And saya pilih lawan "Perkiraan Piutang Dagang"
  And saya pilih customer "PT Maju Jaya"
  When saya klik "Simpan"
  Then transaksi berhasil tersimpan
  And posting ke buku besar:
    - Debit: Kas (1-1001) Rp 1.500.000
    - Credit: Piutang Dagang (1-1201) Rp 1.500.000
```

**Struktur per modul**:
1. Tabel spesifikasi fitur
2. Test scenarios (happy path + edge cases)
3. Database impact (tabel affected, field updated)
4. Integration points

**Output file**:
- `index.md` — Overview & navigation
- `specs/` — Per modul:
  - `spec-menu-navigasi.md`
  - `spec-setup-berkas.md`
  - `spec-master-accounting.md`
  - `spec-master-bahan.md`
  - `spec-master-supplier-customer.md`
  - `spec-master-produksi.md`
  - `spec-master-lain.md`
  - `spec-kas-bank.md`
  - `spec-memorial.md`
- `test-suite/` — Gherkin-format test cases:
  - `login.feature`
  - `master-data.feature`
  - `kas-bank.feature`
  - `memorial.feature`
- `api-reference.md` — Mapping UI → database table

**Kelebihan**: Langsung bisa jadi test specification, sangat struktur, AI-parseable
**Kekurangan**: Kurang natural untuk end-user biasa

---

## Cross-Cutting Concerns (Semua 3 Versi)

Setiap versi WAJIB menyertakan:
1. **Glossary** — definisi semua istilah (BKM, BKK, COA, Sub-ledger, dll)
2. **Module Dependency Map** — diagram ketergantungan antar modul
3. **权限矩阵** — siapa bisa akses apa (based on Set Pemakaian)
4. **Auto-posting Table** — mapping transaksi → jurnal (debit/credit otomatis)
5. **Error Cases** — apa yang terjadi jika validasi gagal

---

## Workflow Eksekusi

### Fase 0: Research & Enrichment (30 menit)
- Baca referensi eksternal (Odoo doc structure, SAP user guide example, Laravel docs format)
- Extract best practices dari masing-masing pendekatan
- Validasi istilah akuntansi (double-entry, chart of accounts, sub-ledger, reconciliation)

### Fase 1: Structure All 3 (15 menit)
- Buat direktori `manual-book/` dengan 3 sub-folder
- Generate TOC untuk setiap versi
- Setup cross-linking antar versi

### Fase 2: Content Generation — Parallel (60 menit)
Dispatch subagents untuk generate konten secara paralel:
- **Agent A**: Versi 1 Structural (semua chapter)
- **Agent B**: Versi 2 Narrative (all days)
- **Agent C**: Versi 3 Matrix (all specs + test cases)

### Fase 3: Cross-Validation (30 menit)
- Cek konsistensi info di ketiga versi
- Pastikan tidak ada informasi hilang dari transkrip asli
- Verifikasi akurasi istilah akuntansi
- Cek link antar bab

### Fase 4: Final Output (15 menit)
- Generate comparison table (mana yang cocok untuk siapa)
- Add recommendation: "Versi X cocok untuk tim dev, Versi Y untuk end-user, Versi Z untuk QA"

---

## Decision Points untuk User

Sebelum mulai, user pilih:

**A. Eksekusi Ketiga Tiga** — semua 3 versi lengkap, ~100 pages total
**B. Eksekusi 2 Teratas** — pilih 2 pendekatan terkuat, ~70 pages
**C. Eksekusi 1 Paling Relevan** — pilih 1 pendekatan saja

Untuk memilih, lihat profil pembaca target:
- **End-user / operator**: Pilih V2 (Naratif) atau V1+V2 hybrid
- **Developer / QA**: Pilih V1 (Struktural) atau V3 (Matrix)
- **All audiences**: V1 (paling balanced)

---

## Timeline Estimasi

| Fase | Durasi | Output |
|------|--------|--------|
| Research | 30 min | Best practice extraction, glossary |
| Structure | 15 min | TOC, directory layout |
| Content Gen | 60 min | ~60-80 pages total across 3 versions |
| Validation | 30 min | Cross-check, consistency, accuracy |
| Final | 15 min | Summary + recommendation |

**Total**: ~2 jam

---

## References untuk Enrichment

### V1 (Structural) Inspiration:
- Odoo Documentation: https://www.odoo.com/documentation/latest/
- SAP Help Portal: https://help.sap.com/
- Oracle ERP Cloud Docs
- Laravel Docusaurus pattern

### V2 (Narrative) Inspiration:
- Microsoft Learn Walkthroughs
- Notion Template (ERP guide)
- "Getting Started" style guides (Vue.js docs)
- User onboarding emails (Sequence approach)

### V3 (Matrix) Inspiration:
- Cucumber BDD syntax: https://cucumber.io/docs/bdd/
- Playwright Test Specs
- Swagger/OpenAPI docs structure
- DITA (Darwin Information Typing Architecture)

### Accounting Domain References:
- Double-entry bookkeeping fundamentals
- Chart of Accounts standard (Indonesia)
- Sub-ledger vs General Ledger reconciliation
- Period closing & locking principles
