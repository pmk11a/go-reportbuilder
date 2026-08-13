# Geometry Spec — How `.fr3` Layout Maps to Web CSS

This is the single source of truth for converting FastReport VCL
coordinates into web (Vue + dompdf) layout. Any change here MUST be
mirrored in both `fe-fitur/composables/useFr3Geometry.ts` and
`be-fitur/app/Http/Controllers/ReportRenderController.php`.

## Units

All coordinates in `.fr3` are stored in **1/100 mm**, with a comma as
decimal separator (Delphi convention). Examples:

| `.fr3` raw | Real value |
|---|---|
| `Width="210"` | 2.10 mm |
| `Left="86,92919"` | 0.8693 mm |
| `Top="204,09462"` | 2.0409 mm |

`extract_geometry.py` already converts to float mm.

Font height is stored as **1/20 point** (integer, often negative). Example:
`Font.Height="-11"` → 11pt. Already exposed as `font.size_pt`.

## Paper setup

| `.fr3` attribute | Web equivalent |
|---|---|
| `PaperSize` | `paper_size_code` (1=Letter, 5=Legal, 9=A4, 256=Custom/Folio) |
| `PaperWidth` / `PaperHeight` | `PaperWidth_mm` / `PaperHeight_mm` |
| `LeftMargin` / `RightMargin` / `TopMargin` / `BottomMargin` | Canvas `padding` |
| `Columns` | Multi-column layout (mostly 1; rarely 2 for Nota) |

`Orientation` is derived: `landscape` if width > height.

## Per-cell mapping

| `.fr3` attribute | CSS property |
|---|---|
| `Left` | `left: <v>mm` |
| `Top` | `top: <v>mm` |
| `Width` | `width: <v>mm` |
| `Height` | `height: <v>mm` |
| `Font.Name` | `font-family: "<name>"` |
| `Font.Height` (abs) | `font-size: <v>pt` |
| `Font.Style` bit 0 (1) | `font-weight: bold` |
| `Font.Style` bit 1 (2) | `font-style: italic` |
| `Font.Style` bit 2 (4) | `text-decoration: underline` |
| `HAlign` (`haLeft`/`haCenter`/`haRight`) | `text-align` |
| `VAlign` (`vTop`/`vCenter`/`vBottom`) | `vertical-align` |
| `Frame.Typ > 0` | `border: <width>mm solid <color>` |
| `Frame.Width` | `border-width` |
| `Frame.Color` | `border-color` (numeric; convert to hex) |
| `SuppressRepeated=True` | Cell skipped if value equals previous row |

## Bands — render order

The FastReport band engine prints in this order (top to bottom per page):

1. `PageHeader` — top of every page
2. `GroupHeader` (one per group, in `group_level` order)
3. `MasterData` — repeated per row
4. `GroupFooter` (one per group, in reverse order)
5. `Footer` / `ReportSummary` — end of report
6. `PageFooter` — bottom of every page

Web render equivalents:

| Band | Web pattern |
|---|---|
| `PageHeader`, `PageFooter` | Fixed position in canvas (relative to page) |
| `MasterData` | v-for over rows |
| `GroupHeader`, `GroupFooter` | Conditional v-if + computed position |
| `Footer`, `ReportSummary` | Rendered after last `MasterData` row |

## dompdf limitations (THE IMPORTANT PART)

dompdf does **not** support:

- flexbox, grid, CSS variables
- media queries
- `vh`/`vw`/`%` for absolute positioning
- many `:not` / `:has` selectors

Always emit **explicit `mm`** values, never relative. `box-sizing: border-box`
is mandatory so border width does not push content out of bounds.

## Escape rules

`.fr3` attribute values may contain unescaped `&`, `<`, `>` from PascalScript
(e.g. `if A < B`). `extract_geometry.py` already encodes these to `&amp;`,
`&lt;`, `&gt;` on read. When emitting HTML/CSS, **always**
`htmlspecialchars($value, ENT_QUOTES)` to avoid XSS via report titles
(DB allows free text).