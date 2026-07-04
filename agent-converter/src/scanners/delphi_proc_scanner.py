"""
DelphiProcedureScanner - Scanner for MyProcedure.pas shared logic.

Scans shared procedures to understand cross-form logic like:
- DataBuka / DataBersyarat / DataUrut wrappers
- Save/load/cancel/post patterns
- Number booking interactions
- Pembatalan logic
- Activity logging
- Query execution patterns
"""

import re
from dataclasses import dataclass, field
from typing import List, Dict


@dataclass
class SharedProcedure:
    name: str
    sig: str
    body_len: int
    calls_tables: list = field(default_factory=list)
    calls_queries: list = field(default_factory=list)
    calls_globals: list = field(default_factory=list)
    calls_other_procs: list = field(default_factory=list)
    param_count: int = 0
    is_public: bool = True


class DelphiProcedureScanner:
    """Scanner for MyProcedure.pas (and other shared procedure units)."""

    PROC_DEF_RE = re.compile(r"""procedure\s+[\w.]+\s*\(([^)]*)\)""")
    PROC_DEF_NO_PARAMS = re.compile(r"""procedure\s+[\w.]+\s*;\s*$""", re.MULTILINE)
    FUNC_DEF_RE = re.compile(r"""function\s+[\w.]+\s*(?::\s*\w+)?\s*""")
    TABLE_REF_RE = re.compile(r"""(DB[A-Z]+\w*)\s""")
    QUERY_REF_RE = re.compile(r"""(DM\.Q\w+)""")
    GLOBAL_VAR_RE = re.compile(r"""\b(IDUser|XnamaGudang|MyUser|LevelUserAccess|PeriodBln|PeriodThn|Xtgl|KodeGudang)\b""")

    def __init__(self):
        self.procedures: Dict[str, SharedProcedure] = {}

    def scan_file(self, filepath: str):
        """Scan a .pas file containing shared procedures."""
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
        except UnicodeDecodeError:
            with open(filepath, "r", encoding="latin-1") as f:
                content = f.read()

        # Find all procedure signatures (with params)
        for match in self.PROC_DEF_RE.finditer(content):
            params_str = match.group(1)
            # Extract name: split 'procedure TFrm.btnClick(Sender' -> ['procedure', 'TFrm.btnClick(Sender']
            raw_parts = match.group(0).split()
            full_raw_name = raw_parts[1]  # e.g. 'TFrm.btnClick(Sender' or 'btnClick(Sender'
            # Remove everything after first '('
            full_name = full_raw_name.split('(')[0]
            proc_name = full_name.split('.')[-1]
            param_count = len([p for p in params_str.split(",") if p.strip()]) if params_str.strip() else 0

            # Calculate body length (approximate)
            start = match.start()
            next_proc = self.PROC_DEF_RE.search(content, match.end())
            if next_proc:
                body_end = min(next_proc.start(), start + 5000)
                body = content[start:body_end]
            else:
                body = content[start:start+5000]

            proc = SharedProcedure(
                name=proc_name,
                sig=f"procedure {full_name}({params_str});",
                body_len=len(body),
                param_count=param_count,
                calls_tables=sorted(set(self.TABLE_REF_RE.findall(body))),
                calls_queries=sorted(set(self.QUERY_REF_RE.findall(body))),
                calls_globals=sorted(set(self.GLOBAL_VAR_RE.findall(body))),
                calls_other_procs=self._find_other_procedure_calls(body, proc_name)
            )
            self.procedures[proc_name] = proc

        # Find all procedure declarations WITHOUT params: "procedure Name;"
        for match in self.PROC_DEF_NO_PARAMS.finditer(content):
            line = match.group(0)
            proc_name = line.split()[1].rstrip(";").strip()
            if proc_name in self.procedures:
                continue  # already found
            full_name = proc_name
            self.procedures[proc_name] = SharedProcedure(
                name=proc_name,
                sig=line.strip(),
                body_len=0,
                param_count=0,
                calls_tables=[],
                calls_queries=[],
                calls_globals=[],
                calls_other_procs=[]
            )

        # Find function declarations: "function Name: Type;" or "function Name(...): Type;"
        for match in self.FUNC_DEF_RE.finditer(content):
            line = match.group(0)
            parts = line.split()
            if len(parts) >= 2:
                func_name = parts[1].rstrip("():").split(".")[-1].strip()
                if func_name in self.procedures:
                    continue
                if func_name in {"procedure", "function", "begin", "end", "if", "for", "while"}:
                    continue
                self.procedures[func_name] = SharedProcedure(
                    name=func_name,
                    sig=line.strip(),
                    body_len=0,
                    param_count=0,
                    calls_tables=[],
                    calls_queries=[],
                    calls_globals=[],
                    calls_other_procs=[]
                )

    def _find_other_procedure_calls(self, body: str, current_proc: str) -> list:
        """Find calls to other procedures/functions in the body."""
        # Simple heuristic: find word followed by (
        calls = re.findall(r"""\b([A-Za-z_]+)\s*\(""", body)
        # Filter out known keywords, types, and self
        excluded = {"BEGIN", "END", "IF", "THEN", "ELSE", "FOR", "TO",
                    "BY", "DO", "WHILE", "AND", "OR", "NOT", "TRY", "FINALLY",
                    "RAISE", "ASSIGNED", "NIL", "TRUE", "FALSE", "NIL",
                    "CONVERTED", "FORMAT", "STR", "INT", "FLOAT", "POINTER",
                    "STRING", "INTEGER", "BOOLEAN", "BYTE", "WORD", "LONGINT",
                    "CARDINAL", "DOUBLE", "EXTENDED", "CURRENCY", "SINGLE",
                    "PROCEDURE", "FUNCTION", "VAR", "CONST", "TYPE",
                    "FORM", "APPLICATION", "SELF", "RESULT", "DATASET",
                    "QUERY", "TABLE", "PARAM", "FIELD", "ROW", "COL",
                    "CLICK", "EXIT", "CHANGE", "FOCUS", "SELECT", "CANCEL",
                    "CREATE", "DESTROY", "SHOW", "HIDE", "CLOSE", "OPEN",
                    "READ", "WRITE", "LOAD", "SAVE", "CLEAR", "REFRESH",
                    "POST", "DELETE", "APPEND", "EDIT", "INSERT", "EDIT",
                    "COMMIT", "ROLLBACK", "EXECUTE", "VALIDATE", "SUBMIT",
                    "UPDATE", "SYNC", "SYNCALL", "SYNCDELETE", "SYNCFETCH",
                    "SYNCINSERT", "SYNCUPDATE", "RELOAD", "RELOADALL"}
        # Also exclude table/query names
        excluded.update(self.TABLE_REF_RE.findall(body))
        excluded.update(self.QUERY_REF_RE.findall(body))

        result = []
        for call in calls:
            upper = call.upper()
            if upper in excluded:
                continue
            if call != current_proc and not call.startswith("_") and len(call) > 2:
                result.append(call)
        return sorted(set(result))

    def get_procedure(self, name: str) -> SharedProcedure:
        return self.procedures.get(name)

    def list_procedures(self) -> List[str]:
        return sorted(self.procedures.keys())

    def get_summary(self) -> Dict:
        return {
            "total_procedures": len(self.procedures),
            "procedures": {
                k: {
                    "sig": v.sig,
                    "body_len": v.body_len,
                    "calls_tables": v.calls_tables,
                    "calls_globals": v.calls_globals,
                    "calls_other": v.calls_other_procs[:10]  # first 10
                }
                for k, v in self.procedures.items()
            }
        }
