package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/services"
	"github.com/masza1/dapen-backend/internal/utils"
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
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	periode, err := h.periodeService.GetPeriode(legacyUserID.(string))
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Success(c, "Success", periode)
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
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	var req SetPeriodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	err := h.periodeService.SetPeriode(legacyUserID.(string), req.BULAN, req.TAHUN)
	if err != nil {
		utils.InternalError(c, "Failed to set periode")
		return
	}

	utils.Success(c, "Periode berhasil diupdate", nil)
}
