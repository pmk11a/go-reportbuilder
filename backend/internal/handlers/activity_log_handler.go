package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/dto"
	"github.com/masza1/dapen-backend/internal/services"
	"github.com/masza1/dapen-backend/internal/utils"
)

type SActivityLogHandler struct {
	service services.IActivityLogService
}

func NewActivityLogHandler(service services.IActivityLogService) *SActivityLogHandler {
	return &SActivityLogHandler{service: service}
}

// GetConfigs godoc
// @Summary Get Activity Log Configs
// @Description Fetch all activity log configurations
// @Tags Activity Log
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/activity-logs/configs [get]
func (h *SActivityLogHandler) GetConfigs(c *gin.Context) {
	configs, err := h.service.GetConfigs()
	if err != nil {
		utils.InternalError(c, "Failed to retrieve configurations")
		return
	}
	utils.Success(c, "Configurations retrieved successfully", configs)
}

// GetConfigByTableName godoc
// @Summary Get Log Config by Table Name
// @Description Fetch activity log configuration for a specific table
// @Tags Activity Log
// @Produce json
// @Param table_name path string true "Table Name"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/activity-logs/configs/{table_name} [get]
func (h *SActivityLogHandler) GetConfigByTableName(c *gin.Context) {
	tableName := c.Param("table_name")
	config, err := h.service.GetConfigByTableName(tableName)
	if err != nil {
		// Could be not found
		utils.Success(c, "Configuration not found", nil)
		return
	}
	utils.Success(c, "Configuration retrieved successfully", config)
}

// SaveConfig godoc
// @Summary Save Activity Log Config
// @Description Create or update an activity log configuration
// @Tags Activity Log
// @Accept json
// @Produce json
// @Param request body dto.SActivityLogConfigReq true "Configuration Data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/activity-logs/configs [post]
func (h *SActivityLogHandler) SaveConfig(c *gin.Context) {
	var req dto.SActivityLogConfigReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request payload")
		return
	}

	if err := h.service.SaveConfig(&req); err != nil {
		utils.InternalError(c, "Failed to save configuration")
		return
	}
	utils.Success(c, "Configuration saved successfully", nil)
}

// GetLogs godoc
// @Summary Get Activity Logs
// @Description Fetch a paginated list of activity logs
// @Tags Activity Log
// @Produce json
// @Param page query int false "Page Number" default(1)
// @Param limit query int false "Limit per page" default(10)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/activity-logs [get]
func (h *SActivityLogHandler) GetLogs(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	offset := (page - 1) * limit

	logs, count, err := h.service.GetLogs(limit, offset)
	if err != nil {
		utils.InternalError(c, "Failed to retrieve logs")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"status":  http.StatusOK,
		"message": "Logs retrieved successfully",
		"data":    logs,
		"meta": gin.H{
			"total": count,
			"page":  page,
			"limit": limit,
		},
	})
}

// GetTables godoc
// @Summary Get All Database Tables
// @Description Fetch a list of all tables in the database for configuration
// @Tags Database
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/database/tables [get]
func (h *SActivityLogHandler) GetTables(c *gin.Context) {
	tables, err := h.service.GetTables()
	if err != nil {
		utils.InternalError(c, "Failed to retrieve tables")
		return
	}
	utils.Success(c, "Tables retrieved successfully", tables)
}

// GetTableColumns godoc
// @Summary Get Columns for Table
// @Description Fetch a list of columns for a specific database table
// @Tags Database
// @Produce json
// @Param table_name path string true "Table Name"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/database/tables/{table_name}/columns [get]
func (h *SActivityLogHandler) GetTableColumns(c *gin.Context) {
	tableName := c.Param("table_name")
	columns, err := h.service.GetTableColumns(tableName)
	if err != nil {
		utils.InternalError(c, "Failed to retrieve columns")
		return
	}
	utils.Success(c, "Columns retrieved successfully", columns)
}
