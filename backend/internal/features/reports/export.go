package reports

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"
	"github.com/xuri/excelize/v2"
)

// ============================================================================
// Export Configuration
// ============================================================================

// SExportConfig holds parameters for generating an export.
type SExportConfig struct {
	KodeMenu   string
	Filters    map[string]interface{}
	UserID     string
	FormatType string // "xlsx", "pdf", "csv"
	PaperSize  string // "a4", "a5", "letter"
	Orientation string // "portrait", "landscape"
}

// SExportResult holds the bytes of a generated export.
type SExportResult struct {
	MimeType string
	Filename string
	Content  []byte
}

// ============================================================================
// Export Repository Interface (read-only)
// ============================================================================

// IReportExportRepository defines the data access contract for export generation.
// It only exposes read methods so the export handler cannot mutate reports.
type IReportExportRepository interface {
	GetReportByKodeMenu(ctx context.Context, kodeMenu string) (*SDBMasterLaporan, error)
	GetDatasets(ctx context.Context, idLaporan int) ([]SDBQueryLaporan, error)
	GetAllColumns(ctx context.Context, idLaporan int) (map[string][]SDBKolomLaporan, error)
	ExecuteQuery(ctx context.Context, sql string, filters map[string]interface{}, userId string) ([]map[string]interface{}, error)
}

// ============================================================================
// XLSX Export
// ============================================================================

// GenerateXLSX creates an Excel workbook with per-sheet data and formatted cells.
func GenerateXLSX(ctx context.Context, svc any, repo IReportExportRepository, cfg SExportConfig) (*SExportResult, error) {
	// Fetch report
	report, err := repo.GetReportByKodeMenu(ctx, cfg.KodeMenu)
	if err != nil {
		return nil, fmt.Errorf("report not found: %w", err)
	}
	if report == nil {
		return nil, fmt.Errorf("report %s not found", cfg.KodeMenu)
	}

	// Fetch datasets
	datasets, err := repo.GetDatasets(ctx, report.IDLaporan)
	if err != nil {
		return nil, fmt.Errorf("failed to get datasets: %w", err)
	}

	// Fetch columns
	columnsMap, err := repo.GetAllColumns(ctx, report.IDLaporan)
	if err != nil {
		return nil, fmt.Errorf("failed to get columns: %w", err)
	}

	// Execute each dataset
	xl := excelize.NewFile()
	sheetIdx := 0
	for _, ds := range datasets {
		if !ds.Visible {
			continue
		}
		rows, err := repo.ExecuteQuery(ctx, ds.QuerySumberData, cfg.Filters, cfg.UserID)
		if err != nil {
			return nil, fmt.Errorf("query failed for %s: %w", ds.NamaDataset, err)
		}
		if len(rows) == 0 {
			continue
		}

		cols := columnsMap[ds.NamaDataset]
		sheetName := sanitizeSheetName(ds.NamaDataset)
		if sheetName == "" {
			sheetName = fmt.Sprintf("Sheet%d", sheetIdx)
		}

		idx, err := xl.NewSheet(sheetName)
		if err != nil {
			return nil, fmt.Errorf("failed to create sheet %s: %w", sheetName, err)
		}
		sheetIdx = idx

		// Write headers
		for i, col := range cols {
			label := col.LabelTampil
			if label == nil || *label == "" {
				label = &col.NamaKolom
			}
			cell, _ := excelize.CoordinatesToCellName(i+1, 1)
			xl.SetCellValue(sheetName, cell, *label)
		}

		// Write data rows with formatting
		for rowIdx, row := range rows {
			for colIdx, col := range cols {
				val := row[col.NamaKolom]
				cellName, _ := excelize.CoordinatesToCellName(colIdx+1, rowIdx+2)
				xl.SetCellValue(sheetName, cellName, formatCellForExport(val, col.FormatType))
			}
		}

		// Auto-fit columns
		for i := 0; i < len(cols); i++ {
			col, _ := excelize.ColumnNumberToName(i + 1)
			xl.SetColWidth(sheetName, col, col, 12)
		}
	}

	// Set active sheet
	if sheetIdx > 0 {
		xl.SetActiveSheet(sheetIdx)
	}

	var buf bytes.Buffer
	if err := xl.Write(&buf); err != nil {
		return nil, fmt.Errorf("failed to write xlsx: %w", err)
	}

	return &SExportResult{
		MimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		Filename: fmt.Sprintf("%s.xlsx", sanitizeFilename(report.NamaLaporan)),
		Content:  buf.Bytes(),
	}, nil
}

// ============================================================================
// PDF Export
// ============================================================================

// GeneratePDF creates a PDF with title band, table data, footer band, and signatures.
func GeneratePDF(ctx context.Context, svc any, repo IReportExportRepository, cfg SExportConfig) (*SExportResult, error) {
	// Fetch report
	report, err := repo.GetReportByKodeMenu(ctx, cfg.KodeMenu)
	if err != nil {
		return nil, fmt.Errorf("report not found: %w", err)
	}
	if report == nil {
		return nil, fmt.Errorf("report %s not found", cfg.KodeMenu)
	}

	// Parse footer bands
	var footerBands map[string]interface{}
	if report.FooterBands != nil && *report.FooterBands != "" {
		_ = json.Unmarshal([]byte(*report.FooterBands), &footerBands)
	}

	// Paper size
	paperW, paperH := paperDimensions(cfg.PaperSize, cfg.Orientation)

	// Create PDF
	size := "A4"
	switch cfg.PaperSize {
	case "a3":
		size = "A3"
	case "a5":
		size = "A5"
	case "letter":
		size = "Letter"
	case "legal":
		size = "Legal"
	case "tabloid":
		size = "Tabloid"
	}
	doc := fpdf.New(cfg.Orientation, "mm", size, "")
	doc.SetAutoPageBreak(true, 20)
	doc.AddPage()

	// Title band
	titleContent := ""
	if titleBand, ok := footerBands["title"]; ok {
		if tb, ok := titleBand.(map[string]interface{}); ok {
			if c, ok := tb["content"].(string); ok {
				titleContent = c
			}
		}
	}
	if titleContent == "" {
		titleContent = report.NamaLaporan
	}
	titleContent = substituteFooterParams(titleContent, cfg.Filters)

	titleAlign := "left"
	if titleBand, ok := footerBands["title"]; ok {
		if tb, ok := titleBand.(map[string]interface{}); ok {
			if a, ok := tb["align"].(string); ok {
				titleAlign = a
			}
		}
	}

	y := 15.0
	doc.SetFont("Helvetica", "B", 14)
	switch titleAlign {
	case "center":
		doc.CellFormat(paperW/2, 10, titleContent, "", 0, "C", false, 0, "")
	case "right":
		doc.CellFormat(paperW, 10, titleContent, "", 0, "R", false, 0, "")
	default:
		doc.CellFormat(paperW, 10, titleContent, "", 0, "L", false, 0, "")
	}
	doc.SetTitle(titleContent, false)
	y += 10

	// Subtitle
	subtitle := ""
	if report.Deskripsi != nil {
		subtitle = *report.Deskripsi
	}
	subtitle = substituteFooterParams(subtitle, cfg.Filters)
	if subtitle != "" {
		doc.SetFont("Helvetica", "", 9)
		doc.SetTextColor(100, 100, 100)
		switch titleAlign {
		case "center":
			doc.CellFormat(paperW/2, 6, subtitle, "", 0, "C", false, 0, "")
		case "right":
			doc.CellFormat(paperW, 6, subtitle, "", 0, "R", false, 0, "")
		default:
			doc.CellFormat(paperW, 6, subtitle, "", 0, "L", false, 0, "")
		}
		doc.SetTextColor(0, 0, 0)
		y += 6
	}

	// Datasets and columns
	datasets, err := repo.GetDatasets(ctx, report.IDLaporan)
	if err != nil {
		return nil, fmt.Errorf("failed to get datasets: %w", err)
	}
	columnsMap, err := repo.GetAllColumns(ctx, report.IDLaporan)
	if err != nil {
		return nil, fmt.Errorf("failed to get columns: %w", err)
	}

	for dsIdx, ds := range datasets {
		if !ds.Visible {
			continue
		}

		rows, err := repo.ExecuteQuery(ctx, ds.QuerySumberData, cfg.Filters, cfg.UserID)
		if err != nil {
			return nil, fmt.Errorf("query failed for %s: %w", ds.NamaDataset, err)
		}
		if len(rows) == 0 {
			continue
		}

		cols := columnsMap[ds.NamaDataset]
		if len(cols) == 0 {
			continue
		}

		// Page break for additional datasets
		if dsIdx > 0 {
			doc.AddPage()
			y = 15.0
		}

		// Dataset title
		doc.SetFont("Helvetica", "B", 11)
		doc.CellFormat(paperW, 7, ds.NamaDataset, "", 1, "L", false, 0, "")
		y += 7

		// Table header
		doc.SetFont("Helvetica", "B", 8)
		doc.SetFillColor(41, 128, 185)
		doc.SetTextColor(255, 255, 255)
		hw := (paperW - 30) / float64(len(cols))
		for _, col := range cols {
			label := col.LabelTampil
			if label == nil || *label == "" {
				label = &col.NamaKolom
			}
			doc.CellFormat(hw, 6, *label, "1", 0, "C", true, 0, "")
		}
		doc.CellFormat(0, 6, "", "", 1, "L", false, 0, "")
		doc.SetTextColor(0, 0, 0)
		doc.SetFont("Helvetica", "", 8)
		y += 6

		// Table rows
		for _, row := range rows {
			if y > paperH-20 {
				doc.AddPage()
				y = 15.0
			}
			for _, col := range cols {
				val := formatCellForExport(row[col.NamaKolom], col.FormatType)
				alignment := col.Alignment
				if alignment == "" {
					alignment = "L"
				}
				doc.CellFormat(hw, 5.5, val, "1", 0, alignment, false, 0, "")
			}
			doc.CellFormat(0, 5.5, "", "", 1, "L", false, 0, "")
			y += 5.5
		}

		// Draw border around table
		doc.Line(15, y-0.5, paperW-15, y-0.5)
		y += 2
	}

	// Footer band
	footerContent := ""
	if footerBand, ok := footerBands["footer"]; ok {
		if fb, ok := footerBand.(map[string]interface{}); ok {
			if c, ok := fb["content"].(string); ok {
				footerContent = c
			}
		}
	}
	if footerContent != "" {
		footerContent = substituteFooterParams(footerContent, cfg.Filters)
		doc.SetFont("Helvetica", "", 8)
		doc.SetTextColor(120, 120, 120)
		doc.CellFormat(paperW/2, 5, footerContent, "", 0, "C", false, 0, "")
	}

	// Signatures
	signatures := getSignatures(footerBands)
	if len(signatures) > 0 {
		doc.AddPage()
		y = paperH - 70
		sigW := paperW / float64(len(signatures))
		for sigIdx, sig := range signatures {
			x := sigW*float64(sigIdx) + sigW/2
			doc.SetFont("Helvetica", "", 8)
			doc.Text(x, y+20, sig.Label)
			doc.Line(x-20, y+25, x+20, y+25)
		}
	}

	var buf bytes.Buffer
	if err := doc.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate pdf: %w", err)
	}

	return &SExportResult{
		MimeType: "application/pdf",
		Filename: fmt.Sprintf("%s.pdf", sanitizeFilename(report.NamaLaporan)),
		Content:  buf.Bytes(),
	}, nil
}

// ============================================================================
// CSV Export
// ============================================================================

// GenerateCSV creates a CSV with BOM and formatted cells.
func GenerateCSV(ctx context.Context, svc any, repo IReportExportRepository, cfg SExportConfig) (*SExportResult, error) {
	report, err := repo.GetReportByKodeMenu(ctx, cfg.KodeMenu)
	if err != nil {
		return nil, fmt.Errorf("report not found: %w", err)
	}
	if report == nil {
		return nil, fmt.Errorf("report %s not found", cfg.KodeMenu)
	}

	datasets, err := repo.GetDatasets(ctx, report.IDLaporan)
	if err != nil {
		return nil, fmt.Errorf("failed to get datasets: %w", err)
	}
	columnsMap, err := repo.GetAllColumns(ctx, report.IDLaporan)
	if err != nil {
		return nil, fmt.Errorf("failed to get columns: %w", err)
	}

	var buf bytes.Buffer
	buf.WriteString("\xEF\xBB\xBF") // UTF-8 BOM

	for dsIdx, ds := range datasets {
		if !ds.Visible {
			continue
		}
		if dsIdx > 0 {
			buf.WriteString("\n\n")
		}

		rows, err := repo.ExecuteQuery(ctx, ds.QuerySumberData, cfg.Filters, cfg.UserID)
		if err != nil {
			continue
		}
		if len(rows) == 0 {
			continue
		}

		cols := columnsMap[ds.NamaDataset]
		// Write dataset header
		buf.WriteString(fmt.Sprintf("\n=== %s ===\n", ds.NamaDataset))
		// Write column headers
		header := make([]string, len(cols))
		for i, col := range cols {
			label := col.LabelTampil
			if label == nil || *label == "" {
				label = &col.NamaKolom
			}
			header[i] = *label
		}
		buf.WriteString(strings.Join(escapeCSV(header), ",") + "\n")
		// Write data rows
		for _, row := range rows {
			values := make([]string, len(cols))
			for i, col := range cols {
				val := formatCellForExport(row[col.NamaKolom], col.FormatType)
				values[i] = val
			}
			buf.WriteString(strings.Join(escapeCSV(values), ",") + "\n")
		}
	}

	return &SExportResult{
		MimeType: "text/csv;charset=utf-8",
		Filename: fmt.Sprintf("%s.csv", sanitizeFilename(report.NamaLaporan)),
		Content:  buf.Bytes(),
	}, nil
}

// ============================================================================
// Helper Functions
// ============================================================================

func formatCellForExport(val interface{}, formatType string) string {
	if val == nil {
		return ""
	}
	switch v := val.(type) {
	case float64:
		switch formatType {
		case "currency":
			return fmt.Sprintf("Rp %s", formatNumberWithSpaces(int64(v)))
		case "number":
			return formatNumberWithSpaces(int64(v))
		default:
			return strconv.FormatFloat(v, 'f', -1, 64)
		}
	case string:
		return v
	case time.Time:
		return v.Format("2006-01-02")
	default:
		return fmt.Sprintf("%v", val)
	}
}

func formatNumberWithSpaces(n int64) string {
	// Indonesian locale uses dots as thousand separator
	s := strconv.FormatInt(n, 10)
	// Insert dots every 3 digits from right
	var result []byte
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			result = append(result, '.')
		}
		result = append(result, byte(c))
	}
	return string(result)
}

func substituteFooterParams(template string, params map[string]interface{}) string {
	result := template
	for k, v := range params {
		result = strings.ReplaceAll(result, fmt.Sprintf("{{%s}}", k), fmt.Sprintf("%v", v))
		result = strings.ReplaceAll(result, fmt.Sprintf("@%s", k), fmt.Sprintf("%v", v))
		result = strings.ReplaceAll(result, fmt.Sprintf("[%s]", k), fmt.Sprintf("%v", v))
	}
	result = strings.ReplaceAll(result, "{{date}}", time.Now().Format("02/01/2006"))
	result = strings.ReplaceAll(result, "{{page}}", "1")
	result = strings.ReplaceAll(result, "{{total}}", "1")
	return result
}

func getSignatures(footerBands map[string]interface{}) []struct{ Label string } {
	var result []struct{ Label string }
	if summary, ok := footerBands["summary"]; ok {
		if s, ok := summary.(map[string]interface{}); ok {
			if sigs, ok := s["signatures"].([]interface{}); ok {
				for _, sig := range sigs {
					if m, ok := sig.(map[string]interface{}); ok {
						if label, ok := m["label"].(string); ok {
							result = append(result, struct{ Label string }{Label: label})
						}
					}
				}
			}
		}
	}
	return result
}

func paperDimensions(size, orientation string) (float64, float64) {
	w, h := 210.0, 297.0 // A4 default
	switch size {
	case "a3":
		w, h = 297.0, 420.0
	case "a5":
		w, h = 148.0, 210.0
	case "letter":
		w, h = 216.0, 279.0
	case "legal":
		w, h = 216.0, 356.0
	case "tabloid":
		w, h = 279.0, 432.0
	}
	if orientation == "landscape" {
		w, h = h, w
	}
	return w, h
}

func sanitizeSheetName(name string) string {
	name = strings.ReplaceAll(name, "/", "\\")
	name = strings.ReplaceAll(name, "?", "")
	name = strings.ReplaceAll(name, "*", "")
	name = strings.ReplaceAll(name, "[", "")
	name = strings.ReplaceAll(name, "]", "")
	name = strings.ReplaceAll(name, " ", "") // remove spaces to match Excel requirements
	if len(name) > 31 {
		name = name[:31]
	}
	if name == "" {
		name = "Sheet"
	}
	return name
}

func sanitizeFilename(name string) string {
	name = strings.ReplaceAll(name, " ", "_")
	name = strings.ReplaceAll(name, "/", "_")
	name = strings.ReplaceAll(name, "\\", "_")
	return name
}

func escapeCSV(values []string) []string {
	escaped := make([]string, len(values))
	for i, v := range values {
		if strings.Contains(v, ",") || strings.Contains(v, "\"") || strings.Contains(v, "\n") {
			escaped[i] = "\"" + strings.ReplaceAll(v, "\"", "\"\"") + "\""
		} else {
			escaped[i] = v
		}
	}
	return escaped
}

// Ensure we import strings
var _ = io.Discard