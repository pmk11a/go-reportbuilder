package execution

import (
	"github.com/gin-gonic/gin"
)

// RegisterExecutionRoutes attaches all user-facing report execution routes to the given router group.
// Routes:
//   GET  /reports/menu                        - Get sidebar menu for user
//   GET  /reports/:kodeMenu                   - Get report configuration
//   POST /reports/:kodeMenu/preview            - Execute report and get data
func RegisterExecutionRoutes(rg *gin.RouterGroup, h *SReportExecutionHandler) {
	reports := rg.Group("/reports")
	{
		reports.GET("/menu", h.GetSidebarMenu)
		reports.GET("/:kodeMenu", h.GetReportConfig)
		reports.POST("/:kodeMenu/preview", h.ExecuteReport)
	}
}
