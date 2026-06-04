package permission

import (
	"github.com/gin-gonic/gin"

	"github.com/masza1/dapen-backend/internal/shared/auth"
)

// RegisterRoutes attaches all identity/permission routes to the given router
// group. The caller decides which prefix + which middlewares to apply.
//
// Routes:
//   GET    /api/admin/users/:id/permissions
//   PUT    /api/admin/users/:id/permissions
//   GET    /api/admin/users/:id/permissions/menu
//   GET    /api/admin/users/:id/permissions/report
//   GET    /api/admin/users/:id/permissions/coa
//   GET    /api/admin/reports/permissions
func RegisterRoutes(rg *gin.RouterGroup, h *SPermissionHandler, authMW gin.HandlerFunc) {
	users := rg.Group("/users")
	users.Use(authMW)
	{
		users.GET("/:id/permissions", h.GetUserPermissions)
		users.PUT("/:id/permissions", h.UpdateUserPermissions)
		users.GET("/:id/permissions/menu", h.GetUserMenuPermissions)
		users.GET("/:id/permissions/report", h.GetUserReportPermissions)
		users.GET("/:id/permissions/coa", h.GetUserCoaAccess)
	}

	// Reports live under /admin/reports/permissions (admin-scoped router).
	// The caller decides which prefix and middlewares to apply (e.g. role guard).
	reports := rg.Group("/reports")
	_ = auth.AuthMiddleware // re-export so callers can apply if needed
	reports.Use(authMW)
	{
		reports.GET("/permissions", h.GetPermissionReport)
	}
}
