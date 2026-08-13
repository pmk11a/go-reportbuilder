# Sample Walkthrough — Kas Harian (KODEMENU 020101)

This directory is the canonical end-to-end example for `/delphi-report-renderer`.
All findings below are based on **real extracted data**.

---

## What was extracted

| Metric | Value |
|---|---|
| `.fr3` file | `ReportKasHarian.fr3` |
| Page | A4 Portrait, 210 × 297 mm |
| Margins | L 5mm / T 10mm / R 5mm / B 10mm |
| Total bands | 5 (`PageFooter`, `PageHeader`, `MasterData`, `Footer`, `GroupHeader`) |
| Total cells | 77 (`PageHeader` 16, `MasterData` 8, `Footer` 52, others minor) |
| Data columns in MasterData | 8 (`tanggal`, `nobukti`, `Keterangan`, `lawan`, `kredit`, `debet`, `kredit2`, `Debet2`) |
| Paper width usable | 200 mm (210 − 5 − 5) |
| Font used | `Tahoma` 11pt throughout |
| PascalScript | Yes — `Footer1OnBeforePrint` computes `Tunai`, `SaldoAkhirD/K` |

---

## Geometry highlights

### MasterData band (8 cells — data rows)

| Cell | DataField | Left | Width | Align |
|---|---|---|---|---|
| Memo4 | `tanggal` | 0 mm | 64.25 mm | left |
| Memo5 | `nobukti` | 64.25 mm | 117.17 mm | left |
| Memo6 | `Keterangan` | 181.42 mm | 173.86 mm | left |
| Memo7 | `lawan` | 355.28 mm | 52.91 mm | left |
| Memo10 | `debet` | 408.19 mm | 86.93 mm | **right** |
| Memo9 | `kredit` | 582.05 mm | 86.93 mm | **right** |
| Memo11 | `Debet2` | 495.12 mm | 86.93 mm | **right** |
| Memo8 | `kredit2` | 668.98 mm | 86.93 mm | **right** |

**Challenge:** `debet` column is at **408 mm**, `kredit` at **582 mm** — they are NOT adjacent.
Tailwind's CSS grid cannot express this non-sequential column order easily.
With `position: absolute; left: 408.19mm`, Fr3Canvas renders them correctly.

### Footer band (52 cells — computed summary table)

This is the most complex band. It contains:
- A 2-column summary grid (TUNAI/CH-GB columns, DEBET/KREDIT rows)
- Signature lines (Pimpinan, Kasir, Keuangan)
- Vertical divider line (Memo71)
- Multiple sub-rows for Bon/Giro breakdown

The 52 cells are NOT a simple `<table>`. They are absolute-positioned cells
stacked inside a 173.86 mm-tall footer band.

**This is exactly why** the Tailwind `<table>` approach fails for Kas Harian:
the summary table has a 2×2 inner grid that does not map to HTML table semantics.

### PascalScript (what it does)

```pascal
var Tunai, Saldo, TotalD, TotalK, SaldoAwalD, SaldoAwalK, SaldoAkhirD, SaldoAkhirK: real;

procedure Footer1OnBeforePrint(Sender: TfrxComponent);
begin
  SaldoAwalD  := SaldoAwal;        // from T1 (summary dataset)
  SaldoAwalK  := 0;
  SaldoAkhirD := 0;
  SaldoAkhirK := SaldoAwal + sum(Debet, MasterData1) - sum(kredit, MasterData1);
  TotalD := sum(Debet, MasterData1) + SaldoAwalD + SaldoAkhirD;
  Tunai  := sum(Debet, MasterData1) + sum(Debet2, MasterData1)
            - sum(kredit, MasterData1) - sum(kredit2, MasterData1)
            - (SaldoGiro + SaldoBon + ...);
end;
```

**Implication for web:** The `config_json` in `dbquerylaporan` must declare
these as computed fields. The `Footer1` cells in the `.fr3` reference the
computed variable names (e.g. `Memo38.Text = [SaldoAkhirK]`). Our
`Fr3Canvas` cannot execute PascalScript — these cells will render the
SP-returned column values, not the FastReport-computed ones.

**Resolution:** The Laravel `ReportService` must compute `SaldoAkhirK`,
`TotalD`, `Tunai`, etc. in PHP (matching the PascalScript logic) and
return them as dataset columns. Then Fr3Canvas renders them as normal data.

See `docs/report-seed-sql-generation.md` § 7 (config_json) and § 10
(PascalScript extraction).

---

## HTML output that will be generated

For `MasterData1` with one row `{ tanggal: "01/01/2025", nobukti: "KS/2025/0001", ... }`,
the `ReportRenderController::renderHtml()` emits:

```html
<div class="fr3-canvas" style="width: 210mm; padding: 10mm 5mm 10mm 5mm;">
  <!-- PageHeader -->
  <div class="fr3-band" style="height: 83.1497mm;">
    <div class="fr3-cell" style="left: 0mm; top: 0mm; width: 260.7875mm; height: 37.7953mm;
         font-family: Tahoma; font-size: 19pt; text-align: center;">LAPORAN KAS HARIAN</div>
    <!-- ... 15 more header cells ... -->
  </div>

  <!-- MasterData (repeated per row) -->
  <div class="fr3-band" style="height: 18.8976mm;">
    <div class="fr3-cell" style="left: 0mm; top: 0mm; width: 64.252mm; height: 18.8976mm;
         font-family: Tahoma; font-size: 11pt;">01/01/2025</div>
    <div class="fr3-cell" style="left: 64.252mm; top: 0mm; width: 117.1654mm;
         height: 18.8976mm; font-family: Tahoma; font-size: 11pt;">KS/2025/0001</div>
    <div class="fr3-cell" style="left: 181.4173mm; top: 0mm; width: 173.8584mm;
         height: 18.8976mm; font-family: Tahoma; font-size: 11pt;">Setoran Tunai</div>
    <div class="fr3-cell" style="left: 355.2758mm; top: 0mm; width: 52.9134mm;
         height: 18.8976mm; font-family: Tahoma; font-size: 11pt;">Kasir</div>
    <!-- debit column at 408mm (NOT adjacent to kredit at 582mm) -->
    <div class="fr3-cell" style="left: 408.1892mm; top: 0mm; width: 86.9291mm;
         height: 18.8976mm; font-family: Tahoma; font-size: 11pt; text-align: right;">500,000</div>
    <div class="fr3-cell" style="left: 582.0476mm; top: 0mm; width: 86.9291mm;
         height: 18.8976mm; font-family: Tahoma; font-size: 11pt; text-align: right;">0</div>
    <!-- ... 2 more debit/credit cells ... -->
  </div>
</div>
```

---

## Action items to make 020101 render correctly

1. **[DONE]** `extract_geometry.py` — geometry extracted
2. **[DONE]** `fr3_to_css.py` — CSS for each cell verified
3. **[TODO]** `snapshot_dbkolom.py` — run once to enable `validate_match.py`
4. **[TODO]** Wire `Fr3Canvas` into `fe-fitur/pages/reports/[kode].vue`
5. **[TODO]** Confirm `ReportService` computes `Tunai`, `SaldoAkhirK`, etc.
   — check if existing `config_json` for `KODEMENU=020101` has them.
   If not, add to `dbquerylaporan` + `dbkolomlaporan`.
6. **[TODO]** Verify PDF paper size — dompdf's `setPaper('a4', 'portrait')`
   matches the 210×297mm geometry.
7. **[TODO]** Side-by-side compare: FastReport preview vs `GET /export/html`

---

## Files in this sample

```
020101_kas_harian/
├── README.md                      ← this file
├── geometry_snapshot.json          ← ReportKasHarian.fr3 extracted geometry
├── masterdata_cells.csv           ← all 8 MasterData cell positions
└── expected_html_fragment.txt     ← what renderHtml() should emit for 1 row
```
