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

func (h *SActivityLogHandler) GetConfigs(c *gin.Context) {
	configs, err := h.service.GetConfigs()
	if err != nil {
		utils.InternalError(c, "Failed to retrieve configurations")
		return
	}
	utils.Success(c, "Configurations retrieved successfully", configs)
}

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

func (h *SActivityLogHandler) GetTables(c *gin.Context) {
	tables, err := h.service.GetTables()
	if err != nil {
		utils.InternalError(c, "Failed to retrieve tables")
		return
	}
	utils.Success(c, "Tables retrieved successfully", tables)
}

func (h *SActivityLogHandler) GetTableColumns(c *gin.Context) {
	tableName := c.Param("table_name")
	columns, err := h.service.GetTableColumns(tableName)
	if err != nil {
		utils.InternalError(c, "Failed to retrieve columns")
		return
	}
	utils.Success(c, "Columns retrieved successfully", columns)
}
