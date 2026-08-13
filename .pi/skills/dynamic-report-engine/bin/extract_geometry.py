#!/usr/bin/env python3
"""
extract_geometry.py — extend extract_fr3.py to extract ABSOLUTE geometry per cell.

Why: Generic Vue <table> Tailwind renderer cannot match .fr3 exactly (font,
position, page size, multi-column, conditional styling). This script extracts
per-cell geometry (Left/Top/Width/Height in mm + Font + DisplayFormat + Frame)
so the Vue canvas can re-position cells with inline CSS to 1:1 match.

Inputs:
  --fr3-dir   D:/TestLaB/piagent/Bca/ReportFiles
  --output    D:/TestLaB/piagent/.claude/extractedReports/fr3_geometry.json

Output JSON shape (per .fr3 file):
  {
    "ReportKasHarian.fr3": {
      "page": { "PaperWidth": "210", "PaperHeight": "297", "Orientation": "portrait",
                "LeftMargin": "10", "RightMargin": "10", "TopMargin": "10", "BottomMargin": "10",
                "Columns": 1, "ColumnWidth": "0", "ColumnPositions": "" },
      "bands": [
        {
          "type": "PageHeader",
          "name": "PageHeader1",
          "height_mm": 41.5,
          "left": 0, "top": 9.4, "width": 359.0,
          "cells": [
            {
              "tag": "TfrxMemoView",
              "name": "Memo9",
              "text": "Laporan Customer Sales ",
              "data_field": null,           # static label
              "left": 0, "top": 18.9, "width": 109.6, "height": 9.4,
              "font": { "name": "Arial", "size": 16, "bold": true, "italic": false,
                        "color": "black", "charset": 1 },
              "align": "left", "v_align": "top",
              "display_format": { "type": null, "decimal_sep": null },
              "frame": { "type": 0, "width": 0, "color": "black", "style": 0 }
            },
            ...
          ]
        },
        { "type": "MasterData", "name": "MasterData1", ... }
      ],
      "expression_self_test": {
        "footer1_onscript": "begin ... end"    # optional PascalScript body
      }
    },
    ...
  }

Determinism: script-only, no LLM, no hand-tuning. Re-runnable.
"""

from __future__ import annotations
import argparse
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

# ---------- attribute name → mapping ----------

# Pascal mm/100 are stored as comma-decimal: "18,89765" means 0.1889765 mm.
# Some attributes use comma, some dot. Normalise to float mm.
def to_mm(s: str | None) -> float:
    if not s:
        return 0.0
    s = str(s).replace(",", ".").strip()
    try:
        return float(s)
    except ValueError:
        return 0.0


def to_int(s: str | None, default: int = 0) -> int:
    if not s:
        return default
    try:
        return int(s)
    except ValueError:
        try:
            return int(float(s))
        except ValueError:
            return default


def to_bool(s: str | None) -> bool:
    if not s:
        return False
    return s.strip() in ("1", "True", "true")


# ---------- PaperSize code → description (mirrors Delphi FR3) ----------
PAPER_SIZE_MAP = {
    "0": "Default", "1": "Letter", "2": "LetterSmall", "3": "Tabloid",
    "4": "Ledger", "5": "Legal", "6": "Statement", "7": "Executive",
    "8": "A3", "9": "A4", "10": "A4Small", "11": "A5", "12": "B4",
    "13": "B5", "14": "A4Landscape", "15": "A4SmallLandscape",
    "16": "A5Landscape", "17": "B4Landscape", "18": "B5Landscape",
    "256": "Custom/Folio",
}

# DisplayFormat encoding in .fr3 is opaque numeric (FastReport internal).
# We surface only "DisplayFormat.DecimalSeparator" + the numeric kind if detectable.
def parse_display_format(node: ET.Element) -> dict:
    return {
        "kind": node.get("DisplayFormat.Kind", ""),
        "decimal_sep": node.get("DisplayFormat.DecimalSeparator", ""),
        "format_str": node.get("DisplayFormat.FormatStr", ""),
    }


# ---------- Cell extraction ----------

BAND_TAGS = ("TfrxPageHeader", "TfrxPageFooter", "TfrxMasterData",
             "TfrxGroupHeader", "TfrxGroupFooter", "TfrxHeader",
             "TfrxFooter", "TfrxReportSummary")

CELL_TAGS = ("TfrxMemoView", "TfrxTextView", "TfrxCheckBoxView",
             "TfrxLineView", "TfrxShapeView")


def parse_font(node: ET.Element) -> dict:
    name = node.get("Font.Name", "") or node.get("Font.Name", "Arial")
    size_raw = node.get("Font.Height", "")
    # FR Font.Height is negative, in 1/100 of point? No — it's in 1/20 pt units.
    # Common: Font.Height=-11 means 11px? Empirically DELPHI stored as 1/20 pt.
    # After review: FastReport stores as -20*pt. Negative is integer but absolute
    # value is in point * 1 (so -11 → 11pt). We expose `size_pt` directly.
    try:
        size_abs = abs(int(size_raw)) if size_raw else 10
    except ValueError:
        size_abs = 10
    style_raw = node.get("Font.Style", "0")
    try:
        style = int(style_raw) if style_raw else 0
    except ValueError:
        style = 0
    return {
        "name": name,
        "size_pt": size_abs,
        "bold": bool(style & 1),
        "italic": bool(style & 2),
        "underline": bool(style & 4),
        "strikeout": bool(style & 8),
        "color": node.get("Font.Color", "0"),
        "charset": to_int(node.get("Font.Charset", "1"), 1),
    }


def parse_frame(node: ET.Element) -> dict:
    try:
        ftype = int(node.get("Frame.Typ", "0") or 0)
    except ValueError:
        ftype = 0
    return {
        "type": ftype,            # 0=none, 15=box, etc.
        "width": to_mm(node.get("Frame.Width", "0")),
        "color": node.get("Frame.Color", "0"),
        "style": to_int(node.get("Frame.Style", "0"), 0),
        "dash": to_int(node.get("Frame.Dash", "0"), 0),
    }


def parse_cell(node: ET.Element, tag: str) -> dict | None:
    if tag not in CELL_TAGS:
        return None
    text = node.get("Text", "") or ""
    # Static labels may have [bracketedField] — surface both
    data_field = node.get("DataField") or None
    # Some .fr3 files use hidden DataField populated by code (OnBeforePrint).
    return {
        "tag": tag,
        "name": node.get("Name", ""),
        "text": text,
        "data_field": data_field,
        "data_set": node.get("DataSet", ""),
        "left": to_mm(node.get("Left", "0")),
        "top": to_mm(node.get("Top", "0")),
        "width": to_mm(node.get("Width", "0")),
        "height": to_mm(node.get("Height", "0")),
        "font": parse_font(node),
        "h_align": node.get("HAlign", ""),
        "v_align": node.get("VAlign", ""),
        "suppress_repeated": to_bool(node.get("SuppressRepeated", "")),
        "display_format": parse_display_format(node),
        "frame": parse_frame(node),
        "parent_font": to_bool(node.get("ParentFont", "")),
    }


def parse_band(node: ET.Element) -> dict:
    cells: list[dict] = []
    for child in node:
        ctag = child.tag
        cell = parse_cell(child, ctag)
        if cell:
            cells.append(cell)
    return {
        "type": node.tag.replace("Tfrx", ""),
        "name": node.get("Name", ""),
        "height": to_mm(node.get("Height", "0")),
        "left": to_mm(node.get("Left", "0")),
        "top": to_mm(node.get("Top", "0")),
        "width": to_mm(node.get("Width", "0")),
        "condition": node.get("Condition", ""),
        "data_set": node.get("DataSet", ""),
        "row_count": to_int(node.get("RowCount", "0")),
        "cells": cells,
    }


def parse_page_setup(root: ET.Element) -> dict:
    page = root.find(".//TfrxReportPage")
    if page is None:
        page = root.find(".//TfrxDMPPage")
    if page is None:
        return {"paper_size_code": "9", "paper_size_name": "A4",
                "PaperWidth_mm": 210.0, "PaperHeight_mm": 297.0,
                "Orientation": "portrait", "Columns": 1}
    pw = to_mm(page.get("PaperWidth", "210"))
    ph = to_mm(page.get("PaperHeight", "297"))
    code = page.get("PaperSize", "9")
    return {
        "paper_size_code": code,
        "paper_size_name": PAPER_SIZE_MAP.get(code, "Custom"),
        "PaperWidth_mm": pw,
        "PaperHeight_mm": ph,
        "Orientation": "landscape" if pw > ph else "portrait",
        "LeftMargin_mm": to_mm(page.get("LeftMargin", "0")),
        "RightMargin_mm": to_mm(page.get("RightMargin", "0")),
        "TopMargin_mm": to_mm(page.get("TopMargin", "0")),
        "BottomMargin_mm": to_mm(page.get("BottomMargin", "0")),
        "Columns": to_int(page.get("Columns", "1"), 1),
        "ColumnWidth_mm": to_mm(page.get("ColumnWidth", "0")),
        "ColumnPositions": page.get("ColumnPositions.Text", ""),
    }


# ---------- PascalScript extraction ----------
SCRIPT_RE = re.compile(r'ScriptText\.Text="([^"]+)"', re.DOTALL)
PAS_UNESCAPE = {"&#34;": '"', "&#10;": "\n", "&#13;": "\r",
                "&amp;": "&", "&lt;": "<", "&gt;": ">",
                "&apos;": "'", "&quot;": '"'}


def decode_xml_attr(s: str) -> str:
    out = s
    for k, v in PAS_UNESCAPE.items():
        out = out.replace(k, v)
    # numeric entities
    out = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), out)
    return out


def extract_pascal_script(root: ET.Element) -> str | None:
    # Easy: scan XML-as-string for the canonical ScriptText attribute. .fr3 is
    # small enough that string-scan beats re-serialising ElementTree.
    xml = ET.tostring(root, encoding="unicode")
    m = SCRIPT_RE.search(xml)
    if not m:
        return None
    return decode_xml_attr(m.group(1))


# ---------- Top-level parse ----------

# ---------- XML sanitisation ----------

# Some .fr3 files embed PascalScript with literal `<`, `>` inside attribute
# values (e.g. comparisons `if A < B`). ET.parse rejects these. We pre-clean
# by walking raw bytes and escaping offending chars within attribute strings
# only. Limit scope to attribute values (between `"..."`).
_ATTR_ESCAPE_RE = re.compile(r'="([^"]*?)"')


def _clean_xml_text(raw: bytes) -> bytes:
    try:
        # Cheap probe — if it already parses, no need to touch.
        ET.fromstring(raw)
        return raw
    except ET.ParseError:
        pass
    # Walk attribute values and replace `<` `>` with entities. This is best-
    # effort; FastReport tolerates the entity form on read-back.
    txt = raw.decode("utf-8", errors="replace")

    def _fix(m: re.Match) -> str:
        v = m.group(1)
        # Escape bare `&` that isn't already a valid entity
        v = re.sub(r"&(?!(?:amp|lt|gt|quot|apos|#\d+);)", "&amp;", v)
        v = v.replace("<", "&lt;").replace(">", "&gt;")
        return '="' + v + '"'

    cleaned = _ATTR_ESCAPE_RE.sub(_fix, txt)
    return cleaned.encode("utf-8")


def parse_fr3(filepath: Path) -> dict | None:
    try:
        raw = filepath.read_bytes()
    except OSError as e:
        print(f"  read-error {filepath.name}: {e}", file=sys.stderr)
        return None
    try:
        root = ET.fromstring(_clean_xml_text(raw))
    except ET.ParseError as e:
        print(f"  parse-error {filepath.name}: {e}", file=sys.stderr)
        return None

    # Bands can live directly under <TfrxReport> (rare) OR nested under each
    # <TfrxReportPage> (the Delphi/VCL FastReport layout). We must iterate ALL
    # occurrences since one .fr3 may have several pages, plus a `<TfrxDataPage>`
    # whose bands are not page-bound.
    bands: list[dict] = []
    seen_bands: set[str] = set()
    for node in root.iter():
        # Skip virtual data-page bands (not part of any printable page).
        # DataPage has no `<TfrxReportPage>` ancestor in our case.
        ancestors = list(root.iter())
        # `node.iter()` traverses ALL descendants; we use the iteration to find
        # BAND_TAGS only inside TfrxReportPage. Use `parent` map:
        parent_map = {child: parent for parent in root.iter() for child in parent}
        if node.tag in BAND_TAGS:
            # Skip bands whose ancestor includes TfrxReportPage for the print page.
            cur = parent_map.get(node)
            inside_report_page = False
            while cur is not None:
                if cur.tag == "TfrxReportPage":
                    inside_report_page = True
                    break
                cur = parent_map.get(cur)
            if inside_report_page:
                parsed = parse_band(node)
                # de-dupe by band Name+Type (multi-page case duplicates)
                key = f"{parsed['type']}:{parsed['name']}"
                if key not in seen_bands:
                    seen_bands.add(key)
                    bands.append(parsed)

    return {
        "file": filepath.name,
        "page": parse_page_setup(root),
        "bands": bands,
        "pascal_script": extract_pascal_script(root),
    }


# ---------- main ----------

def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--fr3-dir", default="D:/TestLaB/piagent/Bca/ReportFiles")
    p.add_argument("--output", default="D:/TestLaB/piagent/.claude/extractedReports/fr3_geometry.json")
    p.add_argument("--limit", type=int, default=0, help="Process only first N (for smoke test)")
    args = p.parse_args()

    fr3_dir = Path(args.fr3_dir)
    out_path = Path(args.output)
    if not fr3_dir.is_dir():
        print(f"ERROR: {fr3_dir} not a directory", file=sys.stderr)
        return 2

    results: dict[str, dict] = {}
    files = sorted(fr3_dir.glob("*.fr3"))
    if args.limit:
        files = files[: args.limit]

    n_ok = 0
    n_err = 0
    for f in files:
        data = parse_fr3(f)
        if data is None:
            n_err += 1
            continue
        results[f.name] = data
        n_ok += 1

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=2, ensure_ascii=False)

    print(f"OK: {n_ok} parsed, {n_err} errors, written to {out_path}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
