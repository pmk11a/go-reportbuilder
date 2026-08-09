package reports

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type fakeExportRepo struct {
	report   *SDBMasterLaporan
	datasets []SDBQueryLaporan
	cols     map[string][]SDBKolomLaporan
	rows     []map[string]interface{}
}

func (f *fakeExportRepo) GetReportByKodeMenu(_ context.Context, _ string) (*SDBMasterLaporan, error) {
	return f.report, nil
}
func (f *fakeExportRepo) GetDatasets(_ context.Context, _ int) ([]SDBQueryLaporan, error) {
	return f.datasets, nil
}
func (f *fakeExportRepo) GetAllColumns(_ context.Context, _ int) (map[string][]SDBKolomLaporan, error) {
	return f.cols, nil
}
func (f *fakeExportRepo) ExecuteQuery(_ context.Context, _ string, _ map[string]interface{}, _ string) ([]map[string]interface{}, error) {
	return f.rows, nil
}

func TestFormatCellForExport(t *testing.T) {
	t.Run("currency", func(t *testing.T) {
		v := formatCellForExport(1500000.0, "currency")
		assert.Contains(t, v, "Rp")
		assert.Contains(t, v, "1.500.000")
	})
	t.Run("number", func(t *testing.T) {
		assert.Equal(t, "12.345", formatCellForExport(12345.0, "number"))
	})
	t.Run("string passthrough", func(t *testing.T) {
		assert.Equal(t, "hello", formatCellForExport("hello", "string"))
	})
	t.Run("nil empty", func(t *testing.T) {
		assert.Equal(t, "", formatCellForExport(nil, ""))
	})
}

func TestFormatNumberWithSpaces(t *testing.T) {
	assert.Equal(t, "1.500.000", formatNumberWithSpaces(1500000))
	assert.Equal(t, "1", formatNumberWithSpaces(1))
	assert.Equal(t, "1.000", formatNumberWithSpaces(1000))
}

func TestPaperDimensions(t *testing.T) {
	w, h := paperDimensions("a4", "portrait")
	assert.Equal(t, 210.0, w)
	assert.Equal(t, 297.0, h)
	w, h = paperDimensions("a4", "landscape")
	assert.Equal(t, 297.0, w)
	assert.Equal(t, 210.0, h)
	w, h = paperDimensions("letter", "portrait")
	assert.Equal(t, 216.0, w)
	assert.Equal(t, 279.0, h)
}

func TestSanitizeSheetName(t *testing.T) {
	assert.Equal(t, "Sheet1", sanitizeSheetName("Sheet 1?*[]"))
	assert.Equal(t, "Sheet", sanitizeSheetName(""))
	long := sanitizeSheetName("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	assert.LessOrEqual(t, len(long), 31)
}

func TestEscapeCSV(t *testing.T) {
	out := escapeCSV([]string{"plain", "with,comma", "with\"quote"})
	assert.Equal(t, "plain", out[0])
	assert.Equal(t, `"with,comma"`, out[1])
	assert.Equal(t, `"with""quote"`, out[2])
}

func TestSubstituteFooterParams(t *testing.T) {
	v := substituteFooterParams("Tanggal: {{date}}", nil)
	assert.Contains(t, v, "Tanggal:")
	v = substituteFooterParams("Bulan: @bulan", map[string]interface{}{"bulan": "Juni"})
	assert.Equal(t, "Bulan: Juni", v)
}

func TestGetSignatures(t *testing.T) {
	assert.Equal(t, 0, len(getSignatures(nil)))
}

func TestGenerateXLSX_HappyPath(t *testing.T) {
	deskripsi := "Test report"
	footerBands := ""
	repo := &fakeExportRepo{
		report: &SDBMasterLaporan{
			IDLaporan:   1,
			NamaLaporan: "Test Report",
			Deskripsi:   &deskripsi,
			FooterBands: &footerBands,
		},
		datasets: []SDBQueryLaporan{{NamaDataset: "Data1", Visible: true, QuerySumberData: "SELECT 1"}},
		cols: map[string][]SDBKolomLaporan{
			"Data1": {
				{NamaKolom: "id", LabelTampil: ptrStr("ID"), FormatType: "number"},
				{NamaKolom: "nama", LabelTampil: ptrStr("Name"), FormatType: "string"},
			},
		},
		rows: []map[string]interface{}{{"id": 1.0, "nama": "Alice"}, {"id": 2.0, "nama": "Bob"}},
	}
	result, err := GenerateXLSX(context.Background(), nil, repo, SExportConfig{KodeMenu: "TEST", Filters: map[string]interface{}{}, UserID: "u1"})
	require.NoError(t, err)
	require.NotNil(t, result)
	assert.Equal(t, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", result.MimeType)
	assert.Contains(t, result.Filename, "Test_Report.xlsx")
	assert.Greater(t, len(result.Content), 0)
}

func TestGeneratePDF_HappyPath(t *testing.T) {
	deskripsi := "Test report"
	footerBands := ""
	repo := &fakeExportRepo{
		report: &SDBMasterLaporan{
			IDLaporan:   1,
			NamaLaporan: "PDF Report",
			Deskripsi:   &deskripsi,
			FooterBands: &footerBands,
		},
		datasets: []SDBQueryLaporan{{NamaDataset: "Data1", Visible: true, QuerySumberData: "SELECT 1"}},
		cols: map[string][]SDBKolomLaporan{
			"Data1": {
				{NamaKolom: "id", LabelTampil: ptrStr("ID"), FormatType: "number"},
				{NamaKolom: "nama", LabelTampil: ptrStr("Name"), FormatType: "string"},
			},
		},
		rows: []map[string]interface{}{{"id": 1.0, "nama": "Alice"}},
	}
	result, err := GeneratePDF(context.Background(), nil, repo, SExportConfig{KodeMenu: "TEST", Filters: map[string]interface{}{}, UserID: "u1", PaperSize: "a4", Orientation: "portrait"})
	require.NoError(t, err)
	require.NotNil(t, result)
	assert.Equal(t, "application/pdf", result.MimeType)
	assert.Contains(t, result.Filename, "PDF_Report.pdf")
	assert.Greater(t, len(result.Content), 0)
}

func TestGenerateCSV_HappyPath(t *testing.T) {
	repo := &fakeExportRepo{
		report: &SDBMasterLaporan{IDLaporan: 1, NamaLaporan: "CSV Report"},
		datasets: []SDBQueryLaporan{{NamaDataset: "Data1", Visible: true, QuerySumberData: "SELECT 1"}},
		cols: map[string][]SDBKolomLaporan{
			"Data1": {{NamaKolom: "id", LabelTampil: ptrStr("ID"), FormatType: "number"}},
		},
		rows: []map[string]interface{}{{"id": 1.0}, {"id": 2.0}},
	}
	result, err := GenerateCSV(context.Background(), nil, repo, SExportConfig{KodeMenu: "TEST", Filters: map[string]interface{}{}, UserID: "u1"})
	require.NoError(t, err)
	require.NotNil(t, result)
	assert.Contains(t, result.MimeType, "text/csv")
	assert.Contains(t, result.Filename, "CSV_Report.csv")
	assert.Greater(t, len(result.Content), 0)
}

func ptrStr(s string) *string { return &s }
