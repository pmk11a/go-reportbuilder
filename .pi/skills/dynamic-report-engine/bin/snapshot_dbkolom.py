#!/usr/bin/env python3
"""
snapshot_dbkolom.py — dump dbkolomlaporan + dbmasterlaporan from SQL Server
into a JSON snapshot for validate_match.py offline audit.

Usage:
    python snapshot_dbkolom.py --env be-fitur/.env

Requirements:
    pip install pyodbc  (or use pymssql / your DB driver)
    ODBC driver for SQL Server installed.
"""

from __future__ import annotations
import argparse
import json
import os
import sys
from pathlib import Path

# Lazy import so the script doesn't hard-fail if pyodbc is not installed.
try:
    import pyodbc
    HAS_PYODBC = True
except ImportError:
    HAS_PYODBC = False


def get_connection(env_path: Path) -> pyodbc.Connection:
    if not HAS_PYODBC:
        sys.exit("ERROR: pyodbc not installed. Run: pip install pyodbc")
    if not env_path.exists():
        sys.exit(f"ERROR: .env not found at {env_path}")
    env = {}
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    required = ["DB_CONNECTION", "DB_HOST", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD"]
    missing = [k for k in required if k not in env]
    if missing:
        sys.exit(f"ERROR: missing in .env: {missing}")
    driver = "ODBC Driver 18 for SQL Server"
    conn_str = (
        f"DRIVER={{{driver}}};"
        f"SERVER={env['DB_HOST']};"
        f"DATABASE={env['DB_DATABASE']};"
        f"UID={env['DB_USERNAME']};"
        f"PWD={env['DB_PASSWORD']};"
        f"TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str, timeout=30)


def fetch_kolom(conn: pyodbc.Connection) -> list[dict]:
    sql = """
    SELECT
        dm.KODEMENU,
        dk.nama_dataset,
        dk.nama_kolom,
        dk.label_tampil,
        dk.format_type,
        dk.alignment,
        dk.is_summable,
        dk.is_visible,
        dk.urutan_tampil
    FROM dbkolomlaporan dk
    JOIN dbmasterlaporan dm ON dk.id_laporan = dm.id_laporan
    ORDER BY dm.KODEMENU, dk.nama_dataset, dk.urutan_tampil;
    """
    rows = []
    with conn.cursor() as cur:
        for row in cur.execute(sql):
            rows.append({
                "kode_menu": str(row[0]).lstrip("0") or "0",
                "nama_dataset": row[1],
                "nama_kolom": row[2],
                "label_tampil": row[3],
                "format_type": row[4],
                "alignment": row[5],
                "is_summable": bool(row[6]),
                "is_visible": bool(row[7]),
                "urutan_tampil": row[8],
            })
    return rows


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--env", default="D:/TestLaB/Fitur/be-fitur/.env")
    p.add_argument("--out",
                   default="D:/TestLaB/piagent/.claude/extractedReports/dbkolomlaporan.json")
    args = p.parse_args()

    out = Path(args.out)
    env = Path(args.env)
    print(f"Connecting to {env}...")
    try:
        conn = get_connection(env)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    print("Fetching dbkolomlaporan...")
    rows = fetch_kolom(conn)
    conn.close()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Done. {len(rows)} rows -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
