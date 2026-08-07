package reports

import (
	"encoding/json"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/infrastructure/response"
)

// ============================================================================
// Export Handler — provides XLSX, PDF, and CSV export endpoints
// ============================================================================

// SReportExportHandler handles HTTP requests for export operations.
type SReportExportHandler struct {
	repo IReportExportRepository
}

// NewReportExportHandler constructs a new export handler.
func NewReportExportHandler(repo IReportExportRepository) *SReportExportHandler {
	return &SReportExportHandler{repo: repo}
}

// SExportRequest is the JSON payload for export requests.
type SExportRequest struct {
	Filters     map[string]interface{} `json:"filters"`
	PaperSize   string                 `json:"paper_size"`
	Orientation string                 `json:"orientation"`
}

// ExportXLSX godoc
// @Summary Export report as XLSX
// @Description Generate XLSX file from report data
// @Tags Reports
// @Accept json
// @Produce application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Param kodeMenu path string true "Report Kode Menu"
// @Param request body SExportRequest false "Export options"
// @Success 200 {file} file
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /reports/{kodeMenu}/export/xlsx [post]
func (h *SReportExportHandler) ExportXLSX(c *gin.Context) {
	h.export(c, "xlsx")
}

// ExportPDF godoc
// @Summary Export report as PDF
// @Description Generate PDF file from report data
// @Tags Reports
// @Accept json
// @Produce application/pdf
// @Param kodeMenu path string true "Report Kode Menu"
// @Param request body SExportRequest false "Export options"
// @Success 200 {file} file
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /reports/{kodeMenu}/export/pdf [post]
func (h *SReportExportHandler) ExportPDF(c *gin.Context) {
	h.export(c, "pdf")
}

// ExportCSV godoc
// @Summary Export report as CSV
// @Description Generate CSV file from report data
// @Tags Reports
// @Accept json
// @Produce text/csv
// @Param kodeMenu path string true "Report Kode Menu"
// @Param request body SExportRequest false "Export options"
// @Success 200 {file} file
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /reports/{kodeMenu}/export/csv [post]
func (h *SReportExportHandler) ExportCSV(c *gin.Context) {
	h.export(c, "csv")
}

func (h *SReportExportHandler) export(c *gin.Context, format string) {
	kodeMenu := c.Param("kodeMenu")
	if kodeMenu == "" {
		response.BadRequest(c, "Kode menu is required")
		return
	}

	// Get user ID from context
	var userId string
	if val, ok := c.Get("legacy_user_id"); ok && val != "" {
		userId = fmt.Sprintf("%v", val)
	} else if val, ok := c.Get("user_id"); ok {
		userId = fmt.Sprintf("%v", val)
	}
	if userId == "" {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	// Parse request body (optional — empty body allowed)
	var req SExportRequest
	if err := c.ShouldBindJSON(&req); err != nil && c.Request.ContentLength > 0 {
		response.BadRequest(c, "Invalid request body: "+err.Error())
		return
	}
	if req.Filters == nil {
		req.Filters = make(map[string]interface{})
	}
	// Merge query string filters
	for k, v := range c.Request.URL.Query() {
		if len(v) > 0 && k != "paper_size" && k != "orientation" {
			req.Filters[k] = v[0]
		}
	}
	if req.PaperSize == "" {
		req.PaperSize = "a4"
	}
	if req.Orientation == "" {
		req.Orientation = "portrait"
	}

	cfg := SExportConfig{
		KodeMenu:    kodeMenu,
		Filters:     req.Filters,
		UserID:      userId,
		FormatType:  format,
		PaperSize:   req.PaperSize,
		Orientation: req.Orientation,
	}

	var (
		result *SExportResult
		err    error
	)

	switch format {
	case "xlsx":
		result, err = GenerateXLSX(c.Request.Context(), nil, h.repo, cfg)
	case "pdf":
		result, err = GeneratePDF(c.Request.Context(), nil, h.repo, cfg)
	case "csv":
		result, err = GenerateCSV(c.Request.Context(), nil, h.repo, cfg)
	default:
		response.BadRequest(c, "Unsupported format: "+format)
		return
	}

	if err != nil {
		response.InternalError(c, "Failed to generate export: "+err.Error())
		return
	}

	c.Header("Content-Type", result.MimeType)
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%q", result.Filename))
	c.Header("Content-Length", fmt.Sprintf("%d", len(result.Content)))
	c.Data(200, result.MimeType, result.Content)
}

// MarshalForLog marshals an export config for logging purposes.
func MarshalForLog(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}