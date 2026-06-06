package permission

import (
	"fmt"
	"io"
	"strings"

	"github.com/masza1/dapen-backend/internal/infrastructure/export"
)

// permissionReportExcelColumns is the column layout for the Excel export
// of the permission report. The order here MUST match the order in which
// formatPermissionReportRows appends values in
// formatPermissionReportRowsExcel.
var permissionReportExcelColumns = []export.ExcelColumn{
	{Header: "User", Width: 12},
	{Header: "Full Name", Width: 22},
	{Header: "Role", Width: 10},
	{Header: "Menu Code", Width: 14},
	{Header: "Menu Name", Width: 28},
	{Header: "Has Access", Width: 6},
	{Header: "Create", Width: 6},
	{Header: "Update", Width: 6},
	{Header: "Delete", Width: 6},
	{Header: "Print", Width: 6},
	{Header: "Export", Width: 6},
	{Header: "Approve 1-5", Width: 9},
	{Header: "Canceled", Width: 8},
}

// permissionReportPDFColumnWidths is the per-column width (in mm) for the
// landscape-A4 PDF export. Total ≈ 277mm which fits A4 landscape
// (297mm - 20mm margins).
var permissionReportPDFColumnWidths = []float64{
	18, 45, 22, 60, 13, 10, 10, 10, 10, 10, 22, 10,
}

// formatPermissionReportXLSX converts the given rows + filters into a
// styled .xlsx workbook and writes it to w. It is the Excel-specific
// counterpart of formatPermissionReportPDF; both delegate to the generic
// shared/export package for the actual streaming/serialization work.
func formatPermissionReportXLSX(rows []SPermissionReportRowDTO, filters SReportFilters, w io.Writer) error {
	if w == nil {
		return fmt.Errorf("format permission report xlsx: nil io.Writer")
	}

	writer, err := export.NewExcelStreamWriter(w, "Permission Report", permissionReportExcelColumns)
	if err != nil {
		return fmt.Errorf("create excel stream writer: %w", err)
	}
	defer func() {
		// Ensure resources are freed even if AddRow / Close fail.
		_ = writer.Close()
	}()

	// Filter summary row (sits below the header). The generic
	// ExcelStreamWriter doesn't know about "filter summaries" so we
	// emit it as a normal data row spanning the first cell.
	summary := buildFilterSummary(filters)
	if err := writer.AddRow([]interface{}{summary}); err != nil {
		return fmt.Errorf("add filter summary row: %w", err)
	}

	// Data rows.
	for _, r := range rows {
		if err := writer.AddRow(formatPermissionReportRowExcel(r)); err != nil {
			return fmt.Errorf("add data row: %w", err)
		}
	}

	if err := writer.Close(); err != nil {
		return fmt.Errorf("close excel writer: %w", err)
	}
	return nil
}

// formatPermissionReportPDF converts the given rows + filters into a
// paginated, landscape-A4 PDF and writes it to w. The title and
// generated-at timestamp are repeated on every page; the column
// header is repeated too via fpdf's header function (set up inside
// shared/export.NewPDFTableWriter).
func formatPermissionReportPDF(rows []SPermissionReportRowDTO, filters SReportFilters, w io.Writer) error {
	if w == nil {
		return fmt.Errorf("format permission report pdf: nil io.Writer")
	}

	cols := []string{
		"User", "Full Name", "Menu Code", "Menu Name",
		"Access", "C", "U", "D", "P", "E", "A1-5", "X",
	}
	writer, err := export.NewPDFTableWriter(w, export.PDFLandscape, cols, permissionReportPDFColumnWidths, "Permission Report", buildFilterSummary(filters))
	if err != nil {
		return fmt.Errorf("create pdf table writer: %w", err)
	}
	defer func() {
		_ = writer.Close()
	}()

	for _, r := range rows {
		if err := writer.AddRow(formatPermissionReportRowPDF(r)); err != nil {
			return fmt.Errorf("add data row: %w", err)
		}
	}

	if err := writer.Close(); err != nil {
		return fmt.Errorf("close pdf writer: %w", err)
	}
	return nil
}

// formatPermissionReportRowExcel converts a single permission-report row
// into the primitive value slice expected by
// shared/export.ExcelStreamWriter.AddRow. The order MUST match
// permissionReportExcelColumns.
func formatPermissionReportRowExcel(r SPermissionReportRowDTO) []interface{} {
	return []interface{}{
		r.UserID,
		r.FullName,
		r.Role,
		r.MenuCode,
		r.MenuName,
		yesNo(r.HasAccess),
		yesNo(r.IsCreate),
		yesNo(r.IsUpdate),
		yesNo(r.IsDelete),
		yesNo(r.IsPrint),
		yesNo(r.IsExport),
		approveSummary(r.IsApprove1, r.IsApprove2, r.IsApprove3, r.IsApprove4, r.IsApprove5),
		yesNo(r.IsCanceled),
	}
}

// formatPermissionReportRowPDF converts a single permission-report row
// into the []string expected by shared/export.PDFTableWriter.AddRow.
// The order MUST match the cols slice in formatPermissionReportPDF
// and the permissionReportPDFColumnWidths widths slice.
func formatPermissionReportRowPDF(r SPermissionReportRowDTO) []string {
	return []string{
		truncatePDFCell(r.UserID, 10),
		truncatePDFCell(r.FullName, 30),
		truncatePDFCell(r.MenuCode, 12),
		truncatePDFCell(r.MenuName, 40),
		yesNo(r.HasAccess),
		yesNo(r.IsCreate),
		yesNo(r.IsUpdate),
		yesNo(r.IsDelete),
		yesNo(r.IsPrint),
		yesNo(r.IsExport),
		approveSummary(r.IsApprove1, r.IsApprove2, r.IsApprove3, r.IsApprove4, r.IsApprove5),
		yesNo(r.IsCanceled),
	}
}

// yesNo renders 0/1 booleans as Yes/No for human readability.
func yesNo(v int) string {
	if v == 1 {
		return "Yes"
	}
	return "No"
}

// approveSummary joins approval levels (1..5) into a single
// comma-separated string like "1,3", or "—" when no level is granted.
func approveSummary(v1, v2, v3, v4, v5 int) string {
	parts := []string{}
	for i, v := range []int{v1, v2, v3, v4, v5} {
		if v == 1 {
			parts = append(parts, fmt.Sprintf("%d", i+1))
		}
	}
	if len(parts) == 0 {
		return "—"
	}
	return strings.Join(parts, ",")
}

// buildFilterSummary returns a short human-readable string describing
// which filters were applied to the report, e.g.
// "Filters: userId=ADMIN, menuType=menu". It is rendered as a single
// line under the report title in both the PDF subtitle and the Excel
// filter summary row.
func buildFilterSummary(f SReportFilters) string {
	parts := []string{}
	if f.UserID != nil && *f.UserID != "" {
		parts = append(parts, "userId="+*f.UserID)
	}
	if f.MenuID != nil && *f.MenuID != "" {
		parts = append(parts, "menuId="+*f.MenuID)
	}
	if f.MenuType != "" {
		parts = append(parts, "menuType="+f.MenuType)
	} else {
		parts = append(parts, "menuType=menu")
	}
	if len(parts) == 0 {
		return "Filters: (none)"
	}
	return "Filters: " + strings.Join(parts, ", ")
}

// truncatePDFCell keeps permission-specific cell-width rules in this file.
// The generic pdf writer already truncates, but we use stricter limits
// here so permission-menu names don't blow out the column.
func truncatePDFCell(s string, maxRunes int) string {
	if len(s) <= maxRunes {
		return s
	}
	if maxRunes <= 1 {
		return "…"
	}
	return s[:maxRunes-1] + "…"
}
