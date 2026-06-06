package activity

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes attaches all activity-log admin routes to the given router group.
//
// Routes:
//   GET    /activity-logs
//   GET    /activity-logs/configs
//   GET    /activity-logs/configs/:table_name
//   POST   /activity-logs/configs
//   GET    /database/tables
//   GET    /database/tables/:table_name/columns
func RegisterRoutes(rg *gin.RouterGroup, h *SActivityLogHandler) {
	rg.GET("/activity-logs", h.GetLogs)
	rg.GET("/activity-logs/configs", h.GetConfigs)
	rg.GET("/activity-logs/configs/:table_name", h.GetConfigByTableName)
	rg.POST("/activity-logs/configs", h.SaveConfig)
	rg.GET("/database/tables", h.GetTables)
	rg.GET("/database/tables/:table_name/columns", h.GetTableColumns)
}
