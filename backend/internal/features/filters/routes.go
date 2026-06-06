package filters

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes attaches all shared filter widget routes to the given router group.
// These are public (no role gate) because they back the autocomplete widgets used
// by every authenticated user.
//
// Routes:
//   GET /customers
//   GET /perkiraan
//   GET /perkiraan/kelompok-kas
func RegisterRoutes(rg *gin.RouterGroup, h *SFilterHandler) {
	rg.GET("/customers", h.GetCustomers)
	rg.GET("/perkiraan", h.GetPerkiraan)
	rg.GET("/perkiraan/kelompok-kas", h.GetKelompokKas)
}
