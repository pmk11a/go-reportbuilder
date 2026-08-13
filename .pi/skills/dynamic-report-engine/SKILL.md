---
name: dynamic-report-engine
description: |
  Database-driven report engine for SQL Server + Laravel + Nuxt.
  Single rendering mode (config): dbmasterlaporan.footer_bands + dbquerylaporan.config_json
  drive ReportService.php (PHP) → GroupedTable.vue (Nuxt) rendering.

  Source: Imported from d:/TestLaB/FitiurOri/ (original production implementation).
  Added: report-preview-seeder.py (parse FrmReportPreview.pas → seed SQL).

  Pipeline:
    1. Seed — report-preview-seeder.py parses FrmReportPreview.pas case blocks,
       maps ShowReportPreview(' Name ', paramIndex) → INSERT SQL for
       dbmasterlaporan / dbparameterlaporan (103 reports mapped).
    2. Render — Nuxt page [kode].vue calls /api/reports/{kode}/preview,
       ReportService.executeReport() runs dbquerylaporan SPs, applies
       config_json.computed formulas (SaldoAkhirD, TotalD, Tunai, etc.),
       and feeds data to GroupedTable + footer_bands summary section.

  Use when: seeding legacy .pas dispatch tables, executing SP-driven reports,
  rendering grouped + subtotal reports with CH/GB panel and computed totals,
  or managing the dbmasterlaporan / dbparameterlaporan / dbquerylaporan /
  dbkolomlaporan / dbgrouplaporan schema.

  Excludes: 1:1 .fr3 geometry replication (use fr3-renderer/web/ instead).
---

# Dynamic Report Engine

Database-driven report engine — config-driven, NOT geometry-driven.

## Why no geometry mode

Empirical analysis of 745 `.fr3` files in `Bca/ReportFiles/`:

| Metric | Value |
|---|---|
| Reports with multi-band (GroupHeader+Footer+MasterData+PageHeader+PageFooter) | **576 (77%)** |
| Reports with PascalScript | **749 (99%)** |
| Reports using grouping pattern (multi-band) | **majority** |
| Reports with `TfrxCrossObject` (cross-tab) | **0** |
| Reports with `TfrxDBCrossView` (overlay) | **1** |

**Conclusion**: Original `FitiurOri/` already covered all common report
patterns via `GroupedTable + footer_bands + config_json`. Geometry 1:1 mode
not needed for production.

`fr3-renderer/` exists as **experimental reference** but is **not part of
this skill**.

## Architecture

```
legacy/
├── Bca/ReportPreview/FrmReportPreview.pas   ← case KodeReport of dispatch table
├── Bca/ReportFiles/*.fr3                    ← 745 FastReport files (reference)
└── pwt/Unit/*.pas                           ← Business logic (optional seed source)

seed/
└── report-preview-seeder.py                  ← parse .pas → INSERT SQL (no geometry)

database (SQL Server dbbcagroup):
├── dbmasterlaporan                          ← KODEMENU, nama_laporan, footer_bands (JSON)
├── dbparameterlaporan                       ← filter config (type, browse, wajib_isi)
├── dbquerylaporan                           ← SP queries + config_json (computed formulas)
├── dbkolomlaporan                           ← columns (format_type, alignment, label_tampil)
├── dbgrouplaporan                           ← grouping + subtotal + config_json
├── dbbrowseconfigs                          ← autocomplete browse
└── dbLabelGrup                              ← field_value → label mapping

be-fitur/app/Services/                       ← [FROM FitiurOri/]
├── ReportService.php                         ← 1026 lines, full engine
│   ├─ getReportConfig()                      ← loads master+params+queries+columns+groups
│   ├─ generateReport()                       ← executes SPs, applies computed, builds groups
│   ├─ executeQuery()                         ← @param substitution, residual NULL handling
│   ├─ computeRunningBalance()                ← SaldoAkhir accumulator
│   └─ buildGroupedData()                     ← 2-level grouping + subtotal
└── BrowseService.php                         ← autocomplete config loader

be-fitur/app/Models/                         ← [FROM FitiurOri/]
└── LabelGrup.php                             ← label mapping service

fe-fitur/components/                         ← [FROM FitiurOri/]
├── GroupedTable.vue                          ← 272 lines, grouped + subtotal + grand total
└── ReportTable.vue                           ← 97 lines, flat mode (no grouping)

fe-fitur/composables/                        ← [FROM FitiurOri/]
├── useGroupingConfig.ts                      ← 57 lines, grouping helpers
└── useNumberFormatter.ts                     ← 172 lines, cell formatting (user prefs)

fe-fitur/pages/reports/                      ← [FROM FitiurOri/]
├── [kode].vue                                ← 1388 lines, dynamic report page
│   ├─ t1SummaryData computed                 ← config_json.computed formulas
│   ├─ footerTable computed                   ← footer_bands.bands.summary.footer_table
│   ├─ signatureItems computed                ← footer_bands.bands.summary.signatures
│   ├─ chgbPanel computed                     ← CH/GB panel from footer_bands
│   └─ GroupedTable × detailDatasets          ← multi-dataset rendering
└── index.vue                                 ← report list

bin/                                         ← [FROM fr3-renderer/ — experimental]
├── extract_geometry.py                       ← parse .fr3 → fr3_geometry.json (legacy, not used)
├── fr3_to_css.py                             ← cell → CSS (legacy, not used)
├── validate_match.py                         ← .fr3 vs dbkolomlaporan audit (legacy)
├── snapshot_dbkolom.py                       ← DB → JSON snapshot (legacy)
└── report-preview-seeder.py                  ← CURRENTLY USED: parse .pas → seed SQL
```

## Schema Reference (matches `FitiurOri/` production)

### `dbmasterlaporan.footer_bands` (JSON)
```json
{
  "bands": {
    "title":     {"enabled": true, "content": "LAPORAN KAS", "align": "center"},
    "pageHeader": {"enabled": true, "content": "Kas Harian"},
    "summary":   {
      "enabled": true,
      "layout": {"columns": 3, "alignment": "spread"},
      "footer_table": {
        "rows": ["Jumlah", "Saldo Awal", "Saldo Akhir", "Kontrol"],
        "columns": ["Penerimaan", "Pengeluaran"]
      },
      "signatures": [
        {"label": "Kontrol",  "position": "left"},
        {"label": "Kasir",    "position": "center"},
        {"label": "Pimpinan", "position": "right"}
      ]
    }
  }
}
```

### `dbquerylaporan.config_json` (JSON, per dataset)
```json
{
  "display_role":   "summary",
  "summary_fields": ["SaldoAwal", "SaldoGiro", "SaldoBon", "TotalD", "Tunai"],
  "right_fields":   [],
  "t2_sum_fields":  ["Debet", "kredit"],
  "bon_giro_fields": ["SaldoGiro", "SaldoBon"],
  "computed": {
    "SaldoAkhirK": {
      "expression": "SaldoAwal + sum(Debet) - sum(kredit)",
      "operands":   {"SaldoAwal": "t1", "Debet": "sum:t2", "kredit": "sum:t2"}
    },
    "Tunai": {
      "expression": "sum(Debet) + SaldoAwal - sum(kredit) - (SaldoGiro + SaldoBon)",
      "operands":   {"Debet": "sum:t2", "kredit": "sum:t2", "SaldoAwal": "t1", "SaldoGiro": "t1", "SaldoBon": "t1"}
    }
  },
  "summary_layout": "footer_only"
}
```

### `dbgrouplaporan.config_json` (JSON, per group)
```json
{
  "field_name":        "grupAP1",
  "special_handling":  "default"
}
```

## Quick Start

### 1. Seed reports from legacy (one-time)
```bash
python report-preview-seeder.py
# Output: .claude/extractedReports/seed/masterlaporan_insert.sql    (102 INSERTs)
#         .claude/extractedReports/seed/parameterlaporan_insert.sql (203 INSERTs)
#         .claude/extractedReports/seed/report_manifest.json        (103 reports)
```

### 2. Nuxt page
```vue
<!-- pages/reports/[kode].vue (from FitiurOri, already complete) -->
<template>
  <GroupedTable
    :grouped-data="getGroupedForDataset(dataset.nama_dataset)"
    :columns="reportStore.columns"
    :grand-total="reportStore.grandTotal"
    :main-dataset="dataset.nama_dataset"
    :kode-menu="kodeMenu"
  />
</template>
```

### 3. Backend endpoint
```php
// ReportController.php — already wired in FitiurOri/
GET /api/reports/{kodeMenu}/preview
  → ReportService.generateReport($kodeMenu, $filters)
  → returns datasets + groupedData + grandTotal + config
```

## Seed Statistics

| Metric | Value |
|--------|-------|
| Total reports extracted | **103** |
| Static reports (no form) | 24 (param=-1) |
| Reports with forms | 79 (param=0..24) |
| Tab distribution | {1: 14, 4: 9, 8: 9, 12: 19, 16: 20, 17: 1, 18: 3, 22: 2, 25: 1} |

## PascalScript vs config_json.computed

`.fr3` PascalScript (Footer1OnBeforePrint) is **extracted as text** by
`extract_geometry.py` but NOT executed at runtime. The skill requires
manual translation:

| `.fr3` PascalScript | `dbquerylaporan.config_json.computed` |
|---|---|
| `SaldoAkhir := SaldoAkhir + frxDBData."saldoakhir"` | `ReportService::computeRunningBalance()` (auto for SaldoRp / SaldoAkhir columns) |
| `SaldoAkhirD := 0` | `{"expression": "0", "operands": {}}` |
| `TotalD := sum(Debet) + SaldoAwalD + SaldoAkhirD` | `{"expression": "sum(Debet) + SaldoAwalD + SaldoAkhirD", "operands": {"Debet": "sum:t2", ...}}` |

Reference: `sql/dbinsert_20101_kas_harian.sql` (T1 config_json with full
SaldoAwalK / SaldoAkhirK / TotalD / TotalK / Tunai formulas).

## Limitations

- `dbquerylaporan` queries NOT auto-seeded (require manual INSERT with SP names)
- `dbkolomlaporan` columns NOT auto-seeded (require manual INSERT or parse .fr3)
- `dbgrouplaporan` groups NOT auto-seeded (require manual INSERT)
- Cross-tab (`TfrxCrossObject`) — none in current 745 reports, fallback is generic table
- 30 MB geometry cache exists at `fr3-renderer/web/` but is **not part of this skill**

## Related

- `delphi-migrator/` — migrate Delphi `.pas` units to TypeScript (separate concern)
- `fr3-renderer/` — experimental 1:1 .fr3 layout replication (NOT in this skill)
- `d:/TestLaB/FitiurOri/` — source of all imported PHP/Vue/TS files
