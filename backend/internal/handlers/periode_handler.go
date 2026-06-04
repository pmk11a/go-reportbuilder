package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
	cachepkg "github.com/masza1/dapen-backend/internal/shared/cache"
	"github.com/masza1/dapen-backend/internal/shared/database"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/masza1/dapen-backend/internal/services"
	"github.com/masza1/dapen-backend/internal/shared/response"
)

type SPeriodeHandler struct {
	periodeService services.IPeriodeService
}

func NewPeriodeHandler(periodeService services.IPeriodeService) *SPeriodeHandler {
	return &SPeriodeHandler{periodeService: periodeService}
}

// GetPeriode godoc
// @Summary Get Current Periode
// @Description Fetch the active periode for the user
// @Tags Berkas
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /berkas/get-periode [get]
func (h *SPeriodeHandler) GetPeriode(c *gin.Context) {
	// Assuming userID is set in context by auth middleware
	legacyUserID, exists := c.Get("legacy_user_id")
	if !exists {
		response.Unauthorized(c, "Unauthorized")
		return
	}

	// 1. Check if cache exists (Fail-Open cache check)
	cacheKey := "cache:user:" + legacyUserID.(string) + ":periode"
	cacheManager := cachepkg.NewCacheManager(database.RedisClient)
	bypassCache := c.GetHeader("X-Cache-Bypass") == "true"

	var cachedPeriode models.DBPeriode
	if !bypassCache && cacheManager.Get(c.Request.Context(), cacheKey, &cachedPeriode) {
		response.Success(c, "Success", &cachedPeriode)
		return
	}

	periode, err := h.periodeService.GetPeriode(legacyUserID.(string))
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	// Cache in Redis for 1 Hour (Enterprise Rule #1)
	if periode != nil {
		cacheManager.Set(c.Request.Context(), cacheKey, periode, 1*time.Hour)
	}

	response.Success(c, "Success", periode)
}

type SetPeriodeRequest struct {
	BULAN string `json:"BULAN" binding:"required,len=2"`
	TAHUN string `json:"TAHUN" binding:"required,len=4"`
}

// SetPeriode godoc
// @Summary Set Current Periode
// @Description Update the active periode for the user
// @Tags Berkas
// @Accept json
// @Produce json
// @Param request body SetPeriodeRequest true "Periode Data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /berkas/set-periode [put]
func (h *SPeriodeHandler) SetPeriode(c *gin.Context) {
	legacyUserID, exists := c.Get("legacy_user_id")
	if !exists {
		response.Unauthorized(c, "Unauthorized")
		return
	}

	var req SetPeriodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	err := h.periodeService.SetPeriode(legacyUserID.(string), req.BULAN, req.TAHUN)
	if err != nil {
		response.InternalError(c, "Failed to set periode")
		return
	}

	// Invalidate Cache immediately on mutation (Enterprise Rule #3)
	cacheKey := "cache:user:" + legacyUserID.(string) + ":periode"
	cacheManager := cachepkg.NewCacheManager(database.RedisClient)
	cacheManager.Delete(c.Request.Context(), cacheKey)

	response.Success(c, "Periode berhasil diupdate", nil)
}
