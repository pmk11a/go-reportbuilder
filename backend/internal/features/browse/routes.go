// Package browse — route registration.
//
// Browse is a generic lookup facility used by every other feature module
// (Perkiraan, Kas/Bank, Customer/Supplier, etc.). It is therefore
// mounted at /api/browse rather than under a feature-specific path.
//
// The endpoints are intentionally lightweight — they only expose the
// metadata + search endpoints that the Vue browse components call.
// Authentication is required (via the middleware injected at the
// router-group level) but no menu-level permission is enforced, since
// access control is per-use-case and applied at the calling feature
// layer (e.g. kasbank's /lookup-perkiraan is gated by menu 02001).
package browse

import (
	"github.com/gin-gonic/gin"
)

// RegisterBrowseRoutes attaches all browse routes to the given router
// group. The caller decides the parent path (typically "/api").
func RegisterBrowseRoutes(rg *gin.RouterGroup, h *Handler) {
	g := rg.Group("/browse")
	{
		g.GET("/types", h.ListTypes)
		g.GET("/search", h.Search)
		g.GET("/paged", h.SearchPaged)
		g.GET("/all", h.GetAll)
		g.POST("/validate", h.ValidateCode)
		g.POST("/validate-batch", h.ValidateBatch)
	}
}