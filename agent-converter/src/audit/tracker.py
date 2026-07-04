"""
Tracker — Layer 2 of Migration Audit System.

Updates migration status on items inside a YAML manifest file.

Usage (programmatic):
    tracker = MigrationTracker("migration-status/FrmBarang.yaml")
    tracker.mark("PROC-001", status="done", laravel_target="BarangController@store")
    tracker.mark("SQL-003", status="skip", notes="handled by Eloquent model")
    tracker.save()

Status values:
    pending  — not started (default after extract)
    done     — fully implemented in Laravel
    partial  — partially implemented, needs more work
    skip     — intentionally not migrated (document why in notes)
    na       — not applicable (UI-only delphi artifact, no backend needed)
"""

import os
import sys
import yaml
from datetime import datetime
from pathlib import Path

_HERE = Path(__file__).resolve().parent.parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

VALID_STATUSES = {"pending", "done", "partial", "skip", "na"}

# Status display for reporter
STATUS_EMOJI = {
    "pending": "[ ]",
    "done":    "[x]",
    "partial": "[~]",
    "skip":    "[-]",
    "na":      "[n]",
}


class MigrationTracker:
    """Read/write migration status for a single module manifest."""

    def __init__(self, manifest_path: str):
        self.manifest_path = os.path.abspath(manifest_path)
        self._manifest = None
        self._dirty = False

    def load(self) -> dict:
        if self._manifest is not None:
            return self._manifest
        if not os.path.exists(self.manifest_path):
            raise FileNotFoundError(
                f"Manifest not found: {self.manifest_path}\n"
                f"Run: python audit.py extract <pas_file> first."
            )
        with open(self.manifest_path, encoding="utf-8") as f:
            self._manifest = yaml.safe_load(f)
        return self._manifest

    def save(self):
        """Write manifest back to YAML, updating summary counts."""
        if self._manifest is None:
            return
        self._update_summary()
        from audit.extractor import manifest_to_yaml
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            f.write(manifest_to_yaml(self._manifest))
        self._dirty = False

    def mark(
        self,
        item_id: str,
        *,
        status: str,
        laravel_target: str = None,
        notes: str = None,
    ) -> dict:
        """
        Update status (and optionally laravel_target/notes) for an item.

        Returns the updated item dict.
        Raises ValueError if item_id not found or status invalid.
        """
        if status not in VALID_STATUSES:
            raise ValueError(
                f"Invalid status '{status}'. Valid: {sorted(VALID_STATUSES)}"
            )

        manifest = self.load()
        item = self._find_item(manifest, item_id)
        if item is None:
            raise ValueError(
                f"Item '{item_id}' not found in {self.manifest_path}"
            )

        item["status"] = status
        if laravel_target is not None:
            item["laravel_target"] = laravel_target
        if notes is not None:
            item["notes"] = notes
        item["updated_at"] = datetime.now().isoformat(timespec="seconds")

        self._dirty = True
        return item

    def mark_many(self, updates: list[dict]):
        """
        Batch update. Each dict must have 'id' and 'status'.
        Optional: 'laravel_target', 'notes'.
        """
        for u in updates:
            self.mark(
                u["id"],
                status=u["status"],
                laravel_target=u.get("laravel_target"),
                notes=u.get("notes"),
            )

    def get_item(self, item_id: str) -> dict | None:
        manifest = self.load()
        return self._find_item(manifest, item_id)

    def list_by_status(self, status: str) -> list[dict]:
        manifest = self.load()
        return [i for i in manifest.get("items", []) if i["status"] == status]

    def list_pending(self) -> list[dict]:
        return self.list_by_status("pending")

    def get_progress(self) -> dict:
        """Return progress statistics for this module."""
        manifest = self.load()
        items = manifest.get("items", [])
        total = len(items)
        by_status = {}
        for s in VALID_STATUSES:
            by_status[s] = sum(1 for i in items if i["status"] == s)

        done_count = by_status["done"] + by_status["skip"] + by_status["na"]
        pct = round(done_count / total * 100, 1) if total > 0 else 0.0

        # per-type breakdown
        types = sorted(set(i["type"] for i in items))
        by_type = {}
        for t in types:
            t_items = [i for i in items if i["type"] == t]
            t_done = sum(
                1 for i in t_items
                if i["status"] in ("done", "skip", "na")
            )
            by_type[t] = {
                "total": len(t_items),
                "done": t_done,
                "pending": sum(1 for i in t_items if i["status"] == "pending"),
                "partial": sum(1 for i in t_items if i["status"] == "partial"),
            }

        return {
            "module": manifest.get("module", "?"),
            "total": total,
            "by_status": by_status,
            "by_type": by_type,
            "done_count": done_count,
            "pct_complete": pct,
        }

    # ── internals ──────────────────────────────────────────────────────────

    def _find_item(self, manifest: dict, item_id: str) -> dict | None:
        for item in manifest.get("items", []):
            if item.get("id") == item_id:
                return item
        return None

    def _update_summary(self):
        items = self._manifest.get("items", [])
        type_order = ["PROC", "SQL", "FIELD", "TABLE", "GLOBAL", "REPORT"]
        self._manifest["summary"] = {
            "total": len(items),
            "by_type": {
                t: sum(1 for i in items if i["type"] == t)
                for t in type_order
            },
            "by_status": {
                s: sum(1 for i in items if i["status"] == s)
                for s in VALID_STATUSES
            },
        }
        self._manifest["last_updated"] = datetime.now().isoformat(
            timespec="seconds"
        )
