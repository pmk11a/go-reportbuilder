package permission

import (
	"strconv"
	"fmt"
	"time"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/shared/response"
)

// SPermissionHandler is the HTTP layer for the identity/permission sub-domain.
// It owns the routes under /api/admin/users/{id}/permissions/* and
// /api/admin/reports/permissions. Routes are registered in routes.go.
type SPermissionHandler struct {
	repo IPermissionRepository
	svc  IPermissionService
}

// NewPermissionHandler constructs the permission handler with its
// repository and service dependencies.
func NewPermissionHandler(repo IPermissionRepository, svc IPermissionService) *SPermissionHandler {
	return &SPermissionHandler{repo: repo, svc: svc}
}

func (h *SPermissionHandler) GetUserPermissions(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	menuPerms, reportPerms, coaAccess, err := h.repo.GetUserPermissions(userID)
	if err != nil {
		response.InternalError(c, "Failed to retrieve permissions: "+err.Error())
		return
	}

	response.Success(c, "User permissions retrieved successfully", gin.H{
		"menu":   menuPerms,
		"report": reportPerms,
		"coa":    coaAccess,
	})
}

// UpdateUserPermissions godoc
// @Summary Update User Permissions
// @Description Update checked, aktif, and ACCESS values for dbmenu, dbmenureport, and DBAKSESPERKIRAAN for a given user
// @Tags User
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param body body SUpdateUserPermissionsPayload true "Update User Permissions Payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users/{id}/permissions [put]

func (h *SPermissionHandler) UpdateUserPermissions(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	var payload SUpdateUserPermissionsPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.BadRequest(c, "Invalid input: "+err.Error())
		return
	}

	// Map DTO payload to model structs for the repository layer
	menuPerms := make([]SUserPermission, len(payload.Menu))
	for i, p := range payload.Menu {
		menuPerms[i] = SUserPermission{
			KodeMenu:   p.KodeMenu,
			Keterangan: p.Keterangan,
			L0:         p.L0,
			L1:         p.L1,
			L2:         p.L2,
			L3:         p.L3,
			Checked:    p.Checked,
			Aktif:      p.Aktif,
			Access:     p.Access,
			Icon:       p.Icon,
			Routename:  p.Routename,
			// Granular permissions
			HasAccess:  p.HasAccess,
			IsCreate:   p.IsCreate,
			IsUpdate:   p.IsUpdate,
			IsDelete:   p.IsDelete,
			IsPrint:    p.IsPrint,
			IsExport:   p.IsExport,
			IsApprove1: p.IsApprove1,
			IsApprove2: p.IsApprove2,
			IsApprove3: p.IsApprove3,
			IsApprove4: p.IsApprove4,
			IsApprove5: p.IsApprove5,
			IsCanceled: p.IsCanceled,
		}
	}

	reportPerms := make([]SUserPermission, len(payload.Report))
	for i, p := range payload.Report {
		reportPerms[i] = SUserPermission{
			KodeMenu:   p.KodeMenu,
			Keterangan: p.Keterangan,
			L0:         p.L0,
			L1:         p.L1,
			L2:         p.L2,
			L3:         p.L3,
			Checked:    p.Checked,
			Aktif:      p.Aktif,
			Access:     p.Access,
			Icon:       p.Icon,
			Routename:  p.Routename,
			// Granular permissions
			HasAccess:  p.HasAccess,
			IsCreate:   p.IsCreate,
			IsUpdate:   p.IsUpdate,
			IsDelete:   p.IsDelete,
			IsPrint:    p.IsPrint,
			IsExport:   p.IsExport,
			IsApprove1: p.IsApprove1,
			IsApprove2: p.IsApprove2,
			IsApprove3: p.IsApprove3,
			IsApprove4: p.IsApprove4,
			IsApprove5: p.IsApprove5,
			IsCanceled: p.IsCanceled,
		}
	}

	coaPerms := make([]SUserCoaAccess, len(payload.Coa))
	for i, c := range payload.Coa {
		coaPerms[i] = SUserCoaAccess{
			Perkiraan:  c.Perkiraan,
			Keterangan: c.Keterangan,
			Checked:    c.Checked,
		}
	}

	err := h.repo.UpdateUserPermissions(userID, menuPerms, reportPerms, coaPerms)
	if err != nil {
		response.InternalError(c, "Failed to update permissions: "+err.Error())
		return
	}

	response.Success(c, "User permissions updated successfully", nil)
}

// GetUserMenuPermissions godoc
// @Summary Get User Menu Permissions
// @Description Fetch only the menu (dbmenu) permissions for a given user. This is
// @Description one of three split endpoints introduced by TASK-009 to enable
// @Description per-tab caching on the frontend.
// @Tags User
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users/{id}/permissions/menu [get]

func (h *SPermissionHandler) GetUserMenuPermissions(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.BadRequest(c, "Invalid user ID")
		return
	}
	if h.svc == nil {
		response.InternalError(c, "User service is not configured")
		return
	}

	perms, err := h.svc.GetUserMenuPermissions(userID)
	if err != nil {
		response.InternalError(c, "Failed to retrieve menu permissions: "+err.Error())
		return
	}

	response.Success(c, "Menu permissions retrieved successfully", perms)
}

// GetUserReportPermissions godoc
// @Summary Get User Report Permissions
// @Description Fetch only the report (dbmenureport) permissions for a given user.
// @Tags User
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users/{id}/permissions/report [get]

func (h *SPermissionHandler) GetUserReportPermissions(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.BadRequest(c, "Invalid user ID")
		return
	}
	if h.svc == nil {
		response.InternalError(c, "User service is not configured")
		return
	}

	perms, err := h.svc.GetUserReportPermissions(userID)
	if err != nil {
		response.InternalError(c, "Failed to retrieve report permissions: "+err.Error())
		return
	}

	response.Success(c, "Report permissions retrieved successfully", perms)
}

// GetUserCoaAccess godoc
// @Summary Get User COA Access
// @Description Fetch only the COA (DBAKSESPERKIRAAN) access entries for a given user.
// @Tags User
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users/{id}/permissions/coa [get]

func (h *SPermissionHandler) GetUserCoaAccess(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.BadRequest(c, "Invalid user ID")
		return
	}
	if h.svc == nil {
		response.InternalError(c, "User service is not configured")
		return
	}

	coa, err := h.svc.GetUserCoaAccess(userID)
	if err != nil {
		response.InternalError(c, "Failed to retrieve COA access: "+err.Error())
		return
	}

	response.Success(c, "COA access retrieved successfully", coa)
}

// GetPermissionReport godoc
// @Summary Permission Report
// @Description Returns a matrix of users × menus × permissions. Supports JSON,
// @Description Excel (.xlsx) and PDF output via the `format` query param.
// @Description `userId` and `menuId` are optional filters; `menuType` selects
// @Description between `menu` (dbmenu, default) and `report` (dbmenureport).
// @Description The Excel and PDF responses are streamed and require at least
// @Description one filter (userId or menuId) to avoid an OOM on the full matrix.
// @Tags User
// @Produce json
// @Produce octet-stream
// @Param format query string false "Output format" Enums(json, xlsx, pdf) default(json)
// @Param userId query string false "Filter by user ID"
// @Param menuId query string false "Filter by menu code"
// @Param menuType query string false "menu or report" Enums(menu, report) default(menu)
// @Param page query int false "Page Number" default(1)
// @Param perPage query int false "Per page" default(50)
// @Success 200 {object} SPermissionReportResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/reports/permissions [get]

func (h *SPermissionHandler) GetPermissionReport(c *gin.Context) {
	if h.svc == nil {
		response.InternalError(c, "User service is not configured")
		return
	}

	format := strings.ToLower(c.DefaultQuery("format", "json"))
	switch format {
	case "json", "xlsx", "pdf":
	default:
		response.BadRequest(c, "Invalid format: must be one of json, xlsx, pdf")
		return
	}

	// Filters
	filters := SReportFilters{
		MenuType: c.DefaultQuery("menuType", "menu"),
		Page:     1,
		PerPage:  50,
	}
	if v := c.Query("userId"); v != "" {
		filters.UserID = &v
	}
	if v := c.Query("menuId"); v != "" {
		filters.MenuID = &v
	}
	if p, err := strconv.Atoi(c.DefaultQuery("page", "1")); err == nil && p > 0 {
		filters.Page = p
	}
	if pp, err := strconv.Atoi(c.DefaultQuery("perPage", "50")); err == nil && pp > 0 {
		filters.PerPage = pp
	}

	// For Excel/PDF we export the FULL set (no pagination) so the user gets
	// one continuous file. Excel streams and PDF paginates internally.
	// We also enforce "at least one filter" for these formats to prevent
	// accidental full-matrix exports (risk of OOM).
	exportAll := false
	if format == "xlsx" || format == "pdf" {
		if (filters.UserID == nil || *filters.UserID == "") && (filters.MenuID == nil || *filters.MenuID == "") {
			response.BadRequest(c, "Excel/PDF export requires at least one filter (userId or menuId)")
			return
		}
		exportAll = true
	}

	userID := ""
	if filters.UserID != nil {
		userID = *filters.UserID
	}
	menuID := ""
	if filters.MenuID != nil {
		menuID = *filters.MenuID
	}

	page := filters.Page
	pageSize := filters.PerPage
	if exportAll {
		page = 0
		pageSize = 0
	}

	rows, total, err := h.svc.GetPermissionReportMatrix(userID, menuID, filters.MenuType, page, pageSize)
	if err != nil {
		response.InternalError(c, "Failed to build permission report: "+err.Error())
		return
	}

	// Convert from model rows to DTO rows once. Both the JSON and the
	// binary exporters (xlsx / pdf) consume the same DTO shape.
	dtoRows := make([]SPermissionReportRowDTO, 0, len(rows))
	for _, r := range rows {
		dtoRows = append(dtoRows, SPermissionReportRowDTO{
			UserID:     r.UserID,
			Username:   r.Username,
			FullName:   r.FullName,
			Role:       r.Role,
			MenuCode:   r.MenuCode,
			MenuName:   r.MenuName,
			MenuType:   r.MenuType,
			HasAccess:  r.HasAccess,
			IsCreate:   r.IsCreate,
			IsUpdate:   r.IsUpdate,
			IsDelete:   r.IsDelete,
			IsPrint:    r.IsPrint,
			IsExport:   r.IsExport,
			IsApprove1: r.IsApprove1,
			IsApprove2: r.IsApprove2,
			IsApprove3: r.IsApprove3,
			IsApprove4: r.IsApprove4,
			IsApprove5: r.IsApprove5,
			IsCanceled: r.IsCanceled,
		})
	}

	switch format {
	case "json":
		response.Success(c, "Permission report retrieved successfully", SPermissionReportResponse{
			Data:    dtoRows,
			Total:   total,
			Page:    filters.Page,
			PerPage: filters.PerPage,
		})
	case "xlsx":
		filename := fmt.Sprintf("permission-report-%s.xlsx", time.Now().Format("20060102-150405"))
		c.Header("Content-Disposition", "attachment; filename="+filename)
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		if err := formatPermissionReportXLSX(dtoRows, filters, c.Writer); err != nil {
			response.InternalError(c, "Failed to write xlsx: "+err.Error())
			return
		}
	case "pdf":
		filename := fmt.Sprintf("permission-report-%s.pdf", time.Now().Format("20060102-150405"))
		c.Header("Content-Disposition", "attachment; filename="+filename)
		c.Header("Content-Type", "application/pdf")
		if err := formatPermissionReportPDF(dtoRows, filters, c.Writer); err != nil {
			response.InternalError(c, "Failed to write pdf: "+err.Error())
			return
		}
	}
}
