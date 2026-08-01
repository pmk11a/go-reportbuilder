"""
extract / extract-all subcommands.

- extract       : scan a single .pas file and produce a manifest YAML
- extract-all   : walk a Delphi project directory and extract all form files
"""

import os
import sys

from ..extractor import DelphiExtractor, save_manifest
from ..helpers import _manifest_path, _carry_over_statuses


def cmd_extract(args):
    """Extract migration items from a single .pas file."""
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
        _carry_over_statuses(manifest["items"], output_path)

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
#  extract-all (scan entire project)
# ---------------------------------------------------------------------------

# Files that are part of the framework, not business modules — skip these.
_SKIP_FILENAMES = {
    "FrmUtama.pas", "FrmLogin.pas", "FrmPaswd.pas",
    "FrmBrows.pas", "FrmBrows2.pas", "FrmMenuReport.pas",
    "FrmReportPreview.pas", "FrmKonfigurasi.pas", "FrmUpdate.pas",
}
# Directories that should never be walked.
_SKIP_DIRS = {
    "node_modules", ".git", "venv", "__pycache__", "backup",
    "bin", "obj", "Win32", "Win64", ".vs", "Old", "OLD",
    "BackUp", "Backup",
}


def _discover_pas_files(project_dir: str) -> list[str]:
    """Walk ``project_dir`` and return a sorted list of *.pas form paths."""
    pas_files: list[str] = []
    for dirpath, dirnames, filenames in os.walk(project_dir):
        # Prune in-place so os.walk doesn't descend into skip dirs.
        dirnames[:] = [
            d for d in dirnames
            if d not in _SKIP_DIRS
            and not any(s.lower() in d.lower() for s in ("backup", "old"))
        ]
        for fn in sorted(filenames):
            if not fn.lower().endswith(".pas"):
                continue
            if fn in _SKIP_FILENAMES:
                continue
            pas_files.append(os.path.join(dirpath, fn))
    return sorted(pas_files)


def cmd_extract_all(args):
    """
    Walk a Delphi project directory and extract all .pas form files.
    Skips DM/Util/unknown files (those don't have migration items).
    """
    project_dir = os.path.abspath(args.project_dir)
    status_dir = args.status_dir
    merge = args.merge

    pas_files = _discover_pas_files(project_dir)
    print(f"[extract-all] Found {len(pas_files)} .pas files in {project_dir}")
    print(f"[extract-all] status-dir: {status_dir}  merge={merge}")
    print()

    # Imported lazily so this module loads even when the scanners package
    # isn't deployed (e.g. extract-only CI runs).
    try:
        from scanners.delphi_project_scanner import categorize_file
    except ImportError:
        _src = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        if _src not in sys.path:
            sys.path.insert(0, _src)
        from scanners.delphi_project_scanner import categorize_file  # type: ignore

    extractor = DelphiExtractor()
    ok = skipped = errors = 0

    for i, fp in enumerate(pas_files, 1):
        try:
            with open(fp, encoding="utf-8", errors="replace") as f:
                content = f.read()
            ftype = categorize_file(fp, content)
            # Only extract form files — they carry the migration items
            if ftype not in ("form",) and not args.all_types:
                skipped += 1
                continue

            manifest = extractor.extract(fp)
            module = manifest["module"]
            out_path = _manifest_path(module, status_dir)

            if merge and os.path.exists(out_path):
                _carry_over_statuses(manifest["items"], out_path)

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
