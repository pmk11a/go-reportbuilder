# Config JSON Templates - High Complexity Reports

Template ini berisi konfigurasi JSON lengkap untuk berbagai skenario laporan kompleks yang didukung oleh Dynamic Report Engine.

## Struktur Database yang Digunakan

| Tabel | Fungsi |
|-------|--------|
| `dbmasterlaporan` | Master laporan (footer_bands, deskripsi) |
| `dbquerylaporan` | Query sumber data + config_json |
| `dbkolomlaporan` | Kolom tampilan (format, alignment, visibility) |
| `dbgroup  a lap  ora` | Grouping configuration (N-level) |
| `dbparameterlaporan` | Filter parameters |

## Template yang Tersedia

1. **Laporan Neraca (Labels-Only)** - Report dengan grouping tapi tanpa data fields
2. **Kartu Persediaan Multi-Level** - 4-level grouping (Warehouse → Category → Item → Batch)
3. **Jurnal General dengan 3 Dataset** - Multi-dataset dengan side-by-side layout
4. **Laporan Aging dengan Running Balance** - Perhitungan balance berjalan per grouping
5. **Cash Flow dengan Footer Bands Kompleks** - CH/GB Panel + Summary Table
6. **Laporan Konsolidasi 3 Level** - Entity → Division → Department → Account
7. **Report Budget vs Actual** - Comparative columns dengan formatting conditional

## Field-Field Penting

### dbquerylaporan.config_json
```json
{
  "static_params": {
    "@Tahun": "2024",
    "@KodeCabang": "C001"
  },
  "display_role": "detail",
  "detail_layout": "side_by_side"
}
```

### dbgroup  a lap  oran.config_json
```json
{
  "field_name": "KdbrgSJ",
  "label_mapping": {"J": "Jasa", "B": "Barang"},
  "running_total": true,
  "show_subtotal": true,
  "show_total": false
}
```

### footer_bands JSON
```json
{
  "bands": {
    "summary": {
      "footer_table": true,
      "chgb_panel": {
        "enabled": true,
        "rows": [...]
      }
    }
  }
}
```
