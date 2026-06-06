package permission

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes attaches all identity/permission routes to the given router
// group. The authMW argument is accepted for symmetry with user.RegisterRoutes
// but is currently unused here — the parent router is expected to be
// already protected by AuthMiddleware + RoleMiddleware("admin").
//
// Routes:
//   GET    /users/:id/permissions
//   PUT    /users/:id/permissions
//   GET    /users/:id/permissions/menu
//   GET    /users/:id/permissions/report
//   GET    /users/:id/permissions/coa
//   GET    /reports/permissions
func RegisterRoutes(rg *gin.RouterGroup, h *SPermissionHandler, authMW gin.HandlerFunc) {
	_ = authMW // accepted for caller consistency; not applied here

	users := rg.Group("/users")
	{
		users.GET("/:id/permissions", h.GetUserPermissions)
		users.PUT("/:id/permissions", h.UpdateUserPermissions)
		users.GET("/:id/permissions/menu", h.GetUserMenuPermissions)
		users.GET("/:id/permissions/report", h.GetUserReportPermissions)
		users.GET("/:id/permissions/coa", h.GetUserCoaAccess)
	}

	reports := rg.Group("/reports")
	{
		reports.GET("/permissions", h.GetPermissionReport)
	}
}
