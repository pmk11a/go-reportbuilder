package berkas

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

func (h *SPeriodeHandler) GetPeriode(c *gin.Context) {
	// Assuming userID is set in context by auth middleware
	userID, exists := c.Get("userID")
	if !exists {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	periode, err := h.periodeService.GetPeriode(userID.(string))
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

func (h *SPeriodeHandler) SetPeriode(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	var req SetPeriodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	err := h.periodeService.SetPeriode(userID.(string), req.BULAN, req.TAHUN)
	if err != nil {
		utils.InternalError(c, "Failed to set periode")
		return
	}

	utils.Success(c, "Periode berhasil diupdate", nil)
}
