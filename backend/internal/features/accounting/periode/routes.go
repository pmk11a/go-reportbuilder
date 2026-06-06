package periode

import (
	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/legacy/handlers"
)

// RegisterRoutes attaches the legacy Berkas /periode routes. The actual
// handler still lives in internal/legacy/handlers/periode_handler.go (which depends
// on legacy models + services) and will be fully migrated in a follow-up
// sprint. This wrapper exists so the route registration is colocated with
// the accounting domain that will eventually own the business logic.
//
// Routes:
//   GET  /berkas/get-periode
//   PUT  /berkas/set-periode
func RegisterRoutes(rg *gin.RouterGroup, h *handlers.SPeriodeHandler) {
	rg.GET("/berkas/get-periode", h.GetPeriode)
	rg.PUT("/berkas/set-periode", h.SetPeriode)
}
