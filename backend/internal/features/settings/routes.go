package settings

import (
	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/legacy/handlers"
)

// RegisterRoutes attaches the legacy admin settings routes. The actual
// handler still lives in internal/legacy/handlers/setting_handler.go (depends on
// legacy models SDBPERUSAHAAN + SDBNOMOR) and will be fully migrated in a
// follow-up sprint. This wrapper exists so the route registration is
// colocated with the settings domain that will eventually own the
// business logic.
//
// Routes:
//   GET  /settings/company
//   PUT  /settings/company
//   GET  /settings/numbers
//   PUT  /settings/numbers
//   GET  /settings/generate-no-bukti
//   POST /settings/commit-counter
func RegisterRoutes(rg *gin.RouterGroup, h *handlers.SSettingHandler, genH *SSettingHandler) {
	rg.GET("/settings/company", h.GetCompany)
	rg.PUT("/settings/company", h.UpdateCompany)
	rg.GET("/settings/numbers", h.GetNumbers)
	rg.PUT("/settings/numbers", h.UpdateNumbers)
	rg.GET("/settings/generate-no-bukti", genH.GenerateNoBukti)
	rg.POST("/settings/commit-counter", genH.CommitCounter)
	rg.GET("/settings/features", genH.GetFeatures)
}
