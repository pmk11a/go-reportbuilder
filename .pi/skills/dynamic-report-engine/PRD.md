# PRD — Dynamic Report Engine (Laporan Dinamis)

> **Versi:** 1.0
> **Tanggal:** 2026-08-05
> **Status:** Implemented + Ongoing Enhancement
> **Pemilik:** Tim ERP Laravel Migration
> **Referensi:** be-fitur/app/Services/ReportService.php, docs/report-preview.md

---

## 1. Overview

### Latar Belakang
Sistem ERP legacy (Delphi + SQL Server 2008) memiliki ratusan laporan FastReport VCL (.fr3 + .pas) yang di-hardcode. Migrasi ke web (Nuxt 3 + Laravel) membuat seluruh konfigurasi laporan menjadi database-driven.

### Tujuan
1. Mengambil alih logika FastReport via DB configuration
2. Mengeksekusi SP SQL Server dengan type-safe placeholder substitution
3. Mendukung multi-dataset (T1/T2/T3)
4. Grouping bertingkat dengan subtotal
5. Admin No-Code designer
6. Integrasi Dynamic Browse untuk autocomplete
7. ACCESS matrix legacy via DBMENUREPORT

### Non-Goals
- Bukan WYSIWYG designer
- Bukan engine PDF/Excel baru
- Bukan pengganti Nota Print (layer B2 terpisah)
- Tidak mengubah DBMENUREPORT & DBFLMENUREPORT legacy

### Istilah
| Istilah | Definisi |
|---|---|
| KODEMENU | Kode unik laporan (leading zero). URL: /reports/{KODEMENU} |
| ACCESS | Kode dari .pas (contoh: 2020101). Untuk filter menu. |
| Dataset | Satu query SQL/SP |
| Filter | Parameter input. tipe: date, month, browse, text, checkbox |
| Column | Definisi kolom dengan format_type dan alignment |
| Grouping | Header + subtotal per field |
| footer_bands | JSON footer config (CH/GB panel) |
| config_json | JSON fleksibel per dataset |

---

## 2. Requirements

### Functional Requirements

#### F1 — Sidebar Menu Dinamis
- GET /api/menu/sidebar?userId=xxx
- Tree hierarchy L0 (1-7) dari DBMENUREPORT + DBFLMENUREPORT
- Filter Access = 1
- CP1252 -> UTF-8 conversion

#### F2 — Report Configuration Loader
- GET /api/reports/{kodeMenu}
- Return: id_laporan, KODEMENU, nama_laporan, filters[], datasets[], columns[], grouping[], footer_bands, defaultPeriod
- KODEMENU normalization (leading zero preservation)
- Parent filter resolution

#### F3 — Filter UI Dinamis
- Date -> DatePicker
- Month -> MonthPicker
- Browse -> BrowseAutocomplete
- Text -> Input text
- Checkbox -> Toggle
- Parent filter triggers child refresh

#### F4 — Report Generation Engine
- POST /api/reports/{kodeMenu}/preview
- Type-safe placeholder substitution
- Running balance computation
- Label mapping (dbLabelGrup)
- Grouped data building
- Grand total calculation

#### F5 — Rendering Components
- ReportTable (flat)
- GroupedTable (grouped + subtotal + grand total)
- useNumberFormatter for cell formatting
- Alignment support

#### F6 — Admin Report Designer
- /admin/reports page
- Tab: Info, Filters, Datasets, Columns, Groups, Access
- Preview panel
- Transactional save

#### F7 — Error Handling
- Log residual placeholders
- IMSSP error handling
- errors[] per dataset
- Graceful degradation

### Non-Functional Requirements
- Response time < 5s untuk <= 5K rows
- Uptime 99%
- SQL injection prevention
- Nuxt 3 SSR compatible

---

## 3. Architecture



### Data Flow


---

## 4. User Flow

### Regular User
1. Login -> token + userId
2. Sidebar load dari /api/menu/sidebar
3. Pilih laporan -> /reports/{KODEMENU}
4. Config load -> filter form render
5. Isi filter -> Generate
6. POST /preview -> render GroupedTable
7. Export/Print/Settings

### Admin User
1. Login Admin -> /admin/reports
2. Klik + Baru -> pilih KODEMENU
3. Tab Filters -> tambah parameter
4. Tab Datasets -> tambah query
5. Tab Columns -> tambah kolom
6. Tab Groups -> tambah grouping
7. Tab Access -> grant user
8. Preview -> Save

---

## 5. Database Schema

### Tabel Utama
- DBMENUREPORT (KODEMENU PK, Keterangan, L0, ACCESS)
- DBFLMENUREPORT (UserID+L1 PK, Access, IsDesign, Isexport)
- dbmasterlaporan (id_laporan PK, KODEMENU UK, nama_laporan, status_aktif, footer_bands JSON)
- dbparameterlaporan (nama_filter, tipe_input, wajib_isi, kode_browse, konfigurasi JSON)
- dbquerylaporan (nama_dataset, query_sumber_data, urutan, visible, config_json)
- dbkolomlaporan (nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible)
- dbgrouplaporan (group_level, group_field, label, show_subtotal, special_handling, config_json)
- dbbrowseconfigs (kode_browse PK, source_table, key_field, label_field, config_json)
- dbLabelGrup (field_name, field_value, label)

### Constraints Penting
1. KODEMENU leading zero: '02020101' != '2020101' (ACCESS)
2. nama_kolom case-sensitive
3. Placeholder: gunakan preg_replace + word boundary
4. IMSSP: catch empty result set
5. BrowseService cache per session

---

## 6. Success Metrics

| Metric | Target |
|---|---|
| Time-to-add new report | < 30 menit |
| Preview latency (5K rows) | < 5 detik |
| SQL injection | 0 incident |
| Deploy tanpa code | Ya |

---

## 7. Roadmap

### Phase 1-4 (Done)
- Foundation, Multi-dataset, Admin Designer, Dynamic Browse

### Phase 5 (Ongoing)
- Access check enforcement
- Redis caching
- Query timeout
- Audit trail
- Bulk import/export
- Versioning
- Mobile responsive
- Saved presets

### Phase 6 (Backlog)
- WYSIWYG designer
- Chart integration
- Scheduling + email
- Cross-report drill-down

---

## 8. References
- be-fitur/app/Services/ReportService.php
- be-fitur/app/Services/BrowseService.php
- docs/report-preview.md
- docs/report-seed-sql-generation.md
- .claude/memory/feedback/placeholder-substring-safety.md

---

**End of PRD**
