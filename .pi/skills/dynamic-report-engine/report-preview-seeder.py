#!/usr/bin/env python3
"""
report-preview-seeder.py — Seed dynamic report DB from legacy FrmReportPreview.pas

Parses:
  - case KodeReport of → ShowReportPreview(' Nama ', paramIndex)
  - paramIndex → dxTabSheet mapping (0..25)

Outputs:
  - INSERT SQL for dbmasterlaporan (report metadata)
  - INSERT SQL for dbparameterlaporan (filter config per report)
  - JSON manifest: {kode_menu, nama, param_index, dx_tab_sheet}

Usage:
  python report-preview-seeder.py \
    --src "D:/TestLaB/piagent/Bca/ReportPreview/FrmReportPreview.pas" \
    --out "d:/TestLaB/piagent/.claude/extractedReports/seed/"
"""

from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path


# ── Mapping paramIndex → dxTabSheet (from FrmReportPreview.pas analysis) ──────
PARAM_TO_TAB = {
    -1: None,       # No form (static report)
    0: 1,           # Default: Divisi + Periode
    1: 2,           # Single date filter
    2: 3,           # Date range + Perkiraan
    3: 4,           # Jurnal entry type
    4: 5,           # Perkiraan range
    5: 6,           # Period + Devisi
    6: 7,           # Single date
    7: 8,           # Cust/Supp + Valas
    8: 9,           # Multi-period
    9: 10,          # Gudang + Satuan
    10: 11,         # Stock type
    11: 12,         # Sales analysis
    12: 13,         # HPP
    13: 14,         # Biaya 1 tahun
    14: 15,         # Aktiva + Penyusutan
    15: 16,         # Pembelian per tipe
    16: 17,         # Production order
    17: 18,         # Stock akhir produksi
    18: 19,         # Stok fisik
    19: 20,         # Stok harian
    20: 21,         # Kartu stock
    21: 22,         # Target sales
    22: 23,         # Harga beli terakhir
    23: 24,         # Komisi detail
    24: 25,         # Multi-tab complex
}


def extract_reports(filepath: Path) -> list[dict]:
    """
    Parse FrmReportPreview.pas and extract report definitions.
    
    Strategy:
    1. Find all 'case KodeReport of' blocks (there are multiple)
    2. For each block, extract:
       - Code(s) on the left side (e.g. "101" or "1104,1200")
       - ShowReportPreview call with name and param index
    3. Handle both simple lines and inline BEGIN...END blocks
    """
    content = filepath.read_text(encoding="utf-8", errors="replace")
    lines = content.splitlines()
    
    reports = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Look for "case KodeReport of"
        if re.match(r'^case\s+KodeReport\s+of\s*$', stripped, re.IGNORECASE):
            i += 1
            current_code = None
            
            while i < len(lines):
                curr = lines[i].strip()
                
                # Skip empty lines and comments
                if not curr or curr.startswith('//'):
                    i += 1
                    continue
                
                # Check for "end;" (end of case block)
                if curr == 'end;':
                    i += 1
                    break
                
                # Pattern: "CODES : ShowReportPreview(' NAME ', PARAM);"
                m = re.match(
                    r"([\d\s,]+)\s*:\s*ShowReportPreview\(\s*'([^']*)'\s*,\s*(-?\d+)\s*\)\s*;",
                    curr,
                    re.IGNORECASE,
                )
                if m:
                    codes_str, nama, param_str = m.group(1), m.group(2), m.group(3)
                    param_index = int(param_str)
                    for code_str in codes_str.split(','):
                        code_str = code_str.strip()
                        if not code_str:
                            continue
                        try:
                            kode = int(code_str)
                            tab_sheet = PARAM_TO_TAB.get(param_index)
                            reports.append({
                                "kode_menu": f"{kode:06d}",
                                "nama_laporan": nama.strip(),
                                "param_index": param_index,
                                "dx_tab_sheet": tab_sheet,
                            })
                        except ValueError:
                            pass
                    current_code = None
                    i += 1
                    continue
                
                # Pattern: "CODES : BEGIN"
                m = re.match(r"([\d\s,]+)\s*:\s*BEGIN\s*$", curr, re.IGNORECASE)
                if m:
                    codes_str = m.group(1)
                    for code_str in codes_str.split(','):
                        code_str = code_str.strip()
                        if code_str:
                            try:
                                current_code = int(code_str)
                            except ValueError:
                                pass
                    i += 1
                    continue
                
                # Pattern: "ShowReportPreview(' NAME ', PARAM);" inside BEGIN block
                if current_code:
                    m = re.match(
                        r"ShowReportPreview\(\s*'([^']*)'\s*,\s*(-?\d+)\s*\)\s*;",
                        curr,
                        re.IGNORECASE,
                    )
                    if m:
                        nama = m.group(1).strip()
                        param_index = int(m.group(2))
                        tab_sheet = PARAM_TO_TAB.get(param_index)
                        reports.append({
                            "kode_menu": f"{current_code:06d}",
                            "nama_laporan": nama,
                            "param_index": param_index,
                            "dx_tab_sheet": tab_sheet,
                        })
                    i += 1
                    continue
                
                i += 1
            continue
        
        i += 1
    
    return reports


def generate_master_sql(reports: list[dict]) -> list[str]:
    """Generate INSERT statements for dbmasterlaporan."""
    sql = []
    sql.append("-- dbmasterlaporan seed")
    sql.append("-- Generated by report-preview-seeder.py")
    sql.append("-- Run: INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)")
    sql.append("")

    for r in reports:
        kode = r["kode_menu"]
        nama = r["nama_laporan"].replace("'", "''")
        footer_bands = "[]"
        status_aktif = 1

        sql.append(
            f"INSERT INTO dbmasterlaporan "
            f"(KODEMENU, nama_laporan, status_aktif, footer_bands) "
            f"VALUES ('{kode}', '{nama}', {status_aktif}, '{footer_bands}');"
        )

    return sql


def generate_param_sql(reports: list[dict]) -> list[str]:
    """Generate INSERT statements for dbparameterlaporan."""
    TAB_PARAM_MAP = {
        1: [
            {"nama_filter": "divisi", "tipe_input": "browse", "kode_browse": "0001", "wajib_isi": 1},
            {"nama_filter": "periode_awal", "tipe_input": "date", "wajib_isi": 1},
            {"nama_filter": "periode_akhir", "tipe_input": "date", "wajib_isi": 1},
        ],
        2: [
            {"nama_filter": "tanggal", "tipe_input": "date", "wajib_isi": 1},
        ],
        3: [
            {"nama_filter": "perkiraan_awal", "tipe_input": "text", "wajib_isi": 0},
            {"nama_filter": "perkiraan_akhir", "tipe_input": "text", "wajib_isi": 0},
            {"nama_filter": "periode_awal", "tipe_input": "date", "wajib_isi": 1},
            {"nama_filter": "periode_akhir", "tipe_input": "date", "wajib_isi": 1},
        ],
        4: [
            {"nama_filter": "jurnal", "tipe_input": "browse", "kode_browse": "0013", "wajib_isi": 0},
            {"nama_filter": "periode_awal", "tipe_input": "date", "wajib_isi": 1},
            {"nama_filter": "periode_akhir", "tipe_input": "date", "wajib_isi": 1},
        ],
        5: [
            {"nama_filter": "perkiraan_awal", "tipe_input": "text", "wajib_isi": 0},
            {"nama_filter": "perkiraan_akhir", "tipe_input": "text", "wajib_isi": 0},
        ],
        7: [
            {"nama_filter": "customer", "tipe_input": "browse", "kode_browse": "0002", "wajib_isi": 0},
            {"nama_filter": "supplier", "tipe_input": "browse", "kode_browse": "0003", "wajib_isi": 0},
            {"nama_filter": "valas", "tipe_input": "text", "wajib_isi": 0},
            {"nama_filter": "urutan", "tipe_input": "browse", "kode_browse": "0004", "wajib_isi": 0},
        ],
        11: [
            {"nama_filter": "sales", "tipe_input": "browse", "kode_browse": "0005", "wajib_isi": 0},
            {"nama_filter": "periode_awal", "tipe_input": "date", "wajib_isi": 1},
            {"nama_filter": "periode_akhir", "tipe_input": "date", "wajib_isi": 1},
        ],
        15: [
            {"nama_filter": "tipe", "tipe_input": "browse", "kode_browse": "0006", "wajib_isi": 0},
            {"nama_filter": "periode_awal", "tipe_input": "date", "wajib_isi": 1},
            {"nama_filter": "periode_akhir", "tipe_input": "date", "wajib_isi": 1},
        ],
        16: [
            {"nama_filter": "sgo", "tipe_input": "text", "wajib_isi": 0},
            {"nama_filter": "periode_awal", "tipe_input": "date", "wajib_isi": 1},
            {"nama_filter": "periode_akhir", "tipe_input": "date", "wajib_isi": 1},
        ],
        19: [
            {"nama_filter": "gudang", "tipe_input": "browse", "kode_browse": "0007", "wajib_isi": 0},
            {"nama_filter": "tanggal", "tipe_input": "date", "wajib_isi": 1},
        ],
        20: [
            {"nama_filter": "gudang", "tipe_input": "browse", "kode_browse": "0007", "wajib_isi": 0},
            {"nama_filter": "tanggal", "tipe_input": "date", "wajib_isi": 1},
        ],
    }

    sql = []
    sql.append("-- dbparameterlaporan seed")
    sql.append("-- Generated by report-preview-seeder.py")
    sql.append("")

    for r in reports:
        if r["dx_tab_sheet"] is None:
            continue

        tab = r["dx_tab_sheet"]
        params = TAB_PARAM_MAP.get(tab, [
            {"nama_filter": "periode_awal", "tipe_input": "date", "wajib_isi": 1},
            {"nama_filter": "periode_akhir", "tipe_input": "date", "wajib_isi": 1},
        ])

        for p in params:
            nama_filter = p["nama_filter"].replace("'", "''")
            tipe = p["tipe_input"]
            wajib = p["wajib_isi"]
            kode_browse = p.get("kode_browse", "")
            if kode_browse:
                kode_browse = f"'{kode_browse}'"
            else:
                kode_browse = "NULL"

            sql.append(
                f"INSERT INTO dbparameterlaporan "
                f"(kode_menu, nama_filter, tipe_input, wajib_isi, kode_browse) "
                f"VALUES ('{r['kode_menu']}', '{nama_filter}', '{tipe}', {wajib}, {kode_browse});"
            )

    return sql


def main() -> int:
    p = argparse.ArgumentParser(description="Seed dynamic report DB from FrmReportPreview.pas")
    p.add_argument("--src", default="D:/TestLaB/piagent/Bca/ReportPreview/FrmReportPreview.pas",
                   help="Path to FrmReportPreview.pas")
    p.add_argument("--out", default="D:/TestLaB/piagent/.claude/extractedReports/seed/",
                   help="Output directory")
    args = p.parse_args()

    src = Path(args.src)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    print(f"Reading: {src}")
    if not src.exists():
        print(f"ERROR: File not found: {src}", file=sys.stderr)
        return 1

    reports = extract_reports(src)
    if not reports:
        print("ERROR: No reports found. Check parsing logic.", file=sys.stderr)
        return 1

    print(f"Found {len(reports)} reports")

    # Generate SQL
    master_sql = generate_master_sql(reports)
    param_sql = generate_param_sql(reports)

    # Write files
    (out / "masterlaporan_insert.sql").write_text("\n".join(master_sql), encoding="utf-8")
    (out / "parameterlaporan_insert.sql").write_text("\n".join(param_sql), encoding="utf-8")
    
    # Write manifest
    manifest = {
        "generated_at": "report-preview-seeder.py",
        "total_reports": len(reports),
        "reports": reports,
    }
    (out / "report_manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\nDone! Files:")
    print(f"  - {out / 'masterlaporan_insert.sql'} ({len(master_sql) - 5} INSERT statements)")
    print(f"  - {out / 'parameterlaporan_insert.sql'} ({len(param_sql) - 3} INSERT statements)")
    print(f"  - {out / 'report_manifest.json'}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
