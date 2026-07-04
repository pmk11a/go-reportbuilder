"""
Extractor — Layer 1 of Migration Audit System.

Scans a single .pas file and produces a structured YAML inventory of
ALL migration items that must be implemented in Laravel:

  - PROC   : procedures/event handlers (click, exit, change, lifecycle, custom)
  - SQL    : inline SQL strings found inside procedure bodies
  - FIELD  : dataset field declarations (QuXxx columns → must exist in Laravel)
  - TABLE  : DB table/view references
  - GLOBAL : global ERP variables accessed (IDUser, KodeGudang, etc.)
  - REPORT : report file / component references

Each item gets a stable ID: <TYPE>-<seq> (e.g. PROC-001, SQL-003).
IDs are deterministic (sorted) so re-running does not scramble them.

Output format (YAML):
  module: FrmBarang
  source_file: /path/to/FrmBarang.pas
  extracted_at: 2026-06-25T...
  items:
    - id: PROC-001
      type: PROC
      name: btnSimpanClick
      category: click_handler
      description: "Save button handler"
      laravel_target: ""       # filled by developer
      status: pending          # pending | done | partial | skip
      notes: ""
    ...
"""

import os
import re
import sys
import yaml
from datetime import datetime
from pathlib import Path

# ── make src importable when called from repo root ──────────────────────────
_HERE = Path(__file__).resolve().parent.parent  # agent-converter/src/
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from scanners.delphi_frm_scanner import DelphiFrmScanner
from scanners.delphi_proc_scanner import DelphiProcedureScanner


# ---------------------------------------------------------------------------
#  SQL extraction from raw .pas content
# ---------------------------------------------------------------------------

# Matches multi-line SQL.Add('...') / SQL.Strings[n] := '...' blocks
_SQL_ADD_RE = re.compile(
    r"\.SQL\.(?:Add|Strings\s*\[\s*\d+\s*\])\s*:=\s*'([^']+)'",
    re.IGNORECASE,
)
# Matches stored proc calls:  sp_xxx.ExecProc / sp_xxx.Open
_SP_EXEC_RE = re.compile(
    r"\b(sp_\w+|Sp_\w+)\s*\.\s*(ExecProc|Open|Execute)\b",
    re.IGNORECASE,
)
# Any identifier followed by .Open or .ExecProc that starts with known prefixes
_QUERY_OPEN_RE = re.compile(
    r"\b(Qu\w+|Q[A-Z]\w+)\s*\.\s*(Open|ExecProc|Execute|Close)\b",
)

def _extract_sql_snippets(content: str) -> list[dict]:
    """
    Extract SQL fragments from SQL.Add / SQL.Strings lines.
    Groups consecutive SQL.Add calls into one logical SQL block.
    """
    lines = content.splitlines()
    blocks = []
    current = []
    current_start = None

    for i, line in enumerate(lines, 1):
        m = _SQL_ADD_RE.search(line)
        if m:
            if current_start is None:
                current_start = i
            current.append(m.group(1).strip())
        else:
            if current:
                blocks.append({
                    "line": current_start,
                    "sql": " ".join(current),
                })
                current = []
                current_start = None

    if current:
        blocks.append({"line": current_start, "sql": " ".join(current)})

    return blocks


def _extract_stored_procs(content: str) -> list[dict]:
    """Extract stored procedure calls."""
    seen = set()
    result = []
    for m in _SP_EXEC_RE.finditer(content):
        name = m.group(1)
        if name not in seen:
            seen.add(name)
            result.append({"name": name, "call": m.group(2)})
    return result


def _extract_query_opens(content: str) -> list[dict]:
    """Extract query open/exec calls (non-stored-proc ADO queries)."""
    seen = set()
    result = []
    for m in _QUERY_OPEN_RE.finditer(content):
        name = m.group(1)
        if name not in seen:
            seen.add(name)
            result.append({"name": name, "op": m.group(2)})
    return result


# ---------------------------------------------------------------------------
#  Field extraction from QuView field declarations
# ---------------------------------------------------------------------------

_FIELD_DECL_RE = re.compile(
    r"^\s+((?:Qu|Q)[A-Za-z0-9_]+)([A-Z][A-Za-z0-9_]*)\s*:\s*(T\w+Field)\s*;",
    re.MULTILINE,
)


def _extract_fields(content: str) -> list[dict]:
    seen = set()
    result = []
    for m in _FIELD_DECL_RE.finditer(content):
        query_prefix = m.group(1)
        col_name = m.group(2)
        field_type = m.group(3)
        key = f"{query_prefix}.{col_name}"
        if key not in seen:
            seen.add(key)
            result.append({
                "query": query_prefix,
                "column": col_name,
                "delphi_type": field_type,
            })
    return result


# ---------------------------------------------------------------------------
#  Grid column extraction from .dfm
# ---------------------------------------------------------------------------

_DFM_COL_RE = re.compile(
    r"object\s+\w+\s*:\s*T\w*Column[^\n]*\n(?:[^\n]*\n)*?.*?FieldName\s*=\s*'(\w+)'",
    re.IGNORECASE,
)


def _extract_grid_columns_from_dfm(dfm_path: str) -> list[str]:
    if not os.path.exists(dfm_path):
        return []
    try:
        with open(dfm_path, encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception:
        return []

    cols = []
    # Simple pattern: FieldName = 'COLNAME'
    for m in re.finditer(r"FieldName\s*=\s*'(\w+)'", content, re.IGNORECASE):
        col = m.group(1)
        if col not in cols:
            cols.append(col)
    return cols


# ---------------------------------------------------------------------------
#  Main Extractor
# ---------------------------------------------------------------------------

class DelphiExtractor:
    """Extracts all migration-relevant items from a single .pas file."""

    def __init__(self):
        self._frm_scanner = DelphiFrmScanner()
        self._proc_scanner = DelphiProcedureScanner()

    def extract(self, pas_path: str) -> dict:
        """
        Run full extraction on a .pas file.

        Returns a dict ready to be serialized as YAML (the migration manifest).
        """
        pas_path = os.path.abspath(pas_path)
        if not os.path.exists(pas_path):
            raise FileNotFoundError(f"File not found: {pas_path}")

        # Read raw content
        try:
            with open(pas_path, encoding="utf-8", errors="replace") as f:
                content = f.read()
        except Exception as e:
            raise IOError(f"Cannot read {pas_path}: {e}")

        analysis = self._frm_scanner.analyze_file(pas_path)
        self._proc_scanner.scan_file(pas_path)

        module_name = analysis.unit_name or Path(pas_path).stem

        # ── collect raw items ────────────────────────────────────────────
        raw_items = []

        # 1. Lifecycle methods
        for m in sorted(analysis.life_cycle_methods):
            raw_items.append({
                "type": "PROC",
                "name": m,
                "category": "lifecycle",
                "description": f"Lifecycle handler: {m}",
            })

        # 2. Click handlers
        for h in sorted(analysis.click_handlers, key=lambda x: x["name"]):
            raw_items.append({
                "type": "PROC",
                "name": h["name"],
                "category": "click_handler",
                "description": f"Button/menu click: {h['name']}",
            })

        # 3. DblClick handlers
        for h in sorted(analysis.dblclick_handlers, key=lambda x: x["name"]):
            raw_items.append({
                "type": "PROC",
                "name": h["name"],
                "category": "dblclick_handler",
                "description": f"Double-click handler: {h['name']}",
            })

        # 4. Exit handlers (field validation on leave)
        for h in sorted(analysis.exit_handlers, key=lambda x: x["name"]):
            raw_items.append({
                "type": "PROC",
                "name": h["name"],
                "category": "exit_handler",
                "description": f"Field exit/validation: {h['name']}",
            })

        # 5. Change handlers
        for h in sorted(analysis.change_handlers, key=lambda x: x["name"]):
            raw_items.append({
                "type": "PROC",
                "name": h["name"],
                "category": "change_handler",
                "description": f"Field change handler: {h['name']}",
            })

        # 6. Custom procedures (from proc_scanner — non-event procs)
        known_events = {item["name"] for item in raw_items}
        for pname in sorted(self._proc_scanner.list_procedures()):
            if pname not in known_events:
                proc = self._proc_scanner.get_procedure(pname)
                raw_items.append({
                    "type": "PROC",
                    "name": pname,
                    "category": "custom_proc",
                    "description": f"Custom procedure: {pname}",
                    "calls_tables": proc.calls_tables if proc else [],
                    "calls_globals": proc.calls_globals if proc else [],
                })

        # 7. SQL blocks
        sql_blocks = _extract_sql_snippets(content)
        for i, block in enumerate(sql_blocks, 1):
            snippet = block["sql"][:120].replace("\n", " ")
            raw_items.append({
                "type": "SQL",
                "name": f"sql_block_{i}",
                "category": "inline_sql",
                "description": f"Line {block['line']}: {snippet}",
                "sql_preview": block["sql"][:300],
            })

        # 8. Stored procedure calls
        for sp in _extract_stored_procs(content):
            raw_items.append({
                "type": "SQL",
                "name": sp["name"],
                "category": "stored_proc",
                "description": f"Stored proc call: {sp['name']}.{sp['call']}",
            })

        # 9. Query open/exec calls
        for q in _extract_query_opens(content):
            raw_items.append({
                "type": "SQL",
                "name": q["name"],
                "category": "query_open",
                "description": f"Query operation: {q['name']}.{q['op']}",
            })

        # 10. Dataset fields (column declarations)
        for fld in _extract_fields(content):
            raw_items.append({
                "type": "FIELD",
                "name": f"{fld['query']}.{fld['column']}",
                "category": "dataset_field",
                "description": (
                    f"Column {fld['column']} on query {fld['query']} "
                    f"({fld['delphi_type']})"
                ),
                "delphi_type": fld["delphi_type"],
                "column": fld["column"],
            })

        # 11. Grid columns from .dfm
        dfm_path = pas_path.replace(".pas", ".dfm")
        grid_cols = _extract_grid_columns_from_dfm(dfm_path)
        existing_field_cols = {
            item["column"] for item in raw_items
            if item["type"] == "FIELD"
        }
        for col in grid_cols:
            if col not in existing_field_cols:
                raw_items.append({
                    "type": "FIELD",
                    "name": f"grid.{col}",
                    "category": "grid_column",
                    "description": f"Grid column (dfm): {col}",
                    "column": col,
                })

        # 12. Table references
        for tbl in sorted(analysis.table_refs):
            raw_items.append({
                "type": "TABLE",
                "name": tbl,
                "category": "table_ref",
                "description": f"DB table/view reference: {tbl}",
            })

        # 13. Global ERP variables
        for gvar in sorted(analysis.global_var_reads):
            raw_items.append({
                "type": "GLOBAL",
                "name": gvar,
                "category": "global_var",
                "description": f"ERP global variable: {gvar}",
            })

        # 14. Report references
        for rpt in sorted(analysis.report_refs):
            raw_items.append({
                "type": "REPORT",
                "name": rpt,
                "category": "report_ref",
                "description": f"Report binding: {rpt}",
            })

        # ── assign stable IDs ────────────────────────────────────────────
        # Group by type, sort within group, then assign sequential IDs
        type_order = ["PROC", "SQL", "FIELD", "TABLE", "GLOBAL", "REPORT"]
        type_counter = {t: 0 for t in type_order}

        # Deduplicate by (type, name)
        seen_keys = set()
        deduped = []
        for item in raw_items:
            key = (item["type"], item["name"])
            if key not in seen_keys:
                seen_keys.add(key)
                deduped.append(item)

        # Sort: type_order first, then name
        deduped.sort(key=lambda x: (
            type_order.index(x["type"]) if x["type"] in type_order else 99,
            x["name"],
        ))

        items_with_id = []
        for item in deduped:
            t = item["type"]
            if t not in type_counter:
                type_counter[t] = 0
            type_counter[t] += 1
            item_id = f"{t}-{type_counter[t]:03d}"

            entry = {
                "id": item_id,
                "type": item["type"],
                "name": item["name"],
                "category": item.get("category", ""),
                "description": item.get("description", ""),
                "laravel_target": "",
                "status": "pending",
                "notes": "",
            }
            # carry optional extra fields
            for extra in ("sql_preview", "delphi_type", "column",
                          "calls_tables", "calls_globals"):
                if extra in item:
                    entry[extra] = item[extra]

            items_with_id.append(entry)

        # ── build manifest ───────────────────────────────────────────────
        manifest = {
            "module": module_name,
            "source_file": pas_path,
            "inherits_from": analysis.inherits_from,
            "extracted_at": datetime.now().isoformat(timespec="seconds"),
            "summary": {
                "total": len(items_with_id),
                "by_type": {
                    t: sum(1 for i in items_with_id if i["type"] == t)
                    for t in type_order
                },
            },
            "items": items_with_id,
            "warnings": analysis.warnings,
            "errors": analysis.errors,
        }

        return manifest


# ---------------------------------------------------------------------------
#  YAML serialization helpers
# ---------------------------------------------------------------------------

class _LiteralStr(str):
    """Marker for YAML literal block scalar."""
    pass


def _literal_representer(dumper, data):
    return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|")


def _build_yaml_dumper():
    dumper = yaml.Dumper
    dumper.add_representer(_LiteralStr, _literal_representer)
    return dumper


def manifest_to_yaml(manifest: dict) -> str:
    """Serialize manifest to YAML string, with sql_preview as literal blocks."""
    # Make sql_preview use literal block style for readability
    for item in manifest.get("items", []):
        if "sql_preview" in item and item["sql_preview"]:
            item["sql_preview"] = _LiteralStr(item["sql_preview"])

    return yaml.dump(
        manifest,
        Dumper=_build_yaml_dumper(),
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=120,
    )


def save_manifest(manifest: dict, output_path: str):
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(manifest_to_yaml(manifest))
