"""
Shared helpers used by the CLI subcommands.

- _manifest_path     : build the YAML path for a module
- _find_manifest     : locate a manifest by name (case-insensitive fallback)
- _carry_over_statuses: merge statuses from an existing manifest into a fresh one
"""

import os
import yaml
from pathlib import Path

# ── defaults ────────────────────────────────────────────────────────────────
_SCRIPT_DIR = Path(__file__).resolve().parent.parent.parent.parent  # agent-converter/
DEFAULT_STATUS_DIR = str(_SCRIPT_DIR / "migration-status")
DEFAULT_DASHBOARD  = str(_SCRIPT_DIR / "MIGRATION_DASHBOARD.md")


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


def _carry_over_statuses(new_items: list[dict], existing_path: str) -> None:
    """Carry over status / laravel_target / notes from an existing manifest.

    Items are matched by ``(type, name)`` so the operation is stable even
    when IDs shift between re-scans.
    """
    with open(existing_path, encoding="utf-8") as fh:
        old = yaml.safe_load(fh)
    if not old or "items" not in old:
        return
    old_by_key = {(i["type"], i["name"]): i for i in old["items"]}
    for item in new_items:
        key = (item["type"], item["name"])
        if key in old_by_key:
            oi = old_by_key[key]
            item["status"]         = oi.get("status", "pending")
            item["laravel_target"] = oi.get("laravel_target", "")
            item["notes"]          = oi.get("notes", "")
            if "updated_at" in oi:
                item["updated_at"] = oi["updated_at"]
