"""
Argument parser builder and CLI entry-point.

This module owns *only* the argparse machinery — no business logic.
"""

import argparse
import os
import sys

from ..helpers import DEFAULT_STATUS_DIR, DEFAULT_DASHBOARD
from ..tracker import VALID_STATUSES

# Subcommand functions live in sibling modules.
from .extract import cmd_extract, cmd_extract_all
from .mark import cmd_mark, cmd_mark_many
from .report import cmd_status, cmd_ls, cmd_report


def build_parser():
    parser = argparse.ArgumentParser(
        prog="audit.py",
        description="Migration Audit CLI — Delphi → Laravel",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--status-dir",
        default=DEFAULT_STATUS_DIR,
        help=f"Directory for manifest YAML files (default: {DEFAULT_STATUS_DIR})",
    )

    sub = parser.add_subparsers(dest="command", required=True)

    # ── extract-all ──────────────────────────────────────────────────────
    p_ea = sub.add_parser("extract-all", help="Scan entire Delphi project directory")
    p_ea.add_argument("project_dir", help="Root of Delphi project (e.g. pwt/)")
    p_ea.add_argument(
        "--merge", action="store_true",
        help="Preserve existing statuses (safe to re-run)",
    )
    p_ea.add_argument(
        "--all-types", action="store_true",
        help="Include DM/Util files too (default: forms only)",
    )
    p_ea.set_defaults(func=cmd_extract_all)

    # ── extract ──────────────────────────────────────────────────────────
    p_ext = sub.add_parser("extract", help="Scan .pas file and create manifest")
    p_ext.add_argument("pas_file", help="Path to .pas file")
    p_ext.add_argument(
        "--merge", action="store_true",
        help="Preserve existing statuses when manifest already exists",
    )
    p_ext.set_defaults(func=cmd_extract)

    # ── mark ──────────────────────���──────────────────────────────────────
    p_mark = sub.add_parser("mark", help="Update status of one item")
    p_mark.add_argument("module", help="Module name (e.g. FrmBarang)")
    p_mark.add_argument("item_id", help="Item ID (e.g. PROC-001)")
    p_mark.add_argument(
        "status", choices=sorted(VALID_STATUSES),
        help="New status",
    )
    p_mark.add_argument("--target", default=None, help="Laravel target (e.g. BarangController@store)")
    p_mark.add_argument("--notes", default=None, help="Free-text notes")
    p_mark.set_defaults(func=cmd_mark)

    # ── mark-many ────────────────────────────────────────────────────────
    p_mm = sub.add_parser("mark-many", help="Batch update from YAML file")
    p_mm.add_argument("module", help="Module name")
    p_mm.add_argument("updates_file", help="YAML file with list of {id, status, ...}")
    p_mm.set_defaults(func=cmd_mark_many)

    # ── status ───────────────────────────────────��───────────────────────
    p_st = sub.add_parser("status", help="Show progress for one module")
    p_st.add_argument("module", help="Module name")
    p_st.set_defaults(func=cmd_status)

    # ── ls ───────────────────────────────────────────────────────────────
    p_ls = sub.add_parser("ls", help="List all modules with progress")
    p_ls.set_defaults(func=cmd_ls)

    # ── report ───────────────────────────────────────────────────────────
    p_rp = sub.add_parser("report", help="Generate MIGRATION_DASHBOARD.md")
    p_rp.add_argument(
        "--output", default=DEFAULT_DASHBOARD,
        help=f"Output path (default: {DEFAULT_DASHBOARD})",
    )
    p_rp.set_defaults(func=cmd_report)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    os.makedirs(args.status_dir, exist_ok=True)
    args.func(args)
