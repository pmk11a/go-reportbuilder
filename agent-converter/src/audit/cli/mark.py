"""
mark / mark-many subcommands — update item status in a manifest.
"""

import sys
import yaml

from ..tracker import MigrationTracker, STATUS_EMOJI, VALID_STATUSES


def cmd_mark(args):
    """Update status of a single item."""
    manifest_fp = _find_manifest(args.module, args.status_dir)
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


def cmd_mark_many(args):
    """
    Batch update from a YAML file.

    YAML format::

      - id: PROC-001
        status: done
        laravel_target: BarangController@store
        notes: ""
      - id: SQL-003
        status: skip
        notes: "Eloquent handles this"
    """
    manifest_fp = _find_manifest(args.module, args.status_dir)

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
#  Local helper (avoids circular import with helpers.py)
# ---------------------------------------------------------------------------

def _find_manifest(module_name: str, status_dir: str) -> str:
    """Find manifest by exact name or case-insensitive search."""
    import os
    exact = os.path.join(status_dir, f"{module_name}.yaml")
    if os.path.exists(exact):
        return exact
    for fn in os.listdir(status_dir):
        if fn.lower() == f"{module_name.lower()}.yaml":
            return os.path.join(status_dir, fn)
    raise FileNotFoundError(
        f"No manifest for module '{module_name}' in {status_dir}\n"
        f"Run: python audit.py extract <path/to/{module_name}.pas>"
    )
