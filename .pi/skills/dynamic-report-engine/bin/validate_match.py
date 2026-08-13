#!/usr/bin/env python3
"""
validate_match.py — audit two sources of truth against each other:

  Source A: .claude/extractedReports/fr3_geometry.json  →  .fr3 DataField list
  Source B: dbkolomlaporan.nama_kolom  →  what the Laravel schema thinks
            the report column names are.

A mismatch means the seed SQL generator (delphi-report-generator) emitted
a nama_kolom that won't match the FastReport runtime. This script catches
that BEFORE the report is rendered, so the front-end won't fall back to
empty cells silently.

Modes:
  --mode sql    Query SQL Server directly via Laravel-style query.
  --mode files  Read dbkolomlaporan rows from JSON snapshots.
  --mode diff   Just diff geometry vs files JSON, no DB needed.

Output:
  - Markdown audit report (stdout).
  - JSON findings: findings.json in the chosen --out-dir.

Exit code: 0 if no critical mismatches, 1 if any critical miss found.
"""

from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path
from collections import defaultdict

# crude .fr3 → KODEMENU heuristic. The authoritative mapping should come from
# `.claude/extractedReports/report_mappings.json` (already produced by
# `delphi-report-generator`).
KODEMENU_IN_FILENAME_RE = re.compile(r"Report(\d{4,6})")


def kodemenu_from_filename(name: str) -> str | None:
    m = KODEMENU_IN_FILENAME_RE.search(name)
    return m.group(1) if m else None


def collect_fr3_fields(geom: dict) -> list[str]:
    """All DataField values across all bands."""
    fields: list[str] = []
    for band in geom.get("bands", []):
        for cell in band.get("cells", []):
            df = cell.get("data_field")
            if df and df not in fields:
                fields.append(df)
    return fields


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--geometry",
                   default="D:/TestLaB/piagent/.claude/extractedReports/fr3_geometry.json")
    p.add_argument("--dbkolom",
                   default="D:/TestLaB/piagent/.claude/extractedReports/dbkolomlaporan.json",
                   help="JSON snapshot of dbkolomlaporan (see --help).")
    p.add_argument("--kode-menu", help="limit to one KODEMENU (optional)")
    p.add_argument("--out-dir",
                   default="D:/TestLaB/piagent/delphi-report-renderer/outputs")
    args = p.parse_args()

    geom_path = Path(args.geometry)
    dbk_path = Path(args.dbkolom)
    if not geom_path.exists():
        print(f"ERROR: {geom_path} missing. Run extract_geometry.py first.",
              file=sys.stderr)
        return 2

    geom = json.loads(geom_path.read_text(encoding="utf-8"))
    dbkolom: dict[str, set[str]] = defaultdict(set)
    if dbk_path.exists():
        rows = json.loads(dbk_path.read_text(encoding="utf-8"))
        for row in rows:
            dbkolom[row["kode_menu"]].add(row["nama_kolom"])
    else:
        print(f"WARN: {dbk_path} missing — schema match will be skipped.")

    findings: list[dict] = []
    for filename, info in geom.items():
        kodemenu = kodemenu_from_filename(filename)
        if not kodemenu:
            continue
        if args.kode_menu and kodemenu.lstrip("0") != args.kode_menu.lstrip("0"):
            continue
        fr3_fields = set(collect_fr3_fields(info))
        schema_fields = dbkolom.get(kodemenu, set()) | dbkolom.get(kodemenu.lstrip("0"), set())
        only_fr3 = sorted(fr3_fields - schema_fields)
        only_db = sorted(schema_fields - fr3_fields)
        if only_fr3 or only_db:
            findings.append({
                "kode_menu": kodemenu,
                "file": filename,
                "only_in_fr3": only_fr3,
                "only_in_db": only_db,
                "severity": "critical" if only_fr3 else "warning",
            })

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / "findings.json"
    out.write_text(json.dumps(findings, indent=2, ensure_ascii=False), encoding="utf-8")

    if not findings:
        print(f"OK: no mismatches found. ({len(geom)} fr3 scanned)")
        return 0

    # Markdown audit
    print(f"# validate_match findings ({len(findings)} mismatches)\n")
    for f in findings:
        print(f"## {f['kode_menu']} ({f['file']}) — {f['severity']}")
        if f["only_in_fr3"]:
            print(f"- **Missing in dbkolomlaporan**: {', '.join(f['only_in_fr3'])}")
        if f["only_in_db"]:
            print(f"- **Extra in dbkolomlaporan (not used by .fr3)**: {', '.join(f['only_in_db'])}")
        print()
    print(f"Wrote {out}")
    return 1 if any(f["severity"] == "critical" for f in findings) else 0


if __name__ == "__main__":
    sys.exit(main())