package execution

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/features/reports"
	"github.com/masza1/dapen-backend/internal/infrastructure/response"
)

// SReportExecutionHandler handles HTTP requests for report execution (user-facing).
type SReportExecutionHandler struct {
	service       *SReportExecutionService
	reportService reports.IReportsService
}

// NewReportExecutionHandler constructs a new report execution handler.
func NewReportExecutionHandler(service *SReportExecutionService, reportService reports.IReportsService) *SReportExecutionHandler {
	return &SReportExecutionHandler{
		service:       service,
		reportService: reportService,
	}
}

// GetSidebarMenu godoc
// @Summary Get Reports Sidebar Menu
// @Description Fetch hierarchical report menu based on user access
// @Tags Reports
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /reports/menu [get]
func (h *SReportExecutionHandler) GetSidebarMenu(c *gin.Context) {
	// Get user ID from context (set by AuthMiddleware)
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

	search := c.Query("q")

	menuTree, err := h.getMenuTreeForUser(c.Request.Context(), userId, search)
	if err != nil {
		response.InternalError(c, "Failed to retrieve menu")
		return
	}

	response.Success(c, "Menu retrieved successfully", menuTree)
}

// getMenuTreeForUser builds the hierarchical menu tree for a user
func (h *SReportExecutionHandler) getMenuTreeForUser(ctx context.Context, userId string, search string) ([]reports.SMenuReportItem, error) {
	return h.reportService.GetMenuTreeForUser(ctx, userId, search)
}

// GetReportConfig godoc
// @Summary Get Report Configuration
// @Description Fetch full report configuration including filters, datasets, columns, and grouping
// @Tags Reports
// @Produce json
// @Param kodeMenu path string true "Report Kode Menu"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /reports/{kodeMenu} [get]
func (h *SReportExecutionHandler) GetReportConfig(c *gin.Context) {
	kodeMenu := c.Param("kodeMenu")
	if kodeMenu == "" {
		response.BadRequest(c, "Kode menu is required")
		return
	}

	// Get report by kode menu
	report, err := h.getReportByKodeMenu(c.Request.Context(), kodeMenu)
	if err != nil {
		response.NotFound(c, "Report not found")
		return
	}

	if report == nil {
		response.NotFound(c, "Report not found")
		return
	}

	// Build full config response
	config := h.buildReportConfig(report)

	response.Success(c, "Report configuration retrieved successfully", config)
}

// getReportByKodeMenu gets report by kode menu with fallback normalization
func (h *SReportExecutionHandler) getReportByKodeMenu(ctx context.Context, kodeMenu string) (*reports.SReportDetailResponse, error) {
	// Try original kode first
	report, err := h.fetchReportConfig(ctx, kodeMenu)
	if err == nil && report != nil {
		return report, nil
	}

	// Try normalized version
	normalized := strings.TrimLeft(kodeMenu, "0")
	if normalized != kodeMenu {
		report, err = h.fetchReportConfig(ctx, normalized)
		if err == nil && report != nil {
			return report, nil
		}
	}

	return nil, nil
}

// fetchReportConfig fetches full report configuration
func (h *SReportExecutionHandler) fetchReportConfig(ctx context.Context, kodeMenu string) (*reports.SReportDetailResponse, error) {
	// Get report detail from service
	reportsList, err := h.reportService.ListReports(ctx, &reports.SListReportsRequest{Page: 1, Limit: 1000})
	if err != nil {
		return nil, err
	}

	// Find report by kode menu
	for _, r := range reportsList.Reports {
		if r.KODEMENU == kodeMenu {
			// Get full detail
			foundReport, err := h.reportService.GetReport(ctx, r.IDLaporan)
			if err != nil {
				return nil, err
			}
			return foundReport, nil
		}
	}

	return nil, nil
}

// buildReportConfig builds the config response from report detail
func (h *SReportExecutionHandler) buildReportConfig(report *reports.SReportDetailResponse) *reports.SReportConfigResponse {
	var footerBands map[string]interface{}
	if report.FooterBands != nil {
		json.Unmarshal([]byte(report.FooterBands), &footerBands)
	}

	var filters []reports.SFilterConfigResponse
	for _, f := range report.Filters {
		filter := reports.SFilterConfigResponse{
			IDParameter:  f.IDParameter,
			NamaFilter:   f.NamaFilter,
			Label:        f.Label,
			TipeInput:    f.TipeInput,
			WajibIsi:     f.WajibIsi,
			NilaiDefault: f.NilaiDefault,
		}

		// Extract browse config from konfigurasi
		if f.Konfigurasi != nil {
			if kodeBrowse, ok := f.Konfigurasi["kode_browse"].(string); ok {
				filter.KodeBrowse = &kodeBrowse
			}
			if mode, ok := f.Konfigurasi["mode"].(string); ok {
				filter.Mode = &mode
			}
			filter.Konfigurasi = f.Konfigurasi
		}

		filters = append(filters, filter)
	}

	var datasets []reports.SDatasetConfigResponse
	for _, d := range report.Datasets {
		datasets = append(datasets, reports.SDatasetConfigResponse{
			IDQuery:     d.IDQuery,
			NamaDataset: d.NamaDataset,
			Deskripsi:   d.Deskripsi,
			Urutan:      d.Urutan,
			Visible:     d.Visible,
			ConfigJSON:  d.ConfigJSON,
		})
	}

	columns := make(map[string][]reports.SColumnConfigResponse)
	for dataset, cols := range report.Columns {
		var colConfigs []reports.SColumnConfigResponse
		for _, c := range cols {
			colConfigs = append(colConfigs, reports.SColumnConfigResponse{
				NamaKolom:   c.NamaKolom,
				LabelTampil: c.LabelTampil,
				FormatType:  c.FormatType,
				Alignment:   c.Alignment,
				IsSummable:  c.IsSummable,
				IsVisible:   c.IsVisible,
			})
		}
		columns[dataset] = colConfigs
	}

	var grouping []map[string]interface{}
	for _, g := range report.Groups {
		grouping = append(grouping, map[string]interface{}{
			"id_group":         g.IDGroup,
			"group_level":      g.GroupLevel,
			"group_field":      g.GroupField,
			"field_value":      g.FieldValue,
			"label":            g.Label,
			"sort_order":       g.SortOrder,
			"show_subtotal":    g.ShowSubtotal,
			"style_config":     g.StyleConfig,
			"special_handling": g.SpecialHandling,
			"config_json":      g.ConfigJSON,
		})
	}

	var komponen []reports.SKomponenConfigResponse
	for _, k := range report.Komponen {
		komponen = append(komponen, reports.SKomponenConfigResponse{
			IDKomponen:        k.IDKomponen,
			NamaKomponen:      k.NamaKomponen,
			KonfigurasiLayout: k.KonfigurasiLayout,
			Urutan:            k.Urutan,
		})
	}

	return &reports.SReportConfigResponse{
		IDLaporan:   report.IDLaporan,
		KODEMENU:   report.KODEMENU,
		NamaLaporan: report.NamaLaporan,
		Deskripsi:  report.Deskripsi,
		ACCESS:     "", // Would come from DBMENUREPORT
		FooterBands: footerBands,
		Filters:    filters,
		Datasets:   datasets,
		Columns:    columns,
		Grouping:   grouping,
		Komponen:   komponen,
	}
}

// ExecuteReport godoc
// @Summary Execute Report
// @Description Execute a report and return the data
// @Tags Reports
// @Accept json
// @Produce json
// @Param kodeMenu path string true "Report Kode Menu"
// @Param request body reports.SExecuteReportRequest true "Filters"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /reports/{kodeMenu}/preview [post]
func (h *SReportExecutionHandler) ExecuteReport(c *gin.Context) {
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


	var req reports.SExecuteReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req = reports.SExecuteReportRequest{
			Filters: make(map[string]interface{}),
		}
	}

	if req.Filters == nil {
		req.Filters = make(map[string]interface{})
	}
	for k, v := range c.Request.URL.Query() {
		if len(v) > 0 {
			req.Filters[k] = v[0]
		}
	}

	// Execute report
	result, err := h.service.GenerateReport(c.Request.Context(), ExecuteReportParams{
		KodeMenu: kodeMenu,
		Filters:  req.Filters,
		UserID:   userId,
	})

	if err != nil {
		response.InternalError(c, "Failed to execute report: "+err.Error())
		return
	}

	// Build response
	execResp := &reports.SExecuteReportResponse{
		Success:    len(result.Errors) == 0,
		Datasets:   result.Datasets,
		GroupedData: result.GroupedData,
		GrandTotal:  result.GrandTotal,
		Errors:     result.Errors,
	}

	if len(result.Errors) > 0 {
		execResp.Message = "Report executed with errors"
	} else {
		execResp.Message = "Report executed successfully"
	}

	response.Success(c, execResp.Message, execResp)
}
