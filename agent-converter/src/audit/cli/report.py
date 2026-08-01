"""
status / ls / report subcommands — read-only reporting.
"""

import os
import yaml

from ..tracker import MigrationTracker, STATUS_EMOJI, VALID_STATUSES
from ..reporter import generate_dashboard


# ---------------------------------------------------------------------------
#  status
# ---------------------------------------------------------------------------

def cmd_status(args):
    """Show progress for one module (quick terminal summary)."""
    manifest_fp = _find_manifest(args.module, args.status_dir)
    tracker = MigrationTracker(manifest_fp)
    prog = tracker.get_progress()

    from ..reporter import _progress_bar
    bar = _progress_bar(prog["pct_complete"], 30)

    print(f"\n{'='*60}")
    print(f"  Module: {prog['module']}")
    print(f"  {bar}")
    print(f"  {prog['done_count']} / {prog['total']} items resolved"
          .encode('ascii', 'replace').decode())
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
    """List all modules with their progress %."""
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

    from ..reporter import _progress_bar

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
    """Generate the global MIGRATION_DASHBOARD.md."""
    generate_dashboard(args.status_dir, args.output)


# ---------------------------------------------------------------------------
#  Local helper
# ---------------------------------------------------------------------------

def _find_manifest(module_name: str, status_dir: str) -> str:
    """Find manifest by exact name or case-insensitive search."""
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
