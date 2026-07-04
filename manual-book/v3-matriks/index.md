# ERP Trade Exchange — Manual Versi 3 (Matrix / Test-Driven Spec)

> **Dokumen Spesifikasi Pengujian & Referensi Teknis**
> Format: Matriks fitur + Test scenario (Given/When/Then) Bahasa Indonesia
> Target audiens: **QA tester**, **Developer** (untuk automation), **Business Analyst**

---

## Tentang Versi Ini

Versi 3 adalah dokumentasi **Test-Driven** yang menggabungkan tiga hal sekaligus:

1. **Spesifikasi fitur** dalam bentuk tabel presisi (path menu, akses, CRUD, validasi)
2. **Test scenario** dalam format Given/When/Then yang bisa langsung dijalankan oleh QA manual atau di-automate dengan Cucumber/Playwright
3. **Referensi teknis** pemetaan form UI → tabel database

Berbeda dengan V1 (reference naratif) dan V2 (story-driven), V3 **AI-parseable** dan **automation-ready**.

## Kapan Menggunakan V3

| Situasi | Pakai V3? |
|---------|-----------|
| Menulis test case manual untuk QA | ✅ Ya |
| Membuat automation script (Cucumber/Playwright) | ✅ Ya |
| Migrasi data, perlu tahu tabel impacted | ✅ Ya |
| Onboarding user baru (belajar klik tombol) | ❌ Tidak — pakai V2 |
| Reference cepat "field apa saja di form X" | ✅ Ya |

## Struktur Folder

```
v3-matriks/
├── index.md                # Dokumen ini
├── specs/                  # Spesifikasi per modul (14 file)
│   ├── spec-menu-navigasi.md
│   ├── spec-setup-berkas.md
│   ├── spec-master-accounting.md
│   ├── spec-master-bahan.md
│   ├── spec-master-supplier-customer.md
│   ├── spec-master-produksi.md
│   ├── spec-master-lain.md
│   ├── spec-kas-bank.md
│   ├── spec-memorial.md
│   ├── spec-pengadaan.md      # PR→RFQ→PO→LPB→Retur→Faktur Pajak (Procurement-to-Pay)
│   ├── spec-marketing.md      # SO→SPK→SJ→Invoice→Retur
│   ├── spec-produksi.md       # SPK, Mesin, Bahan, Hasil, Finishing
│   ├── spec-gudang.md         # Pengeluaran, Retur, Koreksi, Opname
│   └── spec-utilitas.md       # Stock recalc, HPP, Posting, Audit
├── test-suite/             # Test scenario Gherkin-style (9 file)
│   ├── login.feature
│   ├── master-data.feature
│   ├── kas-bank.feature
│   ├── memorial.feature
│   ├── pengadaan.feature
│   ├── marketing.feature
│   ├── produksi.feature
│   ├── gudang.feature
│   └── utilitas.feature
└── api-reference.md        # Mapping UI Form → Database Tables
```

## Konvensi Penulisan Spec

Setiap file `specs/spec-*.md` mengikuti pola tetap:

1. **Spec Table** — Properti | Value (path menu, akses, CRUD ops, validation)
2. **Field Reference Table** — Field | Tipe | Required | Keterangan
3. **Test Scenarios** — Format Given/When/Then dalam bahasa Indonesia
4. **Database Impact** — Tabel affected + posting debit/credit
5. **Edge Cases** — Validation error yang mungkin muncul

## Konvensi Penulisan Feature File

Setiap `*.feature` menggunakan format:

```
Fitur: <judul fitur>
  Sebagai <role>
  Saya ingin <goal>
  Agar <benefit>

  Latar Belakang:
    Given <prerequisite state>

  Skenario: <judul skenario>
    Given <kondisi awal>
    When <aksi>
    Then <ekspektasi hasil>
```

Tag yang digunakan:
- `@smoke` — Test critical path, dijalankan di setiap build
- `@regression` — Test penuh untuk validasi tidak ada regresi
- `@requires-otorisasi` — Test yang butuh otorisasi level tertentu

## Cakupan Modul Awal (6 Modul dari 5 Transkrip Pertama)

| # | Modul | Spec File | Feature File |
|---|-------|-----------|--------------|
| 1 | Master Data | specs/spec-master-*.md (5 file) | test-suite/master-data.feature |
| 2 | Akunting (Kas Bank + Memorial) | specs/spec-kas-bank.md, spec-memorial.md | test-suite/kas-bank.feature, memorial.feature |
| 3 | Reporting | _(detail belum ditranskrip)_ | — |
| 4 | Utilities / Setup Berkas | specs/spec-setup-berkas.md | test-suite/login.feature |
| 5 | Produksi (Master) | specs/spec-master-produksi.md | test-suite/master-data.feature |
| 6 | Gudang (Master Bahan) | specs/spec-master-bahan.md | test-suite/master-data.feature |


## Cakupan Modul Tambahan (5 Modul Baru — V3 Update)

| # | Modul | Spec File | Feature File |
|---|-------|-----------|--------------|
| 1 | **Pengadaan & Purchasing** (Procurement-to-Pay) | specs/spec-pengadaan.md | test-suite/pengadaan.feature |
| 2 | **Marketing** | specs/spec-marketing.md | test-suite/marketing.feature |
| 3 | **Produksi (Transaksi)** | specs/spec-produksi.md | test-suite/produksi.feature |
| 4 | **Gudang (Operasional)** | specs/spec-gudang.md | test-suite/gudang.feature |
| 5 | **Utilitas (Maintenance)** | specs/spec-utilitas.md | test-suite/utilitas.feature |

## Cakupan Modul Gabungan (8 Modul Total)

| # | Modul | Spec File | Feature File |
|---|-------|-----------|--------------|
| 1 | Master Data (COA, Bahan, Supplier, dll) | specs/spec-master-*.md | test-suite/master-data.feature |
| 2 | Akunting (Kas Bank + Memorial) | specs/spec-kas-bank.md, spec-memorial.md | test-suite/kas-bank.feature, memorial.feature |
| 3 | **Pengadaan & Purchasing** (PR→PO→LPB→Faktur Pajak) | specs/spec-pengadaan.md | test-suite/pengadaan.feature |
| 4 | **Marketing** (SO→SPK→SJ→Invoice→Retur) | specs/spec-marketing.md | test-suite/marketing.feature |
| 5 | **Produksi** (SPK, Mesin, Hasil, Finishing) | specs/spec-produksi.md | test-suite/produksi.feature |
| 6 | **Gudang** (Pengeluaran, Retur, Koreksi, Opname) | specs/spec-gudang.md | test-suite/gudang.feature |
| 7 | **Utilitas** (Hitung Ulang, HPP, Posting, Audit) | specs/spec-utilitas.md | test-suite/utilitas.feature |
| 8 | Setup Berkas | specs/spec-setup-berkas.md | test-suite/login.feature |

## Kode Transaksi (Auto-Posting Reference)

| Kode | Kepanjangan | Modul | Default Posisi |
|------|-------------|-------|---------------|
| BKM | Bukti Kas Masuk | Kas Bank | Debit Kas |
| BKK | Bukti Kas Keluar | Kas Bank | Kredit Kas |
| BBM | Bukti Bank Masuk | Kas Bank | Debit Bank |
| BBK | Bukti Bank Keluar | Kas Bank | Kredit Bank |
| BNM | Bukti Memorial | Memorial | Manual jurnal |
| BCK | Bukti Koleksi | Berkas | Penomoran |
| BJK | Bukti Jurnal Koreksi | Berkas | Penomoran |

## Aturan Otorisasi (Berlaku Cross-Modul)

Sistem memiliki **5 level otorisasi berjenjang** (Operator → Staff → Supervisor → Manager → Direktur). Aturan kunci:

- 1 user bisa **otorisasi banyak level**, tapi hanya boleh memegang **1 level** pada satu waktu
- Level N+1 hanya bisa menyetujui transaksi jika Level N sudah diotorisasi
- Tombol **Batal Otorisasi** melakukan reset seluruh level sekaligus
- Transaksi tidak bisa diedit/dihapus jika sudah diotorisasi penuh

## Versi Dokumen

| Versi | Tanggal | Catatan |
|-------|---------|---------|
| 1.0 | 2026-06-26 | Edisi pertama — berdasarkan 5 transkrip audio (6 modul awal) |
| 2.0 | 2026-07-10 | Penambahan 5 modul operasional baru (Pengadaan & Purchasing, Marketing, Produksi Transaksi, Gudang Operasional, Utilitas). Total: 8 modul ERP. V2: 10 hari tutorial, V3: 14 spec + 9 feature |

**Cara baca:** Mulai dari `spec-menu-navigasi.md` untuk paham struktur, lalu loncat ke modul spesifik. Untuk automation, langsung gunakan file `.feature` di `test-suite/`.
