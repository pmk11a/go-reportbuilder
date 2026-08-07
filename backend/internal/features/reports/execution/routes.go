package execution

import (
	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/features/reports"
)

// RegisterExecutionRoutes attaches all user-facing report execution routes to the given router group.
// Routes:
//   GET  /reports/menu                        - Get sidebar menu for user
//   GET  /reports/:kodeMenu                   - Get report configuration
//   POST /reports/:kodeMenu/preview            - Execute report and get data
//   POST /reports/:kodeMenu/export/xlsx        - Export report as XLSX
//   POST /reports/:kodeMenu/export/pdf         - Export report as PDF
//   POST /reports/:kodeMenu/export/csv         - Export report as CSV
func RegisterExecutionRoutes(rg *gin.RouterGroup, h *SReportExecutionHandler, exportH *reports.SReportExportHandler) {
	reports := rg.Group("/reports")
	{
		reports.GET("/menu", h.GetSidebarMenu)
		reports.GET("/:kodeMenu", h.GetReportConfig)
		reports.POST("/:kodeMenu/preview", h.ExecuteReport)

		// Export endpoints — TASK-027b AC5
		exportGroup := reports.Group("/:kodeMenu/export")
		{
			exportGroup.POST("/xlsx", exportH.ExportXLSX)
			exportGroup.POST("/pdf", exportH.ExportPDF)
			exportGroup.POST("/csv", exportH.ExportCSV)
		}
	}
}
