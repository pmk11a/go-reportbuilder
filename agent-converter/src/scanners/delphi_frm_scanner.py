"""
DelphiFrmScanner - Static scanner for .pas unit files.

Scans Delphi form files to extract:
- Component declarations
- Event handlers (Click/Exit/Change/KeyDown/DblClick)
- Private/public variables
- Business logic procedures
- Report bindings (FastReport 3, 4/5, QuickReport)
- Table/column references (real DB tables, not VCL units)
"""

import re
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Set


@dataclass
class Component:
    name: str
    cls: str
    props: dict = field(default_factory=dict)


@dataclass
class EventHandler:
    name: str
    component: str
    body_lines: int = 0
    description: str = ""


@dataclass
class FormAnalysis:
    unit_name: str = ""
    inherits_from: str = ""
    components: list = field(default_factory=list)
    private_vars: list = field(default_factory=list)
    published_vars: list = field(default_factory=list)
    events: list = field(default_factory=list)
    click_handlers: list = field(default_factory=list)
    dblclick_handlers: list = field(default_factory=list)
    exit_handlers: list = field(default_factory=list)
    change_handlers: list = field(default_factory=list)
    keydown_handlers: list = field(default_factory=list)
    query_refs: list = field(default_factory=list)
    query_field_refs: list = field(default_factory=list)
    table_refs: list = field(default_factory=list)
    global_var_reads: list = field(default_factory=list)
    global_var_writes: list = field(default_factory=list)
    report_refs: list = field(default_factory=list)
    lookup_combos: list = field(default_factory=list)
    life_cycle_methods: list = field(default_factory=list)
    uses_units: list = field(default_factory=list)
    _method_body_cache: dict = field(default_factory=dict)
    errors: list = field(default_factory=list)
    warnings: list = field(default_factory=list)

    def has_errors(self):
        return len(self.errors) > 0


# VCL / 3rd-party units that match DBxxx but are NOT database tables.
# Must be excluded from table_refs.
_NON_TABLE_UNITS = {
    "DBCtrls", "DBGrids", "DB", "DBCommon", "DBCGrids",
    "wwdblook", "Wwdbigrd", "Wwdbgrid",
    "dxDBTLCl", "dxGrClms", "dxTL", "dxDBCtrl", "dxDBGrid",
    "dxCntner", "dxEditor", "dxExEdtr", "dxEdLib", "dxmdaset",
    "frxClass", "frxDMPExport", "frxDBSet", "frxDesgn",
    "ADODB", "Db", "Mask", "Dialogs", "Forms", "Controls",
    "Classes", "SysUtils", "Windows", "Messages", "Graphics",
    "ExtCtrls", "StdCtrls", "Buttons", "ComCtrls", "Grids",
    "ToolEdit", "RXCtrls", "ImgList", "SpeedBar", "variants",
    "PBNumEdit", "jpeg", "Dateutils", "raCodMod",
    "ppBands", "ppCtrls", "ppDB", "ppPrnabl", "ppClass",
    "ppCache", "ppDBPipe", "ppComm", "ppRelatv", "ppProd",
    "ppReport", "ppVar", "ppStrtch", "ppMemo", "ppModule",
    "MyGlobal",
}

# Delphi built-in identifiers matching Qu word that are NOT query refs
_NON_QUERY_BUILTINS = {"QuotedStr", "Query"}


class DelphiFrmScanner:
    """Static scanner for Delphi .pas form files."""

    # Component declaration: Foo: TButton;
    OBJ_INSTANCE_RE = re.compile(
        r"^\s+(\w+)\s*:\s+(T\w+)\s*;"
        , re.MULTILINE
    )

    # Method signature
    METHOD_RE = re.compile(
        r"(procedure|function)\s+(T\w+)\.(\w+)\s*\("
    )

    # Query declaration
    QUERY_DECL_RE = re.compile(
        r"^\s+(Qu\w+|Q\w+)\s*:\s*T(ADOQuery|Query|StoredProc|AdoStoredProc)\b", re.MULTILINE
    )

    # Field declarations
    QUERY_FIELD_RE = re.compile(
        r"^\s+((?:Qu|Q)\w+)([A-Z][A-Za-z0-9_]*)\s*:\s*T\w+Field\b", re.MULTILINE
    )

    # DB tables/views
    TABLE_REF_RE = re.compile(r"\b(DB[A-Za-z][A-Za-z0-9_]*|vw[A-Za-z][A-Za-z0-9_]*)\b")

    # Report files
    REPORT_FILE_RE = re.compile(
        r"['\"]([A-Za-z0-9_./-]+\.(?:fr3|fp3|frp))['\"]"
    )

    # Report components
    REPORT_COMP_RE = re.compile(
        r"\b(frxReport\w*|frReport\w*|ppReport\w*|QuickRep\w*|rv\w*Project)\b"
    )

    # Lifecycle methods
    LIFE_CYCLE_RE = re.compile(
        r"\b(FormShow|FormCreate|FormClose|FormActivate|FormDestroy|FormKeyDown)\s*\("
    )

    # Global vars
    GLOBAL_VAR_RE = re.compile(
        r"\b(IDUser|XnamaGudang|MyUser|LevelUserAccess|PeriodBln|PeriodThn|Xtgl|KodeGudang)\b"
    )

    # uses clause
    USES_RE = re.compile(r"^\s*uses\s+(.+?);", re.MULTILINE | re.DOTALL)

    # Event names
    EVENT_SUFFIXES = (
        "Click", "DblClick", "Exit", "Change", "KeyDown", "KeyPress",
        "KeyUp", "Enter", "MouseDown", "MouseUp", "MouseMove",
        "DrawCell", "CloseUp", "DropDown", "SelectCell",
    )


    def __init__(self):
        pass

    def analyze_file(self, filepath: str) -> FormAnalysis:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
        except UnicodeDecodeError:
            try:
                with open(filepath, "r", encoding="latin-1") as f:
                    content = f.read()
            except Exception as e:
                return FormAnalysis(
                    unit_name=filepath.rsplit("/", 1)[-1].split(".")[0],
                    inherits_from="Unknown",
                    errors=[f"Cannot read file: {e}"],
                )
        except Exception as e:
            return FormAnalysis(
                unit_name=filepath.rsplit("/", 1)[-1].split(".")[0],
                inherits_from="Unknown",
                errors=[f"Cannot read file: {e}"],
            )

        analysis = FormAnalysis()

        m = re.search(r"^unit\s+(\w+)", content, re.MULTILINE)
        if m:
            analysis.unit_name = m.group(1)

        m = re.search(r"class\s*\(\s*(\w+)\s*\)", content)
        if m:
            analysis.inherits_from = m.group(1)

        self._parse_uses(content, analysis)
        self._parse_object_declarations(content, analysis)
        self._extract_methods(content, analysis)
        self._analyze_method_bodies(analysis)
        self._scan_references(content, analysis)

        if not analysis.inherits_from:
            analysis.warnings.append("Could not detect inherited class")

        return analysis

    def _parse_uses(self, content: str, analysis: FormAnalysis):
        uses_match = self.USES_RE.search(content)
        if uses_match:
            units = [u.strip() for u in uses_match.group(1).split(",")]
            analysis.uses_units = sorted(set(units))

    def _parse_object_declarations(self, content: str, analysis: FormAnalysis):
        for match in self.OBJ_INSTANCE_RE.finditer(content):
            name = match.group(1)
            cls = match.group(2)
            analysis.components.append(Component(name=name, cls=cls))
            if "DBLookup" in cls or "DBCombo" in cls:
                analysis.lookup_combos.append(name)

    def _extract_methods(self, content: str, analysis: FormAnalysis):
        for match in self.METHOD_RE.finditer(content):
            class_name = match.group(2)
            method_name = match.group(3)
            analysis._method_body_cache[method_name] = {
                "class": class_name,
                "is_event": self._is_event_handler_name(method_name),
            }

    def _is_event_handler_name(self, name: str) -> bool:
        return any(name.endswith(s) for s in self.EVENT_SUFFIXES)

    def _analyze_method_bodies(self, analysis: FormAnalysis):
        for method_name, info in analysis._method_body_cache.items():
            if not info.get("is_event"):
                continue
            method_lower = method_name.lower()
            full_name = f"{info['class']}.{method_name}"
            entry = {"name": method_name, "full_name": full_name}

            if "dblclick" in method_lower:
                analysis.dblclick_handlers.append(entry)
            elif "btn" in method_lower or method_lower.endswith("click"):
                analysis.click_handlers.append(entry)
            elif "exit" in method_lower:
                analysis.exit_handlers.append(entry)
            elif "change" in method_lower:
                analysis.change_handlers.append(entry)
            elif "keydown" in method_lower or "keypress" in method_lower:
                analysis.keydown_handlers.append(entry)

    def _scan_references(self, content: str, analysis: FormAnalysis):
        query_names = set()
        for m in self.QUERY_DECL_RE.finditer(content):
            qname = m.group(1)
            if qname not in _NON_QUERY_BUILTINS:
                query_names.add(qname)

        query_field_names = set()
        for m in self.QUERY_FIELD_RE.finditer(content):
            qprefix = m.group(1)
            field_part = m.group(2)
            full_name = qprefix + field_part
            query_field_names.add(full_name)
            if qprefix not in _NON_QUERY_BUILTINS:
                query_names.add(qprefix)
        analysis.query_field_refs = sorted(query_field_names)

        real_query_uses = set()
        for qname in sorted(query_names):
            pattern = re.compile(rf"\b{re.escape(qname)}\s*(?:\.|\[)")
            if pattern.search(content):
                real_query_uses.add(qname)

        dm_queries = set(re.findall(r"\bDM\.([Q]\w+)\b", content))
        for q in dm_queries:
            real_query_uses.add(f"DM.{q}")

        analysis.query_refs = sorted(real_query_uses)

        raw_tables = set(self.TABLE_REF_RE.findall(content))
        table_blocklist = _NON_TABLE_UNITS | set(analysis.uses_units)
        tables = {t for t in raw_tables if t not in table_blocklist}
        analysis.table_refs = sorted(tables)

        analysis.global_var_reads = sorted(set(self.GLOBAL_VAR_RE.findall(content)))

        reports = set()
        for m in self.REPORT_FILE_RE.finditer(content):
            reports.add(m.group(1))
        for m in self.REPORT_COMP_RE.finditer(content):
            reports.add(m.group(1))
        analysis.report_refs = sorted(reports)

        analysis.life_cycle_methods = sorted(set(self.LIFE_CYCLE_RE.findall(content)))

    def get_summary(self, analysis: FormAnalysis) -> dict:
        return {
            "unit": analysis.unit_name,
            "inherits_from": analysis.inherits_from,
            "uses_units": analysis.uses_units,
            "components_count": len(analysis.components),
            "lookup_combos": analysis.lookup_combos,
            "click_handlers": [h["name"] for h in analysis.click_handlers],
            "dblclick_handlers": [h["name"] for h in analysis.dblclick_handlers],
            "exit_handlers": [h["name"] for h in analysis.exit_handlers],
            "change_handlers": [h["name"] for h in analysis.change_handlers],
            "keydown_handlers": [h["name"] for h in analysis.keydown_handlers],
            "query_refs": analysis.query_refs,
            "query_field_refs_count": len(analysis.query_field_refs),
            "query_field_refs_sample": analysis.query_field_refs[:5],
            "table_refs": analysis.table_refs,
            "global_var_reads": analysis.global_var_reads,
            "report_refs": analysis.report_refs,
            "life_cycle_methods": analysis.life_cycle_methods,
            "errors": analysis.errors,
            "warnings": analysis.warnings,
        }
