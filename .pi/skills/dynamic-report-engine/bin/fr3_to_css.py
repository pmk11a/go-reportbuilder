#!/usr/bin/env python3
"""
fr3_to_css.py — convert fr3_geometry.json per-band dict to inline CSS string
for one cell. Used by both PHP (ReportRenderController::renderHtml) and any
Nuxt-side rendering path that wants the same byte-equivalent CSS.

Why a separate helper:
  - Dompdf's CSS support is limited (no flexbox, no grid, no media queries).
    We hardcode the safe subset here so both back-end (PHP) and front-end
    (Vue/TS) stay in sync.
  - Front-end can import the spec as a JSON file; back-end has its own
    mirror in PHP. Keeping one canonical Python source prevents drift.

Usage:
  python fr3_to_css.py --file ReportKasHarian.fr3 --cell Memo9
  python fr3_to_css.py --file ReportKasHarian.fr3 --emit-style-map
"""

from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

# dompdf-safe subset (mirror in ReportRenderController::renderHtml).
SAFE_FONT_WEIGHT = {"normal", "bold"}
SAFE_FONT_STYLE = {"normal", "italic"}
SAFE_TEXT_ALIGN = {"left", "right", "center", "justify"}
SAFE_VERTICAL_ALIGN = {"top", "middle", "bottom"}


def cell_to_css(cell: dict) -> str:
    """Return one CSS declaration block string for a single .fr3 cell."""
    f = cell["font"]
    border = (
        f"{cell['frame']['width']}mm solid #{cell['frame']['color']}"
        if int(cell.get("frame", {}).get("type", 0)) > 0
        else "none"
    )
    align = (cell.get("h_align") or "left").lower()
    valign = (cell.get("v_align") or "top").lower()
    if align not in SAFE_TEXT_ALIGN:
        align = "left"
    if valign not in SAFE_VERTICAL_ALIGN:
        valign = "top"
    decls = [
        f"position: absolute",
        f"left: {cell['left']:.4f}mm",
        f"top: {cell['top']:.4f}mm",
        f"width: {cell['width']:.4f}mm",
        f"height: {cell['height']:.4f}mm",
        f"font-family: \"{f['name']}\"",
        f"font-size: {int(f['size_pt'])}pt",
        f"font-weight: {'bold' if f.get('bold') else 'normal'}",
        f"font-style: {'italic' if f.get('italic') else 'normal'}",
        f"text-decoration: {'underline' if f.get('underline') else 'none'}",
        f"text-align: {align}",
        f"vertical-align: {valign}",
        f"border: {border}",
        "overflow: hidden",
        "white-space: pre-wrap",
        "box-sizing: border-box",
    ]
    return "; ".join(decls) + ";"


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--geometry",
                   default="D:/TestLaB/piagent/.claude/extractedReports/fr3_geometry.json")
    p.add_argument("--file", help="e.g. ReportKasHarian.fr3 (required unless --emit-style-map)")
    p.add_argument("--cell", help="e.g. Memo9 (required unless --emit-style-map)")
    p.add_argument("--emit-style-map", action="store_true",
                   help="write cell → CSS map for the chosen file")
    args = p.parse_args()

    cache = json.loads(Path(args.geometry).read_text(encoding="utf-8"))
    if not args.file:
        print("ERROR: --file required", file=sys.stderr)
        return 2
    geom = cache.get(args.file)
    if not geom:
        print(f"ERROR: {args.file} not in geometry cache", file=sys.stderr)
        return 1

    if args.emit_style_map:
        out = {}
        for band in geom["bands"]:
            for cell in band["cells"]:
                out[cell["name"]] = cell_to_css(cell)
        out_path = Path(f"outputs/style_map_{args.file}.json")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(out, indent=2), encoding="utf-8")
        print(f"wrote {out_path} ({len(out)} cells)")
        return 0

    if not args.cell:
        print("ERROR: --cell required (or use --emit-style-map)", file=sys.stderr)
        return 2
    for band in geom["bands"]:
        for cell in band["cells"]:
            if cell["name"] == args.cell:
                print(cell_to_css(cell))
                return 0
    print(f"ERROR: cell {args.cell} not found in {args.file}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())