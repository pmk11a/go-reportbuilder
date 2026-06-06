package handlers

import (
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/internal/infrastructure/response"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SSettingHandler struct {
	db *gorm.DB
}

func NewSettingHandler(db *gorm.DB) *SSettingHandler {
	return &SSettingHandler{db: db}
}

// GetCompany godoc
// @Summary Get Company Settings
// @Tags Admin Settings
// @Accept json
// @Produce json
// @Success 200 {object} models.SDBPERUSAHAAN
// @Router /api/admin/settings/company [get]
func (h *SSettingHandler) GetCompany(c *gin.Context) {
	var company models.SDBPERUSAHAAN
	if err := h.db.First(&company).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.Success(c, "Success", models.SDBPERUSAHAAN{})
			return
		}
		response.InternalError(c, "Failed to fetch company data")
		return
	}

	response.Success(c, "Success", company)
}

// UpdateCompany godoc
// @Summary Update Company Settings
// @Tags Admin Settings
// @Accept json
// @Produce json
// @Param body body models.SDBPERUSAHAAN true "Company Data"
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/settings/company [put]
func (h *SSettingHandler) UpdateCompany(c *gin.Context) {
	var payload models.SDBPERUSAHAAN
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	// For legacy compatibility, default KODEUSAHA to '0' if empty
	if payload.KODEUSAHA == "" {
		payload.KODEUSAHA = "0"
	}

	var existing models.SDBPERUSAHAAN
	if err := h.db.First(&existing).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Insert new
			if err := h.db.Create(&payload).Error; err != nil {
				response.InternalError(c, "Failed to create company data")
				return
			}
		} else {
			response.InternalError(c, "Database error")
			return
		}
	} else {
		// Update existing
		payload.KODEUSAHA = existing.KODEUSAHA
		if err := h.db.Save(&payload).Error; err != nil {
			response.InternalError(c, "Failed to update company data")
			return
		}
	}

	response.Success(c, "Company data updated successfully", payload)
}

// GetNumbers godoc
// @Summary Get Numbering Settings
// @Tags Admin Settings
// @Accept json
// @Produce json
// @Success 200 {object} models.SDBNOMOR
// @Router /api/admin/settings/numbers [get]
func (h *SSettingHandler) GetNumbers(c *gin.Context) {
	var numbers models.SDBNOMOR
	if err := h.db.First(&numbers).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.Success(c, "Success", models.SDBNOMOR{})
			return
		}
		response.InternalError(c, "Failed to fetch numbering data")
		return
	}

	response.Success(c, "Success", numbers)
}

// UpdateNumbers godoc
// @Summary Update Numbering Settings
// @Tags Admin Settings
// @Accept json
// @Produce json
// @Param body body models.SDBNOMOR true "Numbering Data"
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/settings/numbers [put]
func (h *SSettingHandler) UpdateNumbers(c *gin.Context) {
	var payload models.SDBNOMOR
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	var existing models.SDBNOMOR
	if err := h.db.First(&existing).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Insert new
			if err := h.db.Create(&payload).Error; err != nil {
				response.InternalError(c, "Failed to create numbering data")
				return
			}
		} else {
			response.InternalError(c, "Database error")
			return
		}
	} else {
		// Update existing. DBNOMOR doesn't have a primary key, clear table and insert.
		if err := h.db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.SDBNOMOR{}).Error; err != nil {
			response.InternalError(c, "Failed to clear old numbering data")
			return
		}
		if err := h.db.Create(&payload).Error; err != nil {
			response.InternalError(c, "Failed to create new numbering data")
			return
		}
	}

	response.Success(c, "Numbering data updated successfully", payload)
}
