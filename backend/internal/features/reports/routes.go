package reports

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes attaches all reports-admin routes to the given router group.
// Routes:
//   GET     /admin/reports                        - List all reports
//   POST    /admin/reports                        - Create report
//   GET     /admin/reports/:id                    - Get report detail
//   PUT     /admin/reports/:id                    - Update report
//   DELETE  /admin/reports/:id                    - Delete report
//   GET     /admin/reports/available-kodemenu     - Get available kode menu
//
//   GET     /admin/reports/:id/filters            - Get filters
//   POST    /admin/reports/:id/filters            - Create filter
//   PUT     /admin/reports/:id/filters/reorder    - Reorder filters
//   PUT     /admin/reports/filters/:filter_id     - Update filter
//   DELETE  /admin/reports/filters/:filter_id     - Delete filter
//
//   GET     /admin/reports/:id/datasets           - Get datasets
//   POST    /admin/reports/:id/datasets           - Create dataset
//   POST    /admin/reports/:id/datasets/preview   - Preview dataset query
//   PUT     /admin/reports/datasets/:dataset_id   - Update dataset
//   DELETE  /admin/reports/datasets/:dataset_id   - Delete dataset
//
//   GET     /admin/reports/:id/columns            - Get columns
//   POST    /admin/reports/:id/columns            - Create column
//   PUT     /admin/reports/columns/:column_id     - Update column
//   DELETE  /admin/reports/columns/:column_id     - Delete column
//
//   GET     /admin/reports/:id/groups             - Get groups
//   POST    /admin/reports/:id/groups             - Create group
//   PUT     /admin/reports/groups/:group_id       - Update group
//   DELETE  /admin/reports/groups/:group_id       - Delete group
//
//   GET     /admin/reports/:id/access             - Get user access
//   POST    /admin/reports/:id/access             - Grant access
//   DELETE  /admin/reports/:id/access/:user_id    - Revoke access
//   GET     /admin/reports/users                  - Get all users
func RegisterRoutes(rg *gin.RouterGroup, h *SReportsHandler) {
	reports := rg.Group("/reports")
	{
		// Report CRUD
		reports.GET("", h.ListReports)
		reports.POST("", h.CreateReport)
		reports.GET("/available-kodemenu", h.GetAvailableKodeMenu)
		reports.GET("/users", h.GetAllUsers)

		// Single report resources
		reports.GET("/:id", h.GetReport)
		reports.PUT("/:id", h.UpdateReport)
		reports.DELETE("/:id", h.DeleteReport)

		// Filters
		reports.GET("/:id/filters", h.GetFilters)
		reports.POST("/:id/filters", h.CreateFilter)
		reports.PUT("/:id/filters/reorder", h.ReorderFilters)

		// Datasets
		reports.GET("/:id/datasets", h.GetDatasets)
		reports.POST("/:id/datasets", h.CreateDataset)
		reports.POST("/:id/datasets/preview", h.PreviewDataset)

		// Columns
		reports.GET("/:id/columns", h.GetColumns)
		reports.POST("/:id/columns", h.CreateColumn)

		// Groups
		reports.GET("/:id/groups", h.GetGroups)
		reports.POST("/:id/groups", h.CreateGroup)

		// User Access
		reports.GET("/:id/access", h.GetUserAccess)
		reports.POST("/:id/access", h.GrantAccess)
		reports.DELETE("/:id/access/:user_id", h.RevokeAccess)

		// Nested resource updates/deletes
		reports.PUT("/filters/:filter_id", h.UpdateFilter)
		reports.DELETE("/filters/:filter_id", h.DeleteFilter)

		reports.PUT("/datasets/:dataset_id", h.UpdateDataset)
		reports.DELETE("/datasets/:dataset_id", h.DeleteDataset)

		reports.PUT("/columns/:column_id", h.UpdateColumn)
		reports.DELETE("/columns/:column_id", h.DeleteColumn)

		reports.PUT("/groups/:group_id", h.UpdateGroup)
		reports.DELETE("/groups/:group_id", h.DeleteGroup)
	}
}
