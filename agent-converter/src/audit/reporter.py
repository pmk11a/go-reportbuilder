"""
Reporter — Layer 3 of Migration Audit System.

Reads ALL manifest YAML files in the migration-status/ directory and
produces a global dashboard: MIGRATION_DASHBOARD.md

Shows:
  - Overall % complete
  - Per-module progress bar
  - Items still pending (broken down by type)
  - Partial items (started but incomplete)
  - Tables that are referenced but have no done PROC yet

Run:
    python audit.py report [--output-dir migration-status]
"""

import os
import sys
import glob
import yaml
from datetime import datetime
from pathlib import Path

_HERE = Path(__file__).resolve().parent.parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from audit.tracker import VALID_STATUSES, STATUS_EMOJI


# ---------------------------------------------------------------------------
#  Report builder
# ---------------------------------------------------------------------------

def _progress_bar(pct: float, width: int = 20) -> str:
    filled = int(pct / 100 * width)
    bar = "#" * filled + "-" * (width - filled)
    return f"[{bar}] {pct:.0f}%"


def _load_manifests(status_dir: str) -> list[dict]:
    pattern = os.path.join(status_dir, "**", "*.yaml")
    files = glob.glob(pattern, recursive=True)
    manifests = []
    for fp in sorted(files):
        try:
            with open(fp, encoding="utf-8") as f:
                m = yaml.safe_load(f)
            if m and "items" in m:
                m["_filepath"] = fp
                manifests.append(m)
        except Exception as e:
            print(f"[reporter] WARN: cannot read {fp}: {e}")
    return manifests


def _compute_global_stats(manifests: list[dict]) -> dict:
    total_items = 0
    total_done = 0
    by_type_global = {}
    by_status_global = {s: 0 for s in VALID_STATUSES}

    for m in manifests:
        items = m.get("items", [])
        total_items += len(items)
        for item in items:
            s = item.get("status", "pending")
            by_status_global[s] = by_status_global.get(s, 0) + 1
            if s in ("done", "skip", "na"):
                total_done += 1
            t = item.get("type", "?")
            if t not in by_type_global:
                by_type_global[t] = {"total": 0, "done": 0, "pending": 0, "partial": 0}
            by_type_global[t]["total"] += 1
            if s in ("done", "skip", "na"):
                by_type_global[t]["done"] += 1
            elif s == "partial":
                by_type_global[t]["partial"] += 1
            elif s == "pending":
                by_type_global[t]["pending"] += 1

    pct = round(total_done / total_items * 100, 1) if total_items > 0 else 0.0
    return {
        "total_modules": len(manifests),
        "total_items": total_items,
        "total_done": total_done,
        "pct_complete": pct,
        "by_status": by_status_global,
        "by_type": by_type_global,
    }


def _module_progress(manifest: dict) -> dict:
    items = manifest.get("items", [])
    total = len(items)
    done = sum(1 for i in items if i.get("status") in ("done", "skip", "na"))
    partial = sum(1 for i in items if i.get("status") == "partial")
    pending = sum(1 for i in items if i.get("status") == "pending")
    pct = round(done / total * 100, 1) if total > 0 else 0.0
    return {
        "module": manifest.get("module", "?"),
        "source_file": manifest.get("source_file", ""),
        "filepath": manifest.get("_filepath", ""),
        "total": total,
        "done": done,
        "partial": partial,
        "pending": pending,
        "pct": pct,
    }


# ---------------------------------------------------------------------------
#  Markdown generation
# ---------------------------------------------------------------------------

def generate_dashboard(status_dir: str, output_path: str):
    """
    Read all manifests from status_dir and write MIGRATION_DASHBOARD.md
    to output_path.
    """
    manifests = _load_manifests(status_dir)
    if not manifests:
        print(f"[reporter] No manifest YAML files found in: {status_dir}")
        return

    gs = _compute_global_stats(manifests)
    module_progresses = sorted(
        [_module_progress(m) for m in manifests],
        key=lambda x: x["pct"],  # sort ascending: least done first
    )

    lines = []
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    # ── Header ────────────────────────────────────────────────────────────
    lines += [
        "# 🗺️ Migration Dashboard",
        "",
        f"> Generated: {now}  |  Source: `{status_dir}`",
        "",
    ]

    # ── Overall progress ──────────────────────────────────────────────────
    lines += [
        "## Overall Progress",
        "",
        f"**{gs['pct_complete']}%** complete  "
        f"({gs['total_done']} / {gs['total_items']} items across "
        f"{gs['total_modules']} modules)",
        "",
        f"`{_progress_bar(gs['pct_complete'], 40)}`",
        "",
    ]

    # Status breakdown
    lines += [
        "| Status | Count |",
        "|--------|------:|",
    ]
    for s in VALID_STATUSES:
        emoji = STATUS_EMOJI.get(s, s)
        lines.append(f"| {emoji} {s} | {gs['by_status'].get(s, 0)} |")
    lines.append("")

    # Type breakdown
    lines += [
        "### By Item Type",
        "",
        "| Type | Total | Done | Partial | Pending | % Done |",
        "|------|------:|-----:|--------:|--------:|-------:|",
    ]
    type_order = ["PROC", "SQL", "FIELD", "TABLE", "GLOBAL", "REPORT"]
    for t in type_order:
        if t not in gs["by_type"]:
            continue
        td = gs["by_type"][t]
        pct_t = round(td["done"] / td["total"] * 100, 0) if td["total"] else 0
        lines.append(
            f"| {t} | {td['total']} | {td['done']} | {td['partial']} | {td['pending']} | {pct_t:.0f}% |"
        )
    lines.append("")

    # ── Per-module table ──────────────────────────────────────────────────
    lines += [
        "## Module Progress",
        "",
        "Sorted by completion (least done first — work from top).",
        "",
        "| Module | Progress | Done | Partial | Pending | Total |",
        "|--------|----------|-----:|--------:|--------:|------:|",
    ]
    for mp in module_progresses:
        bar = _progress_bar(mp["pct"], 15)
        lines.append(
            f"| `{mp['module']}` | `{bar}` | "
            f"{mp['done']} | {mp['partial']} | {mp['pending']} | {mp['total']} |"
        )
    lines.append("")

    # ── Modules with pending items — detail ───────────────────────────────
    lines += [
        "## Pending Items by Module",
        "",
        "Items still `pending` — action required.",
        "",
    ]

    for manifest in manifests:
        pending = [i for i in manifest.get("items", []) if i.get("status") == "pending"]
        partial = [i for i in manifest.get("items", []) if i.get("status") == "partial"]
        if not pending and not partial:
            continue

        module = manifest.get("module", "?")
        mp = _module_progress(manifest)
        lines += [
            f"### `{module}` — {mp['pct']}% done",
            "",
            f"Source: `{manifest.get('source_file', '')}` | "
            f"Manifest: `{manifest.get('_filepath', '')}`",
            "",
        ]

        if partial:
            lines += [
                "**[~] Partial (needs completion):**",
                "",
                "| ID | Type | Name | Laravel Target | Notes |",
                "|----|------|------|---------------|-------|",
            ]
            for item in partial:
                lt = item.get("laravel_target", "") or ""
                notes = item.get("notes", "") or ""
                lines.append(
                    f"| `{item['id']}` | {item['type']} | `{item['name']}` | "
                    f"{lt} | {notes} |"
                )
            lines.append("")

        if pending:
            # Group pending by type
            by_type: dict[str, list] = {}
            for item in pending:
                t = item.get("type", "?")
                by_type.setdefault(t, []).append(item)

            for t in type_order:
                if t not in by_type:
                    continue
                t_items = by_type[t]
                lines += [
                    f"**[ ] Pending {t} ({len(t_items)}):**",
                    "",
                    "| ID | Name | Description |",
                    "|----|------|-------------|",
                ]
                for item in t_items:
                    desc = item.get("description", "")[:80]
                    lines.append(
                        f"| `{item['id']}` | `{item['name']}` | {desc} |"
                    )
                lines.append("")

    # ── Modules 100% done ─────────────────────────────────────────────────
    completed = [mp for mp in module_progresses if mp["pct"] == 100.0]
    if completed:
        lines += [
            "## [x] Completed Modules",
            "",
            "| Module | Total Items |",
            "|--------|------------:|",
        ]
        for mp in completed:
            lines.append(f"| `{mp['module']}` | {mp['total']} |")
        lines.append("")

    # ── Footer ────────────────────────────────────────────────────────────
    lines += [
        "---",
        "",
        "### How to update status",
        "",
        "```bash",
        "# Mark one item done",
        "python audit.py mark FrmBarang PROC-001 done --target BarangController@store",
        "",
        "# Mark skip (not needed in Laravel)",
        "python audit.py mark FrmBarang SQL-003 skip --notes 'Handled by Eloquent'",
        "",
        "# Batch mark from file",
        "python audit.py batch-mark FrmBarang updates.yaml",
        "",
        "# Regenerate this dashboard",
        "python audit.py report",
        "```",
        "",
    ]

    content = "\n".join(lines)
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[reporter] Dashboard written: {output_path}")
    print(f"[reporter] {gs['total_modules']} modules | "
          f"{gs['total_items']} items | "
          f"{gs['pct_complete']}% complete")
