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

import argparse
import os
import sys
import yaml
from pathlib import Path

# ── path setup ──────────────────────────────────────────────────────────────
_SCRIPT_DIR = Path(__file__).resolve().parent          # agent-converter/
_SRC_DIR = _SCRIPT_DIR / "src"
if str(_SRC_DIR) not in sys.path:
    sys.path.insert(0, str(_SRC_DIR))

from audit.extractor import DelphiExtractor, save_manifest
from audit.tracker import MigrationTracker, STATUS_EMOJI, VALID_STATUSES
from audit.reporter import generate_dashboard

# ── defaults ────────────────────────────────────────────────────────────────
DEFAULT_STATUS_DIR = str(_SCRIPT_DIR / "migration-status")
DEFAULT_DASHBOARD  = str(_SCRIPT_DIR / "MIGRATION_DASHBOARD.md")


# ---------------------------------------------------------------------------
#  Helpers
# ---------------------------------------------------------------------------

def _manifest_path(module_name: str, status_dir: str) -> str:
    return os.path.join(status_dir, f"{module_name}.yaml")


def _find_manifest(module_name: str, status_dir: str) -> str:
    """Find manifest by exact name or case-insensitive search."""
    exact = _manifest_path(module_name, status_dir)
    if os.path.exists(exact):
        return exact
    # case-insensitive fallback
    for fn in os.listdir(status_dir):
        if fn.lower() == f"{module_name.lower()}.yaml":
            return os.path.join(status_dir, fn)
    raise FileNotFoundError(
        f"No manifest for module '{module_name}' in {status_dir}\n"
        f"Run: python audit.py extract <path/to/{module_name}.pas>"
    )


# ---------------------------------------------------------------------------
#  extract
# ---------------------------------------------------------------------------

def cmd_extract(args):
    pas_path = os.path.abspath(args.pas_file)
    status_dir = args.status_dir

    extractor = DelphiExtractor()
    print(f"[extract] Scanning: {pas_path}")
    manifest = extractor.extract(pas_path)
    module = manifest["module"]

    output_path = _manifest_path(module, status_dir)

    # --merge: preserve statuses of existing items
    if args.merge and os.path.exists(output_path):
        print(f"[extract] --merge: preserving existing statuses from {output_path}")
        with open(output_path, encoding="utf-8") as f:
            old = yaml.safe_load(f)
        old_by_id = {i["id"]: i for i in old.get("items", [])}
        # Match by (type, name) for stability even if IDs shifted
        old_by_key = {
            (i["type"], i["name"]): i for i in old.get("items", [])
        }
        for item in manifest["items"]:
            key = (item["type"], item["name"])
            if key in old_by_key:
                old_item = old_by_key[key]
                item["status"]         = old_item.get("status", "pending")
                item["laravel_target"] = old_item.get("laravel_target", "")
                item["notes"]          = old_item.get("notes", "")
                if "updated_at" in old_item:
                    item["updated_at"] = old_item["updated_at"]

    os.makedirs(status_dir, exist_ok=True)
    save_manifest(manifest, output_path)

    s = manifest["summary"]
    print(f"[extract] OK {module}: {s['total']} items extracted -> {output_path}")
    print(f"          PROC={s['by_type'].get('PROC',0)}  "
          f"SQL={s['by_type'].get('SQL',0)}  "
          f"FIELD={s['by_type'].get('FIELD',0)}  "
          f"TABLE={s['by_type'].get('TABLE',0)}  "
          f"GLOBAL={s['by_type'].get('GLOBAL',0)}  "
          f"REPORT={s['by_type'].get('REPORT',0)}")
    if manifest["warnings"]:
        for w in manifest["warnings"]:
            print(f"  WARN: {w}")
    if manifest["errors"]:
        for e in manifest["errors"]:
            print(f"  ERR: {e}")


# ---------------------------------------------------------------------------
#  mark
# ---------------------------------------------------------------------------

def cmd_mark(args):
    status_dir = args.status_dir
    manifest_fp = _find_manifest(args.module, status_dir)
    tracker = MigrationTracker(manifest_fp)

    item = tracker.mark(
        args.item_id,
        status=args.status,
        laravel_target=args.target,
        notes=args.notes,
    )
    tracker.save()

    emoji = STATUS_EMOJI.get(args.status, "")
    print(f"[mark] {emoji} {args.module} / {args.item_id} -> {args.status}")
    if item.get("laravel_target"):
        print(f"       target: {item['laravel_target']}")
    if item.get("notes"):
        print(f"       notes:  {item['notes']}")


# ---------------------------------------------------------------------------
#  mark-many (batch from YAML file)
# ---------------------------------------------------------------------------

def cmd_mark_many(args):
    """
    Batch update from a YAML file.

    YAML format:
      - id: PROC-001
        status: done
        laravel_target: BarangController@store
        notes: ""
      - id: SQL-003
        status: skip
        notes: "Eloquent handles this"
    """
    status_dir = args.status_dir
    manifest_fp = _find_manifest(args.module, status_dir)

    with open(args.updates_file, encoding="utf-8") as f:
        updates = yaml.safe_load(f)

    if not isinstance(updates, list):
        print("[mark-many] ERROR: updates file must be a YAML list of dicts")
        sys.exit(1)

    tracker = MigrationTracker(manifest_fp)
    tracker.mark_many(updates)
    tracker.save()
    print(f"[mark-many] {len(updates)} items updated in {manifest_fp}")


# ---------------------------------------------------------------------------
#  status
# ---------------------------------------------------------------------------

def cmd_status(args):
    status_dir = args.status_dir
    manifest_fp = _find_manifest(args.module, status_dir)
    tracker = MigrationTracker(manifest_fp)
    prog = tracker.get_progress()

    from audit.reporter import _progress_bar
    bar = _progress_bar(prog["pct_complete"], 30)

    print(f"\n{'='*60}")
    print(f"  Module: {prog['module']}")
    print(f"  {bar}")
    print(f"  {prog['done_count']} / {prog['total']} items resolved".encode('ascii','replace').decode())
    print(f"{'='*60}")
    print(f"  {'Status':<10} {'Count':>6}")
    print(f"  {'-'*20}")
    for s in VALID_STATUSES:
        emoji = STATUS_EMOJI.get(s, "")
        count = prog["by_status"].get(s, 0)
        if count > 0:
            print(f"  {emoji} {s:<8} {count:>6}")
    print()
    print(f"  {'Type':<8} {'Total':>6} {'Done':>6} {'Partial':>8} {'Pending':>8}")
    print(f"  {'-'*40}")
    for t, td in prog["by_type"].items():
        print(f"  {t:<8} {td['total']:>6} {td['done']:>6} {td['partial']:>8} {td['pending']:>8}")
    print()

    # Show pending items
    pending = tracker.list_pending()
    if pending:
        print(f"  [ ] Pending items ({len(pending)}):")
        for item in pending[:30]:
            print(f"     {item['id']:<12} {item['type']:<7} {item['name']}")
        if len(pending) > 30:
            print(f"     ... and {len(pending)-30} more")
    print()


# ---------------------------------------------------------------------------
#  ls
# ---------------------------------------------------------------------------

def cmd_ls(args):
    status_dir = args.status_dir
    if not os.path.isdir(status_dir):
        print(f"[ls] No migration-status directory: {status_dir}")
        print(f"     Run extract on some .pas files first.")
        return

    files = sorted(
        f for f in os.listdir(status_dir) if f.endswith(".yaml")
    )
    if not files:
        print(f"[ls] No manifest files in {status_dir}")
        return

    from audit.reporter import _progress_bar

    print(f"\n{'Module':<30} {'Progress':<28} {'Done':>5} {'Pend':>5} {'Total':>6}")
    print(f"{'-'*30} {'-'*28} {'-'*5} {'-'*5} {'-'*6}")

    for fn in files:
        fp = os.path.join(status_dir, fn)
        try:
            with open(fp, encoding="utf-8") as f:
                m = yaml.safe_load(f)
        except Exception:
            continue
        if not m or "items" not in m:
            continue
        items = m["items"]
        total = len(items)
        done = sum(1 for i in items if i.get("status") in ("done", "skip", "na"))
        pend = sum(1 for i in items if i.get("status") == "pending")
        pct = round(done / total * 100, 1) if total else 0.0
        bar = _progress_bar(pct, 18)
        module = m.get("module", fn.replace(".yaml", ""))
        print(f"{module:<30} {bar:<28} {done:>5} {pend:>5} {total:>6}")
    print()


# ---------------------------------------------------------------------------
#  report
# ---------------------------------------------------------------------------

def cmd_report(args):
    generate_dashboard(args.status_dir, args.output)


# ---------------------------------------------------------------------------
#  extract-all (scan entire project)
# ---------------------------------------------------------------------------

def cmd_extract_all(args):
    """
    Walk a Delphi project directory and extract all .pas form files.
    Skips DM/Util/unknown files (those don't have migration items).
    """
    import glob
    from src.scanners.delphi_project_scanner import categorize_file

    project_dir = os.path.abspath(args.project_dir)
    status_dir  = args.status_dir
    merge       = args.merge

    skip_filenames = {
        "FrmUtama.pas", "FrmLogin.pas", "FrmPaswd.pas",
        "FrmBrows.pas", "FrmBrows2.pas", "FrmMenuReport.pas",
        "FrmReportPreview.pas", "FrmKonfigurasi.pas", "FrmUpdate.pas",
    }
    skip_dirs = {
        "node_modules", ".git", "venv", "__pycache__", "backup",
        "bin", "obj", "Win32", "Win64", ".vs", "Old", "OLD",
        "BackUp", "Backup",
    }

    pas_files = []
    for dirpath, dirnames, filenames in os.walk(project_dir):
        dirnames[:] = [d for d in dirnames if d not in skip_dirs
                       and not any(s.lower() in d.lower() for s in ("backup", "old"))]
        for fn in sorted(filenames):
            if not fn.lower().endswith(".pas"):
                continue
            if fn in skip_filenames:
                continue
            pas_files.append(os.path.join(dirpath, fn))

    print(f"[extract-all] Found {len(pas_files)} .pas files in {project_dir}")
    print(f"[extract-all] status-dir: {status_dir}  merge={merge}")
    print()

    extractor  = DelphiExtractor()
    ok = skipped = errors = 0

    for i, fp in enumerate(sorted(pas_files), 1):
        try:
            with open(fp, encoding="utf-8", errors="replace") as f:
                content = f.read()
            ftype = categorize_file(fp, content)
            # Only extract form files — they carry the migration items
            if ftype not in ("form",) and not args.all_types:
                skipped += 1
                continue

            manifest = extractor.extract(fp)
            module   = manifest["module"]
            out_path = _manifest_path(module, status_dir)

            if merge and os.path.exists(out_path):
                with open(out_path, encoding="utf-8") as f2:
                    old = yaml.safe_load(f2)
                old_by_key = {
                    (i2["type"], i2["name"]): i2
                    for i2 in old.get("items", [])
                }
                for item in manifest["items"]:
                    key = (item["type"], item["name"])
                    if key in old_by_key:
                        oi = old_by_key[key]
                        item["status"]         = oi.get("status", "pending")
                        item["laravel_target"] = oi.get("laravel_target", "")
                        item["notes"]          = oi.get("notes", "")
                        if "updated_at" in oi:
                            item["updated_at"] = oi["updated_at"]

            os.makedirs(status_dir, exist_ok=True)
            save_manifest(manifest, out_path)
            s = manifest["summary"]
            print(f"  [{i:>3}] {module:<35} {s['total']:>4} items "
                  f"(P={s['by_type'].get('PROC',0)} "
                  f"S={s['by_type'].get('SQL',0)} "
                  f"F={s['by_type'].get('FIELD',0)})")
            ok += 1

        except Exception as e:
            print(f"  [ERR] {fp}: {e}")
            errors += 1

    print()
    print(f"[extract-all] Done: {ok} extracted, {skipped} skipped (non-form), {errors} errors")
    print(f"[extract-all] Manifests in: {status_dir}")



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

    # extract-all
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

    # extract
    p_ext = sub.add_parser("extract", help="Scan .pas file and create manifest")
    p_ext.add_argument("pas_file", help="Path to .pas file")
    p_ext.add_argument(
        "--merge", action="store_true",
        help="Preserve existing statuses when manifest already exists",
    )
    p_ext.set_defaults(func=cmd_extract)

    # mark
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

    # mark-many
    p_mm = sub.add_parser("mark-many", help="Batch update from YAML file")
    p_mm.add_argument("module", help="Module name")
    p_mm.add_argument("updates_file", help="YAML file with list of {id, status, ...}")
    p_mm.set_defaults(func=cmd_mark_many)

    # status
    p_st = sub.add_parser("status", help="Show progress for one module")
    p_st.add_argument("module", help="Module name")
    p_st.set_defaults(func=cmd_status)

    # ls
    p_ls = sub.add_parser("ls", help="List all modules with progress")
    p_ls.set_defaults(func=cmd_ls)

    # report
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


if __name__ == "__main__":
    main()
