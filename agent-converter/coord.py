#!/usr/bin/env python3
"""
coord.py — Multi-Agent Coordination Helper
===========================================
CLI untuk mengelola task board, claim task, update status,
dan generate laporan di .shared/

Usage:
  python coord.py tasks              # Lihat semua task
  python coord.py claim [TASK_ID]    # Claim task (auto-detect agent)
  python coord.py done [TASK_ID]     # Tandai selesai
  python coord.py blocked [TASK_ID]  # Tandai blocked + alasan
  python coord.py status             # Ringkasan progress
  python coord.py delegate T-001 claude  # Delegasikan task ke Claude/Hermes
  python coord.py context            # Update CONTEXT.md timestamp
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SHARED_DIR = Path(__file__).resolve().parent.parent / ".shared"
TASKS_PATH = SHARED_DIR / "tasks.json"
CONTEXT_PATH = SHARED_DIR / "CONTEXT.md"


def load_tasks():
    with open(TASKS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_tasks(data):
    with open(TASKS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[coord] tasks.json updated")


def _task_label(t):
    """Get display label; handles both 'title' and 'task' keys."""
    return t.get('title') or t.get('task', '???')


def cmd_tasks():
    data = load_tasks()
    tasks = data.get("tasks", [])
    print(f"\n{'='*60}")
    print(f"  Task Board — {data.get('project','')}")
    print(f"  Updated: {data.get('updated_at','')}")
    print(f"{'='*60}")
    for t in tasks:
        st = t.get("status", "pending")
        icon = {"done": "[x]", "in_progress": "[~]", "blocked": "[!]", "running": "[~]", "pending": "[ ]", "todo": "[ ]"}.get(st, "[?]")
        agent = t.get("assigned_to")
        if agent is None:
            agent = t.get("tool", "—")
        deps = ", ".join(t.get("depends_on", [])) or "—"
        print(f"  {icon} {t['id']}: {_task_label(t)}")
        print(f"      agent={agent} | deps=[{deps}] | status={st}")
    print()


def cmd_claim(task_id):
    data = load_tasks()
    for t in data["tasks"]:
        if t["id"] == task_id:
            if t["status"] in ("done", "blocked"):
                print(f"[coord] ERROR: {task_id} sudah {t['status']}")
                return
            if t.get("assigned_to"):
                print(f"[coord] WARN: {task_id} sudah di-claim oleh {t['assigned_to']}")
            t["assigned_to"] = "pi"  # default, bisa di-override
            t["status"] = "in_progress"
            t["updated_at"] = datetime.now(timezone.utc).isoformat()
            save_tasks(data)
            print(f"[coord] {task_id} claimed. Status: in_progress")
            return
    print(f"[coord] ERROR: {task_id} tidak ditemukan")


def cmd_done(task_id):
    data = load_tasks()
    for t in data["tasks"]:
        if t["id"] == task_id:
            t["status"] = "done"
            t["updated_at"] = datetime.now(timezone.utc).isoformat()
            save_tasks(data)
            print(f"[coord] {task_id} marked DONE")
            return
    print(f"[coord] ERROR: {task_id} tidak ditemukan")


def cmd_blocked(task_id, reason=""):
    data = load_tasks()
    for t in data["tasks"]:
        if t["id"] == task_id:
            t["status"] = "blocked"
            t["notes"] = f"BLOCKED: {reason}" if reason else "BLOCKED"
            t["updated_at"] = datetime.now(timezone.utc).isoformat()
            save_tasks(data)
            print(f"[coord] {task_id} marked BLOCKED")
            return
    print(f"[coord] ERROR: {task_id} tidak ditemukan")


def cmd_status():
    data = load_tasks()
    tasks = data.get("tasks", [])
    done = sum(1 for t in tasks if t["status"] == "done")
    in_prog = sum(1 for t in tasks if t["status"] == "in_progress")
    blocked = sum(1 for t in tasks if t["status"] == "blocked")
    pending = len(tasks) - done - in_prog - blocked
    print(f"\n  Total: {len(tasks)} | Done: {done} | In Progress: {in_prog} | Blocked: {blocked} | Pending: {pending}\n")


def cmd_delegate(task_id, agent):
    """Generate delegation file for Claude/Hermes and update task status."""
    if not task_id:
        print("[coord] ERROR: Task ID required")
        return
    if agent not in ("claude", "hermes"):
        print(f"[coord] ERROR: Agent must be 'claude' or 'hermes', got '{agent}'")
        return

    data = load_tasks()
    task = None
    for t in data["tasks"]:
        if t["id"] == task_id:
            task = t
            break
    if not task:
        print(f"[coord] ERROR: {task_id} tidak ditemukan")
        return

    # Generate delegation file
    results_dir = SHARED_DIR / "results"
    results_dir.mkdir(parents=True, exist_ok=True)
    delegate_file = results_dir / f"delegate-{task_id}.md"

    with open(delegate_file, "w", encoding="utf-8") as f:
        f.write(f"# Delegation: {task_id}\n\n")
        f.write(f"## Task\n{_task_label(task)}\n\n")
        f.write(f"## Status\n{task.get('status', '')}\n\n")
        f.write(f"## Notes\n{task.get('notes', '')}\n\n")
        f.write(f"## Assigned To\n{agent}\n\n")
        if task.get('artifacts'):
            f.write(f"## Artifacts\n")
            for a in task['artifacts']:
                f.write(f"- {a}\n")
            f.write("\n")
        if task.get('depends_on'):
            f.write(f"## Dependencies\n{', '.join(task['depends_on'])}\n\n")
        f.write(f"## Instructions\n")
        f.write(f"Read `.shared/CONTEXT.md` for project context.\n")
        f.write(f"Write results to `.shared/results/result-{task_id}.md` when done.\n")

    # Update task
    task["assigned_to"] = agent
    task["status"] = "in_progress"
    task["updated_at"] = datetime.now(timezone.utc).isoformat()
    save_tasks(data)

    print(f"[coord] Delegated {task_id} -> {agent}")
    print(f"[coord] Delegation file: {delegate_file}")
    print(f"[coord] Instruct {agent} to read: .shared/results/delegate-{task_id}.md")


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return

    cmd = args[0].lower()
    if cmd == "tasks":
        cmd_tasks()
    elif cmd == "claim":
        cmd_claim(args[1] if len(args) > 1 else "")
    elif cmd == "done":
        cmd_done(args[1] if len(args) > 1 else "")
    elif cmd == "blocked":
        cmd_blocked(args[1] if len(args) > 1 else "", " ".join(args[2:]) if len(args) > 2 else "")
    elif cmd == "status":
        cmd_status()
    elif cmd == "delegate":
        task_id = args[1] if len(args) > 1 else ""
        agent = args[2] if len(args) > 2 else ""
        cmd_delegate(task_id, agent)
    elif cmd == "context":
        print("[coord] CONTEXT.md di-update manual via write")
    else:
        print(f"[coord] Unknown command: {cmd}")


if __name__ == "__main__":
    main()
