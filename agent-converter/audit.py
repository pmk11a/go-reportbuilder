#!/usr/bin/env python3
"""
audit.py — Migration Audit CLI
================================
Single entry point for the 3-layer Migration Audit System.

Commands
--------
  extract   Scan a .pas file and create/refresh its manifest YAML
  mark      Update status of one item in a manifest
  mark-many Batch update from a YAML file
  report    Generate global MIGRATION_DASHBOARD.md
  status    Show progress for one module (quick terminal summary)
  ls        List all modules with their progress %

Usage
-----
  python audit.py extract pwt/Master/Barang/FrmBarang.pas
  python audit.py extract pwt/Master/Barang/FrmBarang.pas --merge   # keep existing statuses

  python audit.py mark FrmBarang PROC-001 done --target BarangController@store
  python audit.py mark FrmBarang SQL-003 skip --notes "Handled by Eloquent"
  python audit.py mark FrmBarang PROC-002 partial --target BarangController@update

  python audit.py status FrmBarang
  python audit.py ls
  python audit.py report
"""

import sys
import os
from pathlib import Path

# ── path setup ──────────────────────────────────────────────────────────────
_SCRIPT_DIR = Path(__file__).resolve().parent          # agent-converter/
_SRC_DIR = _SCRIPT_DIR / "src"
if str(_SRC_DIR) not in sys.path:
    sys.path.insert(0, str(_SRC_DIR))

from audit.cli.parser import build_parser, main

if __name__ == "__main__":
    main()
