"""
Agent Orchestrator - Main controller for Delphi-to-Laravel conversion.

Coordinates:
- Scanner: extract form info from Delphi files
- Analyzer: match form patterns
- Generator: produce Laravel/Nuxt files
- Validator: ensure completeness
"""

import json
import os
from pathlib import Path
from datetime import datetime


class AgentOrchestrator:
    """Main orchestrator that runs the complete conversion pipeline."""

    DELPHI_SOURCE_ROOT = r"D:\fiturlaporan\MyProject"
    TARGET_LARAVEL = r"D:\fiturlaporan\be-fitur"
    TARGET_NUXT = r"D:\fiturlaporan\fe-fitur"
    OUTPUT_DIR = r"D:\fiturlaporan\agent-converter\output"
    RULES_DIR = r"D:\fiturlaporan\agent-converter\rules"
    TEMPLATE_DIR = r"D:\fiturlaporan\agent-converter\templates"

    FORM_PATTERNS = ["MASTER", "TRANSACTION", "LOOKUP", "SETTING", "REPORT"]
    CATEGORIES = ["purchase", "sales", "production", "inventory", "master", "kas_bank", "accounting", "report"]

    def __init__(self, delphi_source=None, target_laravel=None, target_nuxt=None, output_dir=None):
        if delphi_source:
            self.DELPHI_SOURCE_ROOT = delphi_source
        if target_laravel:
            self.TARGET_LARAVEL = target_laravel
        if target_nuxt:
            self.TARGET_NUXT = target_nuxt
        if output_dir:
            self.OUTPUT_DIR = output_dir

        self._menu_mapping = self._load_menu_mapping()
        self._conversion_results = []
        self._errors = []

    def _load_menu_mapping(self):
        mapping_file = os.path.join(self.RULES_DIR, "menu-mapping.json")
        if os.path.exists(mapping_file):
            with open(mapping_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def discover_delphi_forms(self):
        frm_files = []
        for dirpath, _, filenames in os.walk(self.DELPHI_SOURCE_ROOT):
            for fn in filenames:
                if fn.endswith(".pas"):
                    full_path = os.path.join(dirpath, fn)
                    basename = os.path.basename(fn)
                    # Skip main/utility files
                    skip_names = [
                        "FrmUtama.pas", "FrmLogin.pas", "FrmPaswd.pas",
                        "MyProcedure.pas", "MyModul.pas", "MyGlobal.pas",
                        "FrmBrows.pas", "FrmMenuReport.pas", "FrmReportPreview.pas",
                        "FrmKonfigurasi.pas", "FrmUpdate.pas",
                    ]
                    if basename in skip_names:
                        continue
                    frm_files.append(full_path)
        return sorted(frm_files)

    def run_full_scan(self, max_files: int | None = None):
        # Import lazily so this module remains importable even if scanners
        # are missing in the deployment (e.g. when used only for reporting).
        try:
            from scanners.delphi_frm_scanner import DelphiFrmScanner
        except ImportError:
            # Fallback: when running directly as a script, add src/ to path.
            import sys
            from pathlib import Path
            _src = Path(__file__).resolve().parent
            if str(_src) not in sys.path:
                sys.path.insert(0, str(_src))
            from scanners.delphi_frm_scanner import DelphiFrmScanner  # type: ignore

        frm_files = self.discover_delphi_forms()
        if max_files is not None:
            frm_files = frm_files[:max_files]
        scanner = DelphiFrmScanner()

        results = {
            "total_forms": len(frm_files),
            "scanned": 0,
            "forms": [],
            "errors": [],
            "summary": {
                "tables_referenced": set(),
                "queries_referenced": set(),
                "components_total": 0,
                "click_handlers_total": 0,
            },
        }

        for filepath in frm_files:
            try:
                analysis = scanner.analyze_file(filepath)
                summary = scanner.get_summary(analysis)
                results["forms"].append(summary)
                results["scanned"] += 1
                results["summary"]["components_total"] += summary.get("components_count", 0)
                results["summary"]["click_handlers_total"] += len(summary.get("click_handlers", []))
                results["summary"]["tables_referenced"].update(summary.get("table_refs", []))
                results["summary"]["queries_referenced"].update(summary.get("query_refs", []))
            except Exception as e:
                results["errors"].append({"file": filepath, "error": str(e)})

        results["summary"]["tables_referenced"] = sorted(results["summary"]["tables_referenced"])
        results["summary"]["queries_referenced"] = sorted(results["summary"]["queries_referenced"])
        return results

    def generate_agent_report(self, results):
        os.makedirs(os.path.join(self.OUTPUT_DIR, "reports"), exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        report_file = os.path.join(self.OUTPUT_DIR, "reports", f"agent-report-{ts}.json")
        with open(report_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, default=str)

        summary_file = report_file.replace(".json", "-summary.md")
        with open(summary_file, "w", encoding="utf-8") as f:
            f.write("# Agent Conversion Report\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"Total Forms Discovered: {results['total_forms']}\n")
            f.write(f"Forms Scanned: {results['scanned']}\n")
            f.write(f"Errors: {len(results['errors'])}\n\n")
            f.write("## Form Summaries\n\n")
            for form_result in results["forms"][:30]:
                f.write(f"### {form_result.get('unit', 'Unknown')}\n")
                f.write(f"- Inherits: {form_result.get('inherits_from', '')}\n")
                f.write(f"- Components: {form_result.get('components_count', 0)}\n")
                f.write(f"- Click Handlers: {', '.join(form_result.get('click_handlers', []))[:200]}\n")
                f.write(f"- Tables: {', '.join(form_result.get('table_refs', []))[:200]}\n\n")

        return report_file, summary_file

    def run_conversion_pipeline(self):
        print("Agent Orchestrator running...")
        results = self.run_full_scan()
        report_file, summary_file = self.generate_agent_report(results)
        print(f"Report: {report_file}")
        print(f"Forms analyzed: {results['scanned']}")
        print(f"Tables found: {len(results['summary']['tables_referenced'])}")
        return {"status": "ready", "report": report_file, "summary": summary_file, "scanned": results["scanned"]}
