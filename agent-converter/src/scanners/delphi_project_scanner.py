"""DelphiProjectScanner - Scans entire Delphi project and builds knowledge graph.

This is the production-grade scanner that:
- Walks the entire Delphi source tree (recursive)
- Categorizes files: Form / DM (DataModule) / Util / SharedProc
- Extracts: forms, queries, tables, reports, global vars, event handlers
- Builds a cross-reference knowledge graph between forms, queries, tables
- Exports JSON for downstream Laravel generators
"""

import os
import re
import json
import time
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Set, Tuple


@dataclass
class FileIndex:
    """Per-file analysis result."""
    filepath: str
    filename: str
    module_name: str
    unit_name: str
    file_type: str  # form / dm / util / shared_proc / unknown
    inherits_from: str
    uses_units: List[str]
    uses_dm: bool
    components_count: int
    lookup_combos: List[str]
    click_handlers: List[str]
    dblclick_handlers: List[str]
    exit_handlers: List[str]
    change_handlers: List[str]
    keydown_handlers: List[str]
    query_refs: List[str]
    query_field_refs: List[str]
    table_refs: List[str]
    report_refs: List[str]
    global_var_reads: List[str]
    global_var_writes: List[str]
    lifecycle_methods: List[str]
    custom_procedures: List[str]
    custom_functions: List[str]
    errors: List[str]
    warnings: List[str]
    code_lines: int
    proc_summaries: List[dict] = field(default_factory=list)


@dataclass
class ProjectKnowledgeGraph:
    """Project-wide knowledge graph."""
    project_root: str
    scan_started_at: float = 0.0
    scan_duration_seconds: float = 0.0
    total_files: int = 0
    total_lines: int = 0
    total_size_bytes: int = 0
    file_indices: List[FileIndex] = field(default_factory=list)
    all_forms: Dict[str, str] = field(default_factory=dict)  # module_name -> filepath
    all_dm_units: Dict[str, str] = field(default_factory=dict)
    all_util_units: Dict[str, str] = field(default_factory=dict)
    all_queries: Dict[str, str] = field(default_factory=dict)
    all_tables: Dict[str, int] = field(default_factory=dict)
    all_reports: Dict[str, int] = field(default_factory=dict)
    all_click_handlers: Dict[str, List[Tuple[str, str]]] = field(default_factory=dict)
    all_exit_handlers: Dict[str, List[Tuple[str, str]]] = field(default_factory=dict)
    all_change_handlers: Dict[str, List[Tuple[str, str]]] = field(default_factory=dict)
    all_custom_procs: Dict[str, List[Tuple[str, str]]] = field(default_factory=dict)
    all_custom_funcs: Dict[str, List[Tuple[str, str]]] = field(default_factory=dict)
    all_global_vars: Dict[str, Set[str]] = field(default_factory=dict)
    all_lifecycle_methods: Dict[str, List[str]] = field(default_factory=dict)
    form_show_relationships: List[Tuple[str, str, str]] = field(default_factory=list)
    errors: List[Dict[str, str]] = field(default_factory=list)
    saved_json_path: Optional[str] = None

    def register_form(self, fi: FileIndex):
        self.all_forms[fi.module_name] = fi.filepath

    def register_dm(self, fi: FileIndex):
        self.all_dm_units[fi.module_name] = fi.filepath

    def register_util(self, fi: FileIndex):
        self.all_util_units[fi.module_name] = fi.filepath

    def register_query(self, qname: str, owner_module: str):
        if qname not in self.all_queries:
            self.all_queries[qname] = owner_module

    def register_table(self, tname: str):
        self.all_tables[tname] = self.all_tables.get(tname, 0) + 1

    def register_report(self, rname: str):
        self.all_reports[rname] = self.all_reports.get(rname, 0) + 1

    def register_click_handler(self, proc_name: str, form_name: str):
        key = proc_name.replace("Click", "")
        self.all_click_handlers.setdefault(key, []).append((form_name, proc_name))

    def register_exit_handler(self, proc_name: str, form_name: str):
        key = proc_name.replace("Exit", "")
        self.all_exit_handlers.setdefault(key, []).append((form_name, proc_name))

    def register_change_handler(self, proc_name: str, form_name: str):
        key = proc_name.replace("Change", "")
        self.all_change_handlers.setdefault(key, []).append((form_name, proc_name))

    def register_custom_proc(self, proc_name: str, form_name: str):
        self.all_custom_procs.setdefault(proc_name, []).append((form_name, proc_name))

    def register_custom_func(self, func_name: str, form_name: str):
        self.all_custom_funcs.setdefault(func_name, []).append((form_name, func_name))

    def register_global_var(self, var_name: str, form_name: str):
        self.all_global_vars.setdefault(var_name, set()).add(form_name)

    def register_lifecycle(self, method_name: str, form_name: str):
        self.all_lifecycle_methods.setdefault(method_name, []).append(form_name)

    def register_form_show_relationship(self, caller: str, target_form: str, method: str):
        self.form_show_relationships.append((caller, target_form, method))

    def get_stats(self) -> dict:
        return {
            "total_files": self.total_files,
            "total_lines": self.total_lines,
            "total_size_bytes": self.total_size_bytes,
            "scan_duration_seconds": round(self.scan_duration_seconds, 2),
            "forms_count": len(self.all_forms),
            "dm_units_count": len(self.all_dm_units),
            "util_units_count": len(self.all_util_units),
            "unique_queries": len(self.all_queries),
            "unique_tables": len(self.all_tables),
            "unique_reports": len(self.all_reports),
            "unique_click_handlers": len(self.all_click_handlers),
            "unique_exit_handlers": len(self.all_exit_handlers),
            "unique_change_handlers": len(self.all_change_handlers),
            "unique_custom_procs": len(self.all_custom_procs),
            "unique_custom_funcs": len(self.all_custom_funcs),
            "global_vars_count": len(self.all_global_vars),
            "lifecycle_methods_count": len(self.all_lifecycle_methods),
            "form_show_relationships": len(self.form_show_relationships),
            "errors": len(self.errors),
        }

    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict."""
        return {
            "project_root": self.project_root,
            "stats": self.get_stats(),
            "all_forms": self.all_forms,
            "all_dm_units": self.all_dm_units,
            "all_util_units": self.all_util_units,
            "all_queries": self.all_queries,
            "all_tables": dict(sorted(self.all_tables.items(), key=lambda x: -x[1])),
            "all_reports": dict(sorted(self.all_reports.items(), key=lambda x: -x[1])),
            "all_global_vars": {k: sorted(list(v)) for k, v in self.all_global_vars.items()},
            "all_lifecycle_methods": self.all_lifecycle_methods,
            "all_click_handlers": {k: v for k, v in sorted(self.all_click_handlers.items())},
            "all_exit_handlers": {k: v for k, v in sorted(self.all_exit_handlers.items())},
            "all_change_handlers": {k: v for k, v in sorted(self.all_change_handlers.items())},
            "all_custom_procs": {k: v for k, v in sorted(self.all_custom_procs.items())},
            "all_custom_funcs": {k: v for k, v in sorted(self.all_custom_funcs.items())},
            "form_show_relationships": self.form_show_relationships,
            "errors": self.errors,
        }




# ---------------------------------------------------------------------------
#  Categorization patterns
# ---------------------------------------------------------------------------

DM_FILE_HINTS = ("DM", "DataModule", "Modul", "MyModul", "DataModul")
UTIL_FILE_HINTS = ("MyProcedure", "MyGlobal", "MyFunction", "MyUtils", "MyHelper")

FORM_INHERIT_RE = re.compile(r"class\s*\(\s*TForm\s*\)", re.IGNORECASE)
DM_INHERIT_RE = re.compile(r"class\s*\(\s*TDataModule\s*\)", re.IGNORECASE)

FORM_SHOW_CALL_RE = re.compile(
    r"(T(Fr[a-zA-Z0-9_]*|Frm[A-Z][a-zA-Z0-9_]*))\s*\.\s*(Show|ShowModal|Create)",
    re.IGNORECASE
)


def categorize_file(filepath, content):
    """Categorize a .pas file by content, not just path."""
    if DM_INHERIT_RE.search(content):
        return "dm"
    if FORM_INHERIT_RE.search(content):
        return "form"
    filename = os.path.basename(filepath).lower()
    if any(h.lower() in filename for h in DM_FILE_HINTS):
        return "dm"
    if any(h.lower() in filename for h in UTIL_FILE_HINTS):
        return "util"
    # Fallback: check if file has procedure/function definitions (shared_proc style)
    has_proc_def = bool(re.search(r'(?:^|;)\s*procedure\s+\w+', content, re.MULTILINE | re.IGNORECASE))
    has_func_def = bool(re.search(r'(?:^|;)\s*function\s+\w+', content, re.MULTILINE | re.IGNORECASE))
    if has_proc_def or has_func_def:
        if has_func_def:
            return "func"
        return "util"
    return "unknown"


def detect_module_name(filepath, content):
    """Detect module name from unit clause or filename."""
    m = re.search(r"^\s*unit\s+([A-Za-z0-9_]+)\s*;", content, re.MULTILINE | re.IGNORECASE)
    if m:
        return m.group(1)
    return os.path.splitext(os.path.basename(filepath))[0]

class CrossReferenceResolver:
    """Builds cross-references after individual file scans complete."""

    def __init__(self, graph):
        self.graph = graph

    def resolve(self):
        self._resolve_queries()
        self._resolve_form_show_calls()
        return self.graph

    def _resolve_queries(self):
        for fi in self.graph.file_indices:
            for q in fi.query_refs:
                bare = q.split(".")[-1] if "." in q else q
                self.graph.register_query(bare, fi.module_name)

    def _resolve_form_show_calls(self):
        for fi in self.graph.file_indices:
            if not fi.filepath or not os.path.exists(fi.filepath):
                continue
            try:
                with open(fi.filepath, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
            except Exception:
                continue
            for m in FORM_SHOW_CALL_RE.finditer(content):
                target = m.group(1)
                method = m.group(3)
                self.graph.register_form_show_relationship(fi.module_name, target, method)

class DelphiProjectScanner:
    """Scans entire Delphi project recursively."""

    def __init__(self, scanner_class=None):
        if scanner_class is None:
            from .delphi_frm_scanner import DelphiFrmScanner
            scanner_class = DelphiFrmScanner
        self.form_scanner = scanner_class()
        self.skip_dirs = {"node_modules", ".git", "venv", "__pycache__", "coverage",
                          "backup", "bin", "obj", "Win32", "Win64", ".vs"}
        self.skip_filenames = {
            # Framework-specific files (no conversion needed)
            "FrmUtama.pas", "FrmLogin.pas", "FrmPaswd.pas",
            "FrmBrows.pas", "FrmMenuReport.pas", "FrmReportPreview.pas",
            "FrmKonfigurasi.pas", "FrmUpdate.pas",
        }

    def scan_project(self, project_root, verbose=True, auto_save_json=True, output_dir=None):
        """
        Scan entire Delphi project recursively.

        Args:
            project_root: Root directory of the Delphi project.
            verbose: Print progress.
            auto_save_json: If True, automatically save graph to JSON after scan.
            output_dir: Where to save JSON. Default: <project_root>/_agent_scan/

        Returns:
            ProjectKnowledgeGraph
        """
        graph = ProjectKnowledgeGraph(project_root=project_root)
        graph.scan_started_at = time.time()
        t0 = graph.scan_started_at
        pas_files = self._discover_pas_files(project_root)
        if verbose:
            print("[scanner] discovered", len(pas_files), ".pas files in", project_root)

        for i, filepath in enumerate(pas_files, 1):
            try:
                fi = self._scan_file(filepath)
                if fi is None:
                    continue
                graph.file_indices.append(fi)
                graph.total_lines += fi.code_lines
                try:
                    graph.total_size_bytes += os.path.getsize(filepath)
                except OSError:
                    pass

                if fi.file_type == "form":
                    graph.register_form(fi)
                    for ch in fi.click_handlers:
                        name = ch['name'] if isinstance(ch, dict) else ch
                        graph.register_click_handler(name, fi.module_name)
                    for eh in fi.exit_handlers:
                        name = eh['name'] if isinstance(eh, dict) else eh
                        graph.register_exit_handler(name, fi.module_name)
                    for ch in fi.change_handlers:
                        name = ch['name'] if isinstance(ch, dict) else ch
                        graph.register_change_handler(name, fi.module_name)
                    for proc in fi.custom_procedures:
                        name = proc['name'] if isinstance(proc, dict) else proc
                        graph.register_custom_proc(name, fi.module_name)
                    for func in fi.custom_functions:
                        name = func['name'] if isinstance(func, dict) else func
                        graph.register_custom_func(name, fi.module_name)
                    for var in fi.global_var_reads:
                        name = var['name'] if isinstance(var, dict) else var
                        graph.register_global_var(name, fi.module_name)
                    for method in fi.lifecycle_methods:
                        graph.register_lifecycle(method, fi.module_name)
                elif fi.file_type == "dm":
                    graph.register_dm(fi)
                elif fi.file_type == "util":
                    graph.register_util(fi)

                # Register procedures/functions from ALL files via proc_summaries
                for ps in fi.proc_summaries:
                    proc_name = ps['name']
                    summary = ps['summary']
                    if callable(getattr(summary, 'calls_tables', None)):
                        graph.register_custom_proc(proc_name, fi.module_name)
                    else:
                        graph.register_custom_proc(proc_name, fi.module_name)
                    # Also register cross-references
                    if hasattr(summary, 'calls_queries'):
                        for qref in summary.calls_queries:
                            graph.register_query(qref, fi.module_name)
                    if hasattr(summary, 'calls_tables'):
                        for tref in summary.calls_tables:
                            graph.register_table(tref)
                    if hasattr(summary, 'calls_globals'):
                        for gref in summary.calls_globals:
                            graph.register_global_var(gref, fi.module_name)
                    if hasattr(summary, 'calls_other_procs'):
                        for pcalled in summary.calls_other_procs:
                            graph.register_custom_proc(pcalled, fi.module_name)

                for t in fi.table_refs:
                    graph.register_table(t)
                for r in fi.report_refs:
                    graph.register_report(r)
                for q in fi.query_refs:
                    bare = q.split(".")[-1] if "." in q else q
                    graph.register_query(bare, fi.module_name)

            except Exception as e:
                graph.errors.append({"file": filepath, "error": str(e)})

            if verbose and i % 50 == 0:
                print("[scanner] progress:", i, "/", len(pas_files), "files scanned")

        resolver = CrossReferenceResolver(graph)
        resolver.resolve()

        graph.total_files = len(pas_files)
        graph.scan_duration_seconds = time.time() - t0

        if verbose:
            stats = graph.get_stats()
            print("[scanner] done in", stats["scan_duration_seconds"], "s")
            print("[scanner] forms=", stats["forms_count"], "dm=", stats["dm_units_count"], "util=", stats["util_units_count"])
            print("[scanner] tables=", stats["unique_tables"], "queries=", stats["unique_queries"], "reports=", stats["unique_reports"])
            print("[scanner] errors=", stats["errors"])

        # Auto-save JSON
        if auto_save_json:
            try:
                json_path = self._auto_save_json(graph, output_dir)
                graph.saved_json_path = json_path
                if verbose:
                    print(f"[scanner] auto-saved JSON: {json_path}")
            except Exception as e:
                if verbose:
                    print(f"[scanner] WARN: auto-save JSON failed: {e}")

        return graph

    def _auto_save_json(self, graph, output_dir=None):
        """Auto-save graph to JSON file. Default dir: <project_root>/_agent_scan/"""
        if output_dir is None:
            output_dir = os.path.join(graph.project_root or ".", "_agent_scan")
        os.makedirs(output_dir, exist_ok=True)

        # Filename: delphi_scan_<timestamp>.json
        from datetime import datetime
        ts = datetime.fromtimestamp(graph.scan_started_at).strftime("%Y%m%d_%H%M%S")
        json_path = os.path.join(output_dir, f"delphi_scan_{ts}.json")

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(graph.to_dict(), f, indent=2, default=str)

        # Also save latest.json (overwrite)
        latest_path = os.path.join(output_dir, "delphi_scan_latest.json")
        with open(latest_path, "w", encoding="utf-8") as f:
            json.dump(graph.to_dict(), f, indent=2, default=str)

        # Also generate Markdown report
        try:
            md_path = self._auto_save_md(graph, output_dir, ts)
            graph.saved_md_path = md_path
            print(f"[scanner] auto-saved MD: {md_path}")
        except Exception as e:
            print(f"[scanner] WARN: auto-save MD failed: {e}")

        return json_path

    def _auto_save_md(self, graph, output_dir, ts):
        """Auto-save graph as Markdown report."""
        d = graph.to_dict()
        stats = d.get('stats', {})
        root = d.get('project_root', '<unknown>')

        lines = []
        lines.append("# Delphi Project Scan Report")
        lines.append("")
        lines.append(f"- **Project Root:** `{root}`")
        lines.append(f"- **Scan Date:** {ts}")
        lines.append("")

        lines.append("## Summary")
        lines.append("")
        lines.append("| Metric | Count |")
        lines.append("|--------|------:|")
        for k, v in stats.items():
            if k == 'scan_duration_seconds':
                continue
            label = k.replace('_', ' ').title()
            lines.append(f"| {label} | {v} |")
        lines.append("")

        # Simple name->path tables
        for section, key, col in [("Forms", "all_forms", "Form Name"),
                                   ("Data Modules", "all_dm_units", "DM Name"),
                                   ("Utility Units", "all_util_units", "Unit Name")]:
            items = d.get(key, {})
            if items:
                lines.append(f"## {section}")
                lines.append("")
                lines.append(f"Total: **{len(items)}**")
                lines.append("")
                lines.append(f"| {col} | File |")
                lines.append(f"|{'-' * (len(col) + 2)}|------|")
                for name, path in sorted(items.items()):
                    lines.append(f"| `{name}` | `{path}` |")
                lines.append("")

        # Handlers: dict[str -> list[(form, method)]]
        for section, key in [("Click Handlers", "all_click_handlers"),
                              ("Exit Handlers", "all_exit_handlers"),
                              ("Change Handlers", "all_change_handlers")]:
            items = d.get(key, {})
            if items:
                lines.append(f"## {section}")
                lines.append("")
                lines.append(f"Total unique: **{len(items)}**")
                lines.append("")
                lines.append("| Control | Form | Method |")
                lines.append("|---------|------|--------|")
                for ctrl, entries in sorted(items.items()):
                    for entry in entries:
                        if isinstance(entry, (list, tuple)):
                            f, m = entry[0], entry[1] if len(entry) > 1 else ""
                            lines.append(f"| `{ctrl}` | `{f}` | `{m}` |")
                lines.append("")

        # Lifecycle
        lc = d.get("all_lifecycle_methods", {})
        if lc:
            lines.append("## Lifecycle Methods")
            lines.append("")
            lines.append(f"Total: **{len(lc)}**")
            lines.append("")
            lines.append("| Method | Form(s) |")
            lines.append("|--------|---------|")
            for method, forms_list in sorted(lc.items()):
                fs = ", ".join(f"`{f}`" for f in forms_list)
                lines.append(f"| `{method}` | {fs} |")
            lines.append("")

        # Custom procs/funcs
        for section, key, col in [("Custom Procedures", "all_custom_procs", "Procedure"),
                                    ("Custom Functions", "all_custom_funcs", "Function")]:
            items = d.get(key, {})
            if items:
                lines.append(f"## {section}")
                lines.append("")
                lines.append(f"Total unique: **{len(items)}**")
                lines.append("")
                lines.append(f"| {col} | Form |")
                lines.append(f"|{'-' * (len(col) + 2)}|------|")
                for proc, entries in sorted(items.items()):
                    for entry in entries:
                        form = entry[0] if isinstance(entry, (list, tuple)) else entry
                        lines.append(f"| `{proc}` | `{form}` |")
                lines.append("")

        # Queries
        queries = d.get("all_queries", {})
        if queries:
            lines.append("## Queries")
            lines.append("")
            lines.append(f"Total: **{len(queries)}**")
            lines.append("")
            lines.append("| Query Name | Owner Module |")
            lines.append("|------------|--------------|")
            for q, owner in sorted(queries.items()):
                lines.append(f"| `{q}` | `{owner}` |")
            lines.append("")

        # Tables (dict name -> ref_count or list)
        tables = d.get("all_tables", {})
        if tables:
            lines.append("## Tables")
            lines.append("")
            lines.append(f"Total: **{len(tables)}**")
            lines.append("")
            lines.append("| Table Name | Refs |")
            lines.append("|------------|------|")
            for t, refs in sorted(tables.items()):
                if isinstance(refs, list):
                    lines.append(f"| `{t}` | {len(refs)} |")
                else:
                    lines.append(f"| `{t}` | {refs} |")
            lines.append("")

        # Reports
        reports = d.get("all_reports", {})
        if reports:
            lines.append("## Reports")
            lines.append("")
            lines.append(f"Total: **{len(reports)}**")
            lines.append("")
            lines.append("| Report Name | Owner Module |")
            lines.append("|-------------|--------------|")
            for r, owner in sorted(reports.items()):
                lines.append(f"| `{r}` | `{owner}` |")
            lines.append("")

        # Global vars (dict var -> list of forms)
        gvars = d.get("all_global_vars", {})
        if gvars:
            lines.append("## Global Variables")
            lines.append("")
            lines.append(f"Total: **{len(gvars)}**")
            lines.append("")
            lines.append("| Variable | Used In |")
            lines.append("|----------|---------|")
            for var, used_in in sorted(gvars.items()):
                us = ", ".join(f"`{f}`" for f in used_in)
                lines.append(f"| `{var}` | {us} |")
            lines.append("")

        # Form-show
        fshow = d.get("form_show_relationships", [])
        if fshow:
            lines.append("## Form Show Relationships")
            lines.append("")
            lines.append(f"Total: **{len(fshow)}**")
            lines.append("")
            lines.append("| From Form | Target Form | Method |")
            lines.append("|-----------|-------------|--------|")
            for caller, target, method in fshow:
                lines.append(f"| `{caller}` | `{target}` | `{method}` |")
            lines.append("")

        # Per-file details
        fis = d.get("file_indices", [])
        if fis:
            lines.append("## Per-File Details")
            lines.append("")
            for fi in fis:
                lines.append(f"### `{fi.get('filename')}`")
                lines.append("")
                lines.append(f"- **Path:** `{fi.get('filepath')}`")
                lines.append(f"- **Module:** `{fi.get('module_name')}`")
                lines.append(f"- **Type:** `{fi.get('file_type')}`")
                inh = fi.get("inherits_from") or "(none)"
                lines.append(f"- **Inherits:** `{inh}`")
                uses = fi.get("uses_units", [])
                lines.append(f"- **Uses:** {', '.join(uses) if uses else '(none)'}")
                lines.append(f"- **Components:** {fi.get('components_count', 0)}")
                lines.append(f"- **Code Lines:** {fi.get('code_lines', 0)}")
                lines.append("")

                # Handlers per file
                for hkey, hlabel in [("click_handlers", "Click"),
                                      ("exit_handlers", "Exit"),
                                      ("change_handlers", "Change")]:
                    hh = fi.get(hkey, [])
                    if hh:
                        lines.append(f"- **{hlabel} Handlers ({len(hh)}):**")
                        for c in hh:
                            n = c.get("name") if isinstance(c, dict) else c
                            lines.append(f"  - `{n}`")
                        lines.append("")

                lc2 = fi.get("lifecycle_methods", [])
                if lc2:
                    lines.append(f"- **Lifecycle:** {', '.join(f'`{m}`' for m in lc2)}")
                    lines.append("")

                # Procedur summaries
                ps = fi.get("proc_summaries", [])
                if ps:
                    lines.append(f"- **Procedures ({len(ps)}):**")
                    for p in ps:
                        name = p.get("name") if isinstance(p, dict) else p
                        summary = p.get("summary") if isinstance(p, dict) else None
                        if summary:
                            sig = summary.get("sig", "")
                            pc = summary.get("param_count", 0)
                            lines.append(f"  - `{name}` (params: {pc})")
                            if sig:
                                lines.append(f"    - Sig: `{sig}`")
                            ct = summary.get("calls_tables", [])
                            if ct:
                                lines.append(f"    - Tables: {', '.join(f'`{t}`' for t in ct)}")
                            cq = summary.get("calls_queries", [])
                            if cq:
                                lines.append(f"    - Queries: {', '.join(f'`{q}`' for q in cq)}")
                            cg = summary.get("calls_globals", [])
                            if cg:
                                lines.append(f"    - Globals: {', '.join(f'`{g}`' for g in cg)}")
                            co = summary.get("calls_other_procs", [])
                            if co:
                                lines.append(f"    - Calls: {', '.join(f'`{x}`' for x in co)}")
                        else:
                            lines.append(f"  - `{name}`")
                    lines.append("")

                gr = fi.get("global_var_reads", [])
                if gr:
                    vs = ", ".join(f"`{v.get('name', v)}`" for v in gr)
                    lines.append(f"- **Global Vars Read:** {vs}")
                    lines.append("")
                qr = fi.get("query_refs", [])
                if qr:
                    lines.append(f"- **Query Refs:** {', '.join(f'`{q}`' for q in qr)}")
                    lines.append("")
                tr = fi.get("table_refs", [])
                if tr:
                    lines.append(f"- **Table Refs:** {', '.join(f'`{t}`' for t in tr)}")
                    lines.append("")
                rr = fi.get("report_refs", [])
                if rr:
                    lines.append(f"- **Report Refs:** {', '.join(f'`{r}`' for r in rr)}")
                    lines.append("")
                errs = fi.get("errors", [])
                if errs:
                    lines.append(f"- **Errors:** {errs}")
                    lines.append("")
                lines.append("")

        # Overall errors
        errs2 = d.get("errors", [])
        if errs2:
            lines.append("## Errors")
            lines.append("")
            lines.append(f"Total: **{len(errs2)}**")
            lines.append("")
            for e in errs2:
                lines.append(f"- `{e.get('file')}`: {e.get('error')}")
            lines.append("")

        md_path = os.path.join(output_dir, f"delphi_scan_{ts}.md")
        latest_md = os.path.join(output_dir, "delphi_scan_latest.md")
        content = "\n".join(lines)
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(content)
        with open(latest_md, "w", encoding="utf-8") as f:
            f.write(content)
        return md_path
    def _discover_pas_files(self, root):
        out = []
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in self.skip_dirs]
            for fn in filenames:
                if not fn.lower().endswith(".pas"):
                    continue
                if fn in self.skip_filenames:
                    continue
                out.append(os.path.join(dirpath, fn))
        return sorted(out)

    def _scan_file(self, filepath):
        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
        except Exception:
            return None
        try:
            analysis = self.form_scanner.analyze_file(filepath)
        except Exception:
            analysis = None
        if analysis is None:
            return None
        module_name = detect_module_name(filepath, content)
        file_type = categorize_file(filepath, content)

        # Scan ALL procedures from ALL files (not just util)
        proc_summaries = []
        try:
            from .delphi_proc_scanner import DelphiProcedureScanner
            proc_scanner = DelphiProcedureScanner()
            proc_scanner.scan_file(filepath)
            for proc_name in proc_scanner.list_procedures():
                proc_summaries.append({"name": proc_name, "summary": proc_scanner.get_procedure(proc_name)})
        except Exception:
            pass

        return FileIndex(
            filepath=filepath,
            filename=os.path.basename(filepath),
            module_name=module_name,
            unit_name=getattr(analysis, "unit_name", module_name),
            file_type=file_type,
            inherits_from=getattr(analysis, "inherits_from", ""),
            uses_units=getattr(analysis, "uses_units", []),
            uses_dm="DM" in [u for u in getattr(analysis, "uses_units", [])],
            components_count=getattr(analysis, "components_count", 0),
            lookup_combos=getattr(analysis, "lookup_combos", []),
            click_handlers=getattr(analysis, "click_handlers", []),
            dblclick_handlers=getattr(analysis, "dblclick_handlers", []),
            exit_handlers=getattr(analysis, "exit_handlers", []),
            change_handlers=getattr(analysis, "change_handlers", []),
            keydown_handlers=getattr(analysis, "keydown_handlers", []),
            query_refs=getattr(analysis, "query_refs", []),
            query_field_refs=getattr(analysis, "query_field_refs", []),
            table_refs=getattr(analysis, "table_refs", []),
            report_refs=getattr(analysis, "report_refs", []),
            global_var_reads=getattr(analysis, "global_var_reads", []),
            global_var_writes=getattr(analysis, "global_var_writes", []),
            lifecycle_methods=getattr(analysis, "life_cycle_methods", []),
            custom_procedures=getattr(analysis, "custom_procedures", []),
            custom_functions=getattr(analysis, "custom_functions", []),
            errors=getattr(analysis, "errors", []),
            warnings=getattr(analysis, "warnings", []),
            code_lines=content.count("\n") + 1,
            proc_summaries=proc_summaries,
        )

    def export_json(self, graph, output_path):
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(graph.to_dict(), f, indent=2, default=str)
        return output_path


__all__ = [
    "FileIndex",
    "ProjectKnowledgeGraph",
    "DelphiProjectScanner",
    "CrossReferenceResolver",
    "categorize_file",
    "detect_module_name",
]