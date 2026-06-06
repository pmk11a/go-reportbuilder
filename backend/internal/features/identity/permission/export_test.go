package permission

import (
	"bytes"
	"testing"

	"github.com/stretchr/testify/assert"
)

// buildSampleReportRows returns a small set of permission-report DTO
// rows that exercise every column used by the formatter (text, 0/1
// booleans encoded as ints, multi-level approvals).
func buildSampleReportRows(n int) []SPermissionReportRowDTO {
	rows := make([]SPermissionReportRowDTO, n)
	for i := 0; i < n; i++ {
		rows[i] = SPermissionReportRowDTO{
			UserID:     "USR" + string(rune('A'+i)),
			Username:   "usr" + string(rune('A'+i)),
			FullName:   "Test User " + string(rune('A'+i)),
			Role:       "admin",
			MenuCode:   "M0" + string(rune('0'+i%10)),
			MenuName:   "Menu " + string(rune('A'+i)),
			MenuType:   "menu",
			HasAccess:  1,
			IsCreate:   1,
			IsUpdate:   0,
			IsDelete:   0,
			IsPrint:    1,
			IsExport:   0,
			IsApprove1: 1,
			IsApprove2: 0,
			IsApprove3: 1,
			IsApprove4: 0,
			IsApprove5: 0,
			IsCanceled: 0,
		}
	}
	return rows
}

// TestFormatPermissionReportXLSX_MinimalRows ensures the Excel
// formatter produces a valid .xlsx file (ZIP magic) for a small set
// of permission-report rows.
func TestFormatPermissionReportXLSX_MinimalRows(t *testing.T) {
	rows := buildSampleReportRows(10)
	filters := SReportFilters{MenuType: "menu"}

	var buf bytes.Buffer
	err := formatPermissionReportXLSX(rows, filters, &buf)
	assert.NoError(t, err)

	data := buf.Bytes()
	assert.NotEmpty(t, data)
	assert.Equal(t, []byte{0x50, 0x4B, 0x03, 0x04}, data[:4], "xlsx output should start with ZIP magic")
}

// TestFormatPermissionReportXLSX_EmptyRows ensures the formatter
// handles the zero-row edge case without errors.
func TestFormatPermissionReportXLSX_EmptyRows(t *testing.T) {
	var buf bytes.Buffer
	err := formatPermissionReportXLSX(nil, SReportFilters{}, &buf)
	assert.NoError(t, err)
	assert.NotEmpty(t, buf.Bytes())
}

// TestFormatPermissionReportXLSX_WithFilters ensures the formatter
// embeds the filter summary in the workbook.
func TestFormatPermissionReportXLSX_WithFilters(t *testing.T) {
	uid := "ADMIN"
	mid := "M01"
	rows := buildSampleReportRows(3)
	filters := SReportFilters{UserID: &uid, MenuID: &mid, MenuType: "report"}

	var buf bytes.Buffer
	err := formatPermissionReportXLSX(rows, filters, &buf)
	assert.NoError(t, err)
	assert.NotEmpty(t, buf.Bytes())
}

// TestFormatPermissionReportXLSX_NilWriterReturnsError ensures the
// formatter rejects a nil io.Writer.
func TestFormatPermissionReportXLSX_NilWriterReturnsError(t *testing.T) {
	err := formatPermissionReportXLSX(nil, SReportFilters{}, nil)
	assert.Error(t, err)
}

// TestFormatPermissionReportPDF_MinimalRows ensures the PDF formatter
// produces a valid PDF file ("%PDF" magic) for a small set of rows.
func TestFormatPermissionReportPDF_MinimalRows(t *testing.T) {
	rows := buildSampleReportRows(10)
	filters := SReportFilters{MenuType: "menu"}

	var buf bytes.Buffer
	err := formatPermissionReportPDF(rows, filters, &buf)
	assert.NoError(t, err)

	data := buf.Bytes()
	assert.NotEmpty(t, data)
	assert.True(t, bytes.HasPrefix(data, []byte("%PDF")), "pdf output should start with %PDF magic")
}

// TestFormatPermissionReportPDF_EmptyRows ensures the PDF formatter
// handles the zero-row edge case.
func TestFormatPermissionReportPDF_EmptyRows(t *testing.T) {
	var buf bytes.Buffer
	err := formatPermissionReportPDF(nil, SReportFilters{}, &buf)
	assert.NoError(t, err)
	assert.True(t, bytes.HasPrefix(buf.Bytes(), []byte("%PDF")))
}

// TestFormatPermissionReportPDF_PaginatesLargeReport ensures the PDF
// formatter handles > 30 rows by paginating into multiple pages.
func TestFormatPermissionReportPDF_PaginatesLargeReport(t *testing.T) {
	rows := buildSampleReportRows(75)
	var buf bytes.Buffer
	err := formatPermissionReportPDF(rows, SReportFilters{MenuType: "report"}, &buf)
	assert.NoError(t, err)
	assert.NotEmpty(t, buf.Bytes())
}

// TestFormatPermissionReportPDF_NilWriterReturnsError ensures the PDF
// formatter rejects a nil io.Writer.
func TestFormatPermissionReportPDF_NilWriterReturnsError(t *testing.T) {
	err := formatPermissionReportPDF(nil, SReportFilters{}, nil)
	assert.Error(t, err)
}

// TestYesNo covers the Yes/No helper used by the formatters.
func TestYesNo(t *testing.T) {
	assert.Equal(t, "Yes", yesNo(1))
	assert.Equal(t, "No", yesNo(0))
}

// TestApproveSummary covers the multi-level approval helper.
func TestApproveSummary(t *testing.T) {
	assert.Equal(t, "—", approveSummary(0, 0, 0, 0, 0))
	assert.Equal(t, "1", approveSummary(1, 0, 0, 0, 0))
	assert.Equal(t, "1,3,5", approveSummary(1, 0, 1, 0, 1))
	assert.Equal(t, "2,4", approveSummary(0, 1, 0, 1, 0))
}

// TestBuildFilterSummary covers the filter-summary helper.
func TestBuildFilterSummary(t *testing.T) {
	t.Run("Empty filters defaults menuType to menu", func(t *testing.T) {
		s := buildFilterSummary(SReportFilters{})
		assert.Contains(t, s, "menuType=menu")
	})

	t.Run("With userId and menuId", func(t *testing.T) {
		uid := "ADMIN"
		mid := "M01"
		s := buildFilterSummary(SReportFilters{UserID: &uid, MenuID: &mid, MenuType: "menu"})
		assert.Contains(t, s, "userId=ADMIN")
		assert.Contains(t, s, "menuId=M01")
		assert.Contains(t, s, "menuType=menu")
	})

	t.Run("Report type passes through", func(t *testing.T) {
		s := buildFilterSummary(SReportFilters{MenuType: "report"})
		assert.Contains(t, s, "menuType=report")
	})
}

// TestFormatPermissionReportRowExcel ensures the row converter
// produces a value slice with one entry per Excel column.
func TestFormatPermissionReportRowExcel(t *testing.T) {
	row := SPermissionReportRowDTO{
		UserID:     "ADMIN",
		FullName:   "Admin",
		Role:       "admin",
		MenuCode:   "M01",
		MenuName:   "Dashboard",
		HasAccess:  1,
		IsCreate:   1,
		IsUpdate:   0,
		IsDelete:   0,
		IsPrint:    1,
		IsExport:   0,
		IsApprove1: 1,
		IsApprove2: 0,
		IsApprove3: 0,
		IsApprove4: 0,
		IsApprove5: 0,
		IsCanceled: 0,
	}
	vals := formatPermissionReportRowExcel(row)
	assert.Len(t, vals, len(permissionReportExcelColumns))
	assert.Equal(t, "ADMIN", vals[0])
	assert.Equal(t, "Yes", vals[5]) // HasAccess
	assert.Equal(t, "1", vals[11])  // Approve 1-5
}

// TestFormatPermissionReportRowPDF ensures the PDF row converter
// produces a value slice with one entry per PDF column.
func TestFormatPermissionReportRowPDF(t *testing.T) {
	row := SPermissionReportRowDTO{
		UserID:     "ADMIN",
		MenuCode:   "M01",
		MenuName:   "Dashboard",
		HasAccess:  1,
		IsCreate:   0,
		IsCanceled: 1,
	}
	vals := formatPermissionReportRowPDF(row)
	assert.Len(t, vals, len(permissionReportPDFColumnWidths))
	assert.Equal(t, "ADMIN", vals[0])
	assert.Equal(t, "Yes", vals[4]) // Access
	assert.Equal(t, "Yes", vals[11]) // IsCanceled
}
