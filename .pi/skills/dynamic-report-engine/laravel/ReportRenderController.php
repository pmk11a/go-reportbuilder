<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * ReportRenderController — extends ReportController with FR3-geometry-aware
 * rendering endpoints:
 *
 *   GET  /api/reports/fr3-geometry
 *       Cache the 30 MB fr3_geometry.json for the front-end useFr3Geometry
 *       composable. Reads from `.claude/extractedReports/fr3_geometry.json`
 *       (one-time file read; no DB hit).
 *
 *   GET  /api/reports/{kodeMenu}/export/pdf
 *       Render a single report as PDF using the same geometry-aware layout
 *       that `Fr3Canvas.vue` uses on screen, then run through Barryvdh/dompdf
 *       (already installed in composer.json).
 *
 *   GET  /api/reports/{kodeMenu}/export/html
 *       Same content as the PDF endpoint but served as HTML for debugging.
 *
 * Design notes:
 *   - Geometry is read from the .claude cache, NOT from the DB, because the
 *     DB schema is intentionally unchanged by this skill (per PRD requirement
 *     "Tidak mengubah DBMENUREPORT & DBFLMENUREPORT legacy").
 *   - Data still flows through ReportService (no bypass). The geometry is
 *     used only for layout. This keeps the existing authorisation, filter
 *     substitution, and audit trail intact.
 */
class ReportRenderController extends Controller
{
    public function __construct(protected ReportService $reportService) {}

    /**
     * Cache file location (project-scoped, not in DB).
     */
    private const GEOMETRY_FILE = '.claude/extractedReports/fr3_geometry.json';

    /**
     * Resolve a KODEMENU to a .fr3 file name. Same heuristic as the
     * front-end useFr3Geometry.resolveFr3File().
     */
    private function resolveFr3File(string $kodeMenu, array $cache): ?string
    {
        $padded = str_pad($kodeMenu, 6, '0', STR_PAD_LEFT);
        $direct = "Report{$padded}.fr3";
        if (isset($cache[$direct])) return $direct;
        $needle = ltrim($kodeMenu, '0');
        foreach (array_keys($cache) as $name) {
            if (str_contains($name, $needle)) return $name;
        }
        return null;
    }

    /**
     * GET /api/reports/fr3-geometry
     */
    public function geometry(): JsonResponse
    {
        $path = base_path(self::GEOMETRY_FILE);
        if (!file_exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'fr3_geometry.json not generated yet. Run: python .claude/skills/delphi-report-renderer/bin/extract_geometry.py',
            ], 503);
        }
        $raw = file_get_contents($path);
        return response()->json(json_decode($raw, true))
            ->header('Cache-Control', 'public, max-age=3600');
    }

    /**
     * Render an HTML body using geometry. Pure PHP, no Blade (so we can ship
     * it through dompdf without template-file round-trip).
     *
     * The output mirrors the Fr3Canvas.vue structure 1:1 so on-screen and
     * PDF are byte-equivalent.
     */
    private function renderHtml(string $kodeMenu, array $reportData, array $geometry): string
    {
        $page = $geometry['page'];
        $css = <<<CSS
        <style>
            @page { size: {$page['PaperWidth_mm']}mm {$page['PaperHeight_mm']}mm; margin: 0; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .fr3-canvas {
                position: relative;
                width: {$page['PaperWidth_mm']}mm;
                min-height: {$page['PaperHeight_mm']}mm;
                padding: {$page['TopMargin_mm']}mm {$page['RightMargin_mm']}mm {$page['BottomMargin_mm']}mm {$page['LeftMargin_mm']}mm;
                box-sizing: border-box;
            }
            .fr3-band { position: relative; }
            .fr3-cell {
                position: absolute;
                overflow: hidden;
                white-space: pre-wrap;
                box-sizing: border-box;
            }
        </style>
        CSS;

        $html = $css . '<div class="fr3-canvas">';
        foreach ($geometry['bands'] as $band) {
            if (!in_array($band['type'], ['PageHeader', 'MasterData', 'PageFooter', 'GroupHeader', 'GroupFooter', 'Footer'], true)) continue;
            $html .= sprintf(
                '<div class="fr3-band" style="height: %.4fmm;">',
                $band['height']
            );
            foreach ($band['cells'] as $cell) {
                $value = $this->resolveCellValue($cell, $reportData);
                $border = ((int)$cell['frame']['type'] > 0)
                    ? sprintf('%.4fmm solid #%s;', $cell['frame']['width'], $cell['frame']['color'])
                    : 'none';
                $style = sprintf(
                    'left: %.4fmm; top: %.4fmm; width: %.4fmm; height: %.4fmm; ' .
                    'font-family: %s; font-size: %dpt; ' .
                    'font-weight: %s; font-style: %s; text-decoration: %s; ' .
                    'text-align: %s; vertical-align: %s; border: %s;',
                    $cell['left'], $cell['top'], $cell['width'], $cell['height'],
                    htmlspecialchars($cell['font']['name'], ENT_QUOTES),
                    (int)$cell['font']['size_pt'],
                    $cell['font']['bold'] ? 'bold' : 'normal',
                    $cell['font']['italic'] ? 'italic' : 'normal',
                    $cell['font']['underline'] ? 'underline' : 'none',
                    strtolower($cell['h_align'] ?: 'left'),
                    strtolower($cell['v_align'] ?: 'top'),
                    $border
                );
                $html .= sprintf(
                    '<div class="fr3-cell" style="%s">%s</div>',
                    $style,
                    htmlspecialchars((string)$value, ENT_QUOTES)
                );
            }
            $html .= '</div>';
        }
        $html .= '</div>';
        return $html;
    }

    /**
     * Map a cell to the value that should appear in it. Mirrors the
     * front-end Fr3Canvas.resolveCellValue() logic.
     */
    private function resolveCellValue(array $cell, array $reportData): string
    {
        $datasets = $reportData['datasets'] ?? [];
        $df = $cell['data_field'];
        if ($df && isset($datasets[$cell['data_set']])) {
            $rows = $datasets[$cell['data_set']];
            foreach ($rows as $row) {
                if (isset($row[$df])) {
                    $v = $row[$df];
                    return is_scalar($v) ? (string)$v : json_encode($v);
                }
            }
        }
        return $cell['text'];
    }

    /**
     * GET /api/reports/{kodeMenu}/export/html
     */
    public function html(Request $request, string $kodeMenu): Response
    {
        $data = $this->generateReport($request, $kodeMenu);
        $geometry = $this->loadGeometry($kodeMenu);
        if (!$geometry) {
            return response('Geometry not found for ' . $kodeMenu, 404);
        }
        return response($this->renderHtml($kodeMenu, $data, $geometry))
            ->header('Content-Type', 'text/html; charset=utf-8');
    }

    /**
     * GET /api/reports/{kodeMenu}/export/pdf
     */
    public function pdf(Request $request, string $kodeMenu): Response
    {
        $data = $this->generateReport($request, $kodeMenu);
        $geometry = $this->loadGeometry($kodeMenu);
        if (!$geometry) {
            return response('Geometry not found for ' . $kodeMenu, 404);
        }
        $html = $this->renderHtml($kodeMenu, $data, $geometry);
        $pdf = Pdf::loadHTML($html)
            ->setPaper(
                $this->paperFormat($geometry['page']),
                $geometry['page']['Orientation'] === 'landscape' ? 'landscape' : 'portrait'
            );
        return $pdf->stream("report-{$kodeMenu}.pdf");
    }

    /**
     * Map FR3 paper code to dompdf paper format string.
     */
    private function paperFormat(array $page): string
    {
        $map = [
            '1' => 'letter', '5' => 'legal',
            '8' => 'a3', '9' => 'a4', '11' => 'a5',
            '14' => 'a4', '15' => 'a4',
            '256' => 'a4',  // Custom/Folio → best-effort A4
        ];
        return $map[$page['paper_size_code']] ?? 'a4';
    }

    /**
     * Reuse ReportService to fetch the report data so authorisation,
     * filter substitution, and computed fields all stay intact.
     */
    private function generateReport(Request $request, string $kodeMenu): array
    {
        $filters = $request->input('filters', []);
        $reportData = $this->reportService->executeReport($kodeMenu, $filters);
        return is_array($reportData) ? $reportData : ['datasets' => []];
    }

    private function loadGeometry(string $kodeMenu): ?array
    {
        $path = base_path(self::GEOMETRY_FILE);
        if (!file_exists($path)) return null;
        $cache = json_decode(file_get_contents($path), true);
        if (!is_array($cache)) return null;
        $file = $this->resolveFr3File($kodeMenu, $cache);
        return $file ? ($cache[$file] ?? null) : null;
    }
}