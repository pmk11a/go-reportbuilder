# Config JSON Templates Reference

## Overview

Template ini dirancang untuk high-complexity reports yang memanfaatkan semua fitur Dynamic Report Engine.

## Struktur Config JSON

### 1. dbquerylaporan.config_json

```json
{
  "display_role": "detail|summary|both",
  "detail_layout": "default|side_by_side",
  "static_params": {
    "@ParamName": "defaultValue"
  },
  "running_balance": {
    "enabled": true,
    "balance_column": "ColumnBal",
    "group_by": "KodeCustomer"
  },
  "multi_currency": {
    "enabled": true,
    "base_currency": "IDR",
    "display_currencies": ["USD", "EUR"],
    "conversion_rates": {
      "USD": 15000,
      "EUR": 16500
    }
  },
  "calculated_fields": [
    {
      "nama_kolom": "Variance",
      "expression": "Budget - Actual",
      "format_type": "currency"
    }
  ],
  "special_features": {
    "virtual_columns": [
      {
        "nama_kolom": "InOut",
        "expression": "CASE WHEN JenisTransaksi='IN' THEN '+' ELSE '-' END",
        "is_formula": true
      }
    ]
  }
}
```

### 2. dbgrouplaporan.config_json

```json
{
  "field_name": "KodeGroup",
  "label_mapping": {
    "CODE1": "Label 1",
    "CODE2": "Label 2"
  },
  "show_subtotal": true,
  "running_total": false,
  "render_mode": "default|labels_only",
  "conditional_formatting": {
    "FieldName": {
      "rule": "absolute|relative",
      "threshold": 1000000,
      "positive_color": "green",
      "negative_color": "red"
    }
  },
  "currency_converted": false
}
```

### 3. dbmasterlaporan.footer_bands

```json
{
  "bands": {
    "summary": {
      "footer_table": true,
      "rows": [
        {
          "label": "Total Debit",
          "field": "total_debit",
          "format": "currency"
        }
      ],
      "chgb_panel": {
        "enabled": true,
        "comparison_type": "year_over_year",
        "rows": [
          {
            "label": "Total Debit",
            "current_field": "total_debit",
            "prior_field": "total_debit_prior",
            "highlight_diff": true
          }
        ]
      }
    },
    "signature": {
      "enabled": true,
      "rows": [
        {"label": "Dibuat oleh:", "field": null, "position": "left"},
        {"label": "Diperiksa oleh:", "field": null, "position": "center"},
        {"label": "Disetujui oleh:", "field": null, "position": "right"}
      ]
    }
  }
}
```

## Special Handling Types

| Type | Description |
|------|-------------|
| `default` | Normal grouping dengan subtotal |
| `labels-only` | Hanya tampilkan label tanpa data fields (Neraca) |
| `side_by_side` | Layout side-by-side untuk multi-dataset |
| `running-balance` | Hitung running balance per group |
| `conditional-format` | Conditional formatting berdasarkan threshold |
| `hierarchical` | Hierarki bertingkat (CoA) |
| `multi-currency` | Multi mata uang dengan konversi |

## Template Files

| No | Template | Description |
|----|----------|-------------|
| 1 | `01-laporan-neraca-labels-only.json` | Report dengan grouping tanpa data |
| 2 | `02-kartu-persediaan-multi-level.json` | 4-level grouping (WH → CAT → ITEM → BATCH) |
| 3 | `03-jurnal-general-3-dataset.json` | Multi-dataset side-by-side |
| 4 | `04-aging-running-balance.json` | Running balance per customer |
| 5 | `05-cashflow-footer-complex.json` | CH/GB Panel + Summary Table |
| 6 | `06-konsolidasi-3-level.json` | Entity → Division → Department |
| 7 | `07-budget-vs-actual.json` | Conditional formatting variance |
| 8 | `08-warehouse-movement-detail.json` | Movement detail dengan virtual columns |
| 9 | `09-multi-currency-report.json` | Multi currency dengan konversi |
| 10 | `10-hierarchical-account.json` | CoA hierarki 5 level |

## Frontend Config Options

```json
{
  "rendering_mode": "n-level-grouping|labels-only|side-by-side|running-balance|conditional-formatting|hierarchical|multi-currency",
  "show_group_headers": true,
  "show_subtotals": true,
  "show_grand_total": true,
  "max_level": 4,
  "indent_level": true
}
```
