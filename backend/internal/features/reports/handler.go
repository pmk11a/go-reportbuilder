package reports

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/infrastructure/response"
	"gorm.io/gorm"
)

// SReportsHandler handles HTTP requests for the reports admin domain.
type SReportsHandler struct {
	service IReportsService
}

// NewReportsHandler constructs a new reports handler.
func NewReportsHandler(service IReportsService) *SReportsHandler {
	return &SReportsHandler{service: service}
}

// ============================================================================
// Report CRUD
// ============================================================================

// ListReports godoc
// @Summary List All Reports
// @Description Fetch a paginated list of all reports
// @Tags Reports Admin
// @Produce json
// @Param page query int false "Page Number" default(1)
// @Param limit query int false "Limit per page" default(10)
// @Param search query string false "Search query"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports [get]
func (h *SReportsHandler) ListReports(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	result, err := h.service.ListReports(c.Request.Context(), &SListReportsRequest{
		Page:   page,
		Limit:  limit,
		Search: search,
	})

	if err != nil {
		response.InternalError(c, "Failed to retrieve reports")
		return
	}

	response.Success(c, "Reports retrieved successfully", result)
}

// GetReport godoc
// @Summary Get Report by ID
// @Description Fetch full report details including filters, datasets, columns, groups, and user access
// @Tags Reports Admin
// @Produce json
// @Param id path int true "Report ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id} [get]
func (h *SReportsHandler) GetReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	report, err := h.service.GetReport(c.Request.Context(), id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFoundWithMap(c, "Report not found", response.SErrorMap{
				Code:      "EID_NOT_FOUND",
				ErrorName: "Laporan Tidak Ditemukan",
				Reason:    "Laporan dengan ID tersebut tidak ditemukan dalam sistem.",
				Action:    "Periksa kembali ID laporan atau muat ulang daftar laporan.",
			})
			return
		}
		response.InternalError(c, "Failed to retrieve report")
		return
	}

	response.Success(c, "Report retrieved successfully", report)
}

// CreateReport godoc
// @Summary Create New Report
// @Description Create a new report definition
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param request body SCreateReportRequest true "Report Data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports [post]
func (h *SReportsHandler) CreateReport(c *gin.Context) {
	var req SCreateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	report, err := h.service.CreateReport(c.Request.Context(), &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, "Report created successfully", report)
}

// UpdateReport godoc
// @Summary Update Report
// @Description Update an existing report definition
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param id path int true "Report ID"
// @Param request body SUpdateReportRequest true "Report Data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id} [put]
func (h *SReportsHandler) UpdateReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	var req SUpdateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	report, err := h.service.UpdateReport(c.Request.Context(), id, &req)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Report not found")
			return
		}
		response.InternalError(c, "Failed to update report")
		return
	}

	response.Success(c, "Report updated successfully", report)
}

// DeleteReport godoc
// @Summary Delete Report
// @Description Delete a report and all its associated data (filters, datasets, columns, groups)
// @Tags Reports Admin
// @Produce json
// @Param id path int true "Report ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id} [delete]
func (h *SReportsHandler) DeleteReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	if err := h.service.DeleteReport(c.Request.Context(), id); err != nil {
		response.InternalError(c, "Failed to delete report")
		return
	}

	response.Success(c, "Report deleted successfully", nil)
}

// GetAvailableKodeMenu godoc
// @Summary Get Available Kode Menu
// @Description Fetch kode menu options not yet assigned to any report
// @Tags Reports Admin
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/available-kodemenu [get]
func (h *SReportsHandler) GetAvailableKodeMenu(c *gin.Context) {
	result, err := h.service.GetAvailableKodeMenu(c.Request.Context())
	if err != nil {
		response.InternalError(c, "Failed to retrieve available kode menu")
		return
	}

	response.Success(c, "Available kode menu retrieved successfully", result)
}

// ============================================================================
// Filters
// ============================================================================

// GetFilters godoc
// @Summary Get Report Filters
// @Description Fetch all filters for a report
// @Tags Reports Admin
// @Produce json
// @Param id path int true "Report ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/filters [get]
func (h *SReportsHandler) GetFilters(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	filters, err := h.service.GetFilters(c.Request.Context(), id)
	if err != nil {
		response.InternalError(c, "Failed to retrieve filters")
		return
	}

	response.Success(c, "Filters retrieved successfully", filters)
}

// CreateFilter godoc
// @Summary Create Filter
// @Description Create a new filter for a report
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param id path int true "Report ID"
// @Param request body SCreateFilterRequest true "Filter Data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/filters [post]
func (h *SReportsHandler) CreateFilter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	var req SCreateFilterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	filter, err := h.service.CreateFilter(c.Request.Context(), id, &req)
	if err != nil {
		response.InternalError(c, "Failed to create filter")
		return
	}

	response.Created(c, "Filter created successfully", filter)
}

// UpdateFilter godoc
// @Summary Update Filter
// @Description Update an existing filter
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param filter_id path int true "Filter ID"
// @Param request body SUpdateFilterRequest true "Filter Data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/filters/{filter_id} [put]
func (h *SReportsHandler) UpdateFilter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("filter_id"))
	if err != nil {
		response.BadRequest(c, "Invalid filter ID")
		return
	}

	var req SUpdateFilterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	filter, err := h.service.UpdateFilter(c.Request.Context(), id, &req)
	if err != nil {
		response.InternalError(c, "Failed to update filter")
		return
	}

	response.Success(c, "Filter updated successfully", filter)
}

// DeleteFilter godoc
// @Summary Delete Filter
// @Description Delete a filter
// @Tags Reports Admin
// @Produce json
// @Param filter_id path int true "Filter ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/filters/{filter_id} [delete]
func (h *SReportsHandler) DeleteFilter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("filter_id"))
	if err != nil {
		response.BadRequest(c, "Invalid filter ID")
		return
	}

	if err := h.service.DeleteFilter(c.Request.Context(), id); err != nil {
		response.InternalError(c, "Failed to delete filter")
		return
	}

	response.Success(c, "Filter deleted successfully", nil)
}

// ReorderFilters godoc
// @Summary Reorder Filters
// @Description Update the position/order of multiple filters
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param id path int true "Report ID"
// @Param request body SReorderFiltersRequest true "Filter Orders"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/filters/reorder [put]
func (h *SReportsHandler) ReorderFilters(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	var req SReorderFiltersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	if err := h.service.ReorderFilters(c.Request.Context(), id, &req); err != nil {
		response.InternalError(c, "Failed to reorder filters")
		return
	}

	response.Success(c, "Filters reordered successfully", nil)
}

// ============================================================================
// Datasets
// ============================================================================

// GetDatasets godoc
// @Summary Get Report Datasets
// @Description Fetch all datasets (queries) for a report
// @Tags Reports Admin
// @Produce json
// @Param id path int true "Report ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/datasets [get]
func (h *SReportsHandler) GetDatasets(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	datasets, err := h.service.GetDatasets(c.Request.Context(), id)
	if err != nil {
		response.InternalError(c, "Failed to retrieve datasets")
		return
	}

	response.Success(c, "Datasets retrieved successfully", datasets)
}

// CreateDataset godoc
// @Summary Create Dataset
// @Description Create a new dataset (query) for a report
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param id path int true "Report ID"
// @Param request body SCreateDatasetRequest true "Dataset Data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/datasets [post]
func (h *SReportsHandler) CreateDataset(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	var req SCreateDatasetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	dataset, err := h.service.CreateDataset(c.Request.Context(), id, &req)
	if err != nil {
		response.InternalError(c, "Failed to create dataset")
		return
	}

	response.Created(c, "Dataset created successfully", dataset)
}

// UpdateDataset godoc
// @Summary Update Dataset
// @Description Update an existing dataset
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param dataset_id path int true "Dataset ID"
// @Param request body SUpdateDatasetRequest true "Dataset Data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/datasets/{dataset_id} [put]
func (h *SReportsHandler) UpdateDataset(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("dataset_id"))
	if err != nil {
		response.BadRequest(c, "Invalid dataset ID")
		return
	}

	var req SUpdateDatasetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	dataset, err := h.service.UpdateDataset(c.Request.Context(), id, &req)
	if err != nil {
		response.InternalError(c, "Failed to update dataset")
		return
	}

	response.Success(c, "Dataset updated successfully", dataset)
}

// DeleteDataset godoc
// @Summary Delete Dataset
// @Description Delete a dataset
// @Tags Reports Admin
// @Produce json
// @Param dataset_id path int true "Dataset ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/datasets/{dataset_id} [delete]
func (h *SReportsHandler) DeleteDataset(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("dataset_id"))
	if err != nil {
		response.BadRequest(c, "Invalid dataset ID")
		return
	}

	if err := h.service.DeleteDataset(c.Request.Context(), id); err != nil {
		response.InternalError(c, "Failed to delete dataset")
		return
	}

	response.Success(c, "Dataset deleted successfully", nil)
}

// PreviewDataset godoc
// @Summary Preview Dataset Query
// @Description Preview the results of a dataset query with optional filters
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param id path int true "Report ID"
// @Param request body SPreviewQueryRequest true "Query and Filters"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/datasets/preview [post]
func (h *SReportsHandler) PreviewDataset(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	_ = id // unused but validated

	var req SPreviewQueryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	result, err := h.service.PreviewQuery(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, "Failed to preview query")
		return
	}

	response.Success(c, "Query preview completed", result)
}

// ============================================================================
// Columns
// ============================================================================

// GetColumns godoc
// @Summary Get Report Columns
// @Description Fetch all columns for a report grouped by dataset
// @Tags Reports Admin
// @Produce json
// @Param id path int true "Report ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/columns [get]
func (h *SReportsHandler) GetColumns(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	columns, err := h.service.GetAllColumns(c.Request.Context(), id)
	if err != nil {
		response.InternalError(c, "Failed to retrieve columns")
		return
	}

	response.Success(c, "Columns retrieved successfully", columns)
}

// CreateColumn godoc
// @Summary Create Column
// @Description Create a new column configuration for a report
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param id path int true "Report ID"
// @Param request body SCreateColumnRequest true "Column Data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/columns [post]
func (h *SReportsHandler) CreateColumn(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	var req SCreateColumnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	column, err := h.service.CreateColumn(c.Request.Context(), id, &req)
	if err != nil {
		response.InternalError(c, "Failed to create column")
		return
	}

	response.Created(c, "Column created successfully", column)
}

// UpdateColumn godoc
// @Summary Update Column
// @Description Update an existing column configuration
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param column_id path int true "Column ID"
// @Param request body SUpdateColumnRequest true "Column Data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/columns/{column_id} [put]
func (h *SReportsHandler) UpdateColumn(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("column_id"))
	if err != nil {
		response.BadRequest(c, "Invalid column ID")
		return
	}

	var req SUpdateColumnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	column, err := h.service.UpdateColumn(c.Request.Context(), id, &req)
	if err != nil {
		response.InternalError(c, "Failed to update column")
		return
	}

	response.Success(c, "Column updated successfully", column)
}

// DeleteColumn godoc
// @Summary Delete Column
// @Description Delete a column configuration
// @Tags Reports Admin
// @Produce json
// @Param column_id path int true "Column ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/columns/{column_id} [delete]
func (h *SReportsHandler) DeleteColumn(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("column_id"))
	if err != nil {
		response.BadRequest(c, "Invalid column ID")
		return
	}

	if err := h.service.DeleteColumn(c.Request.Context(), id); err != nil {
		response.InternalError(c, "Failed to delete column")
		return
	}

	response.Success(c, "Column deleted successfully", nil)
}

// ============================================================================
// Groups
// ============================================================================

// GetGroups godoc
// @Summary Get Report Groups
// @Description Fetch all grouping configurations for a report
// @Tags Reports Admin
// @Produce json
// @Param id path int true "Report ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/groups [get]
func (h *SReportsHandler) GetGroups(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	groups, err := h.service.GetGroups(c.Request.Context(), id)
	if err != nil {
		response.InternalError(c, "Failed to retrieve groups")
		return
	}

	response.Success(c, "Groups retrieved successfully", groups)
}

// CreateGroup godoc
// @Summary Create Group
// @Description Create a new grouping configuration for a report
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param id path int true "Report ID"
// @Param request body SCreateGroupRequest true "Group Data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/groups [post]
func (h *SReportsHandler) CreateGroup(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	var req SCreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	group, err := h.service.CreateGroup(c.Request.Context(), id, &req)
	if err != nil {
		response.InternalError(c, "Failed to create group")
		return
	}

	response.Created(c, "Group created successfully", group)
}

// UpdateGroup godoc
// @Summary Update Group
// @Description Update an existing grouping configuration
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param group_id path int true "Group ID"
// @Param request body SUpdateGroupRequest true "Group Data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/groups/{group_id} [put]
func (h *SReportsHandler) UpdateGroup(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("group_id"))
	if err != nil {
		response.BadRequest(c, "Invalid group ID")
		return
	}

	var req SUpdateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	group, err := h.service.UpdateGroup(c.Request.Context(), id, &req)
	if err != nil {
		response.InternalError(c, "Failed to update group")
		return
	}

	response.Success(c, "Group updated successfully", group)
}

// DeleteGroup godoc
// @Summary Delete Group
// @Description Delete a grouping configuration
// @Tags Reports Admin
// @Produce json
// @Param group_id path int true "Group ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/groups/{group_id} [delete]
func (h *SReportsHandler) DeleteGroup(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("group_id"))
	if err != nil {
		response.BadRequest(c, "Invalid group ID")
		return
	}

	if err := h.service.DeleteGroup(c.Request.Context(), id); err != nil {
		response.InternalError(c, "Failed to delete group")
		return
	}

	response.Success(c, "Group deleted successfully", nil)
}

// ============================================================================
// Komponen
// ============================================================================

// GetKomponen godoc
// @Summary Get Komponen
// @Description Fetch all layout components for a report
// @Tags Reports Admin
// @Produce json
// @Param id path int true "Report ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/komponen [get]
func (h *SReportsHandler) GetKomponen(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	komponen, err := h.service.GetKomponen(c.Request.Context(), id)
	if err != nil {
		response.InternalError(c, "Failed to retrieve komponen")
		return
	}

	response.Success(c, "Komponen retrieved successfully", komponen)
}

// UpsertKomponen godoc
// @Summary Upsert Komponen
// @Description Create or update a layout component by name for a report
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param id path int true "Report ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/komponen [put]
func (h *SReportsHandler) UpsertKomponen(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	var req SKomponenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body: "+err.Error())
		return
	}

	result, err := h.service.UpsertKomponen(c.Request.Context(), id, &req)
	if err != nil {
		response.InternalError(c, "Failed to upsert komponen: "+err.Error())
		return
	}

	response.Success(c, "Komponen saved successfully", result)
}

// ============================================================================
// User Access
// ============================================================================

// GetUserAccess godoc
// @Summary Get User Access
// @Description Fetch all user access permissions for a report
// @Tags Reports Admin
// @Produce json
// @Param id path int true "Report ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/access [get]
func (h *SReportsHandler) GetUserAccess(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	report, err := h.service.GetReport(c.Request.Context(), id)
	if err != nil {
		response.InternalError(c, "Failed to retrieve report")
		return
	}

	access, err := h.service.GetUserAccess(c.Request.Context(), report.KODEMENU)
	if err != nil {
		response.InternalError(c, "Failed to retrieve user access")
		return
	}

	response.Success(c, "User access retrieved successfully", access)
}

// GetAllUsers godoc
// @Summary Get All Users
// @Description Fetch all available users for granting access
// @Tags Reports Admin
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/users [get]
func (h *SReportsHandler) GetAllUsers(c *gin.Context) {
	users, err := h.service.GetAllUsers(c.Request.Context())
	if err != nil {
		response.InternalError(c, "Failed to retrieve users")
		return
	}

	response.Success(c, "Users retrieved successfully", users)
}

// GrantAccess godoc
// @Summary Grant User Access
// @Description Grant or update a user's access to a report
// @Tags Reports Admin
// @Accept json
// @Produce json
// @Param id path int true "Report ID"
// @Param request body SGrantAccessRequest true "Access Data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/access [post]
func (h *SReportsHandler) GrantAccess(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	report, err := h.service.GetReport(c.Request.Context(), id)
	if err != nil {
		response.InternalError(c, "Failed to retrieve report")
		return
	}

	var req SGrantAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload: "+err.Error())
		return
	}

	access, err := h.service.GrantAccess(c.Request.Context(), report.KODEMENU, &req)
	if err != nil {
		response.InternalError(c, "Failed to grant access")
		return
	}

	response.Success(c, "Access granted successfully", access)
}

// RevokeAccess godoc
// @Summary Revoke User Access
// @Description Remove a user's access to a report
// @Tags Reports Admin
// @Produce json
// @Param id path int true "Report ID"
// @Param user_id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/reports/{id}/access/{user_id} [delete]
func (h *SReportsHandler) RevokeAccess(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid report ID")
		return
	}

	userId := c.Param("user_id")

	report, err := h.service.GetReport(c.Request.Context(), id)
	if err != nil {
		response.InternalError(c, "Failed to retrieve report")
		return
	}

	access, err := h.service.RevokeAccess(c.Request.Context(), report.KODEMENU, userId)
	if err != nil {
		response.InternalError(c, "Failed to revoke access")
		return
	}

	response.Success(c, "Access revoked successfully", access)
}
