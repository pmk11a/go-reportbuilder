package menu

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes attaches all menu-domain admin routes to the given router group.
// The caller decides which middlewares to apply (typically RoleMiddleware("admin")).
//
// Routes:
//   GET    /menu
//   GET    /menu/parents
//   GET    /menu/:kode
//   POST   /menu
//   PUT    /menu/:kode
//   DELETE /menu/:kode
func RegisterRoutes(rg *gin.RouterGroup, h *SMenuHandler) {
	rg.GET("/menu", h.GetAllMenus)
	rg.GET("/menu/parents", h.GetParentMenus)
	rg.GET("/menu/:kode", h.GetMenuByID)
	rg.POST("/menu", h.CreateMenu)
	rg.PUT("/menu/:kode", h.UpdateMenu)
	rg.DELETE("/menu/:kode", h.DeleteMenu)
}
