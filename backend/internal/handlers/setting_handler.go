package handlers

import (
	"net/http"

	"github.com/masza1/dapen-backend/internal/models"
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
			// Return empty object if not found
			c.JSON(http.StatusOK, gin.H{"data": models.SDBPERUSAHAAN{}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": company})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create company data"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
	} else {
		// Update existing
		// Since KODEUSAHA is the primary key, we must retain it or explicitly update it
		payload.KODEUSAHA = existing.KODEUSAHA
		if err := h.db.Save(&payload).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update company data"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company data updated successfully", "data": payload})
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
			c.JSON(http.StatusOK, gin.H{"data": models.SDBNOMOR{}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch numbering data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": numbers})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existing models.SDBNOMOR
	if err := h.db.First(&existing).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Insert new
			if err := h.db.Create(&payload).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create numbering data"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
	} else {
		// Update existing. DBNOMOR doesn't have a primary key, which makes GORM Save() difficult.
		// Usually we just delete and re-insert, or update without condition if there's only one row.
		// Here we'll just clear the table and insert the new one to be safe, since it's a single config row.
		if err := h.db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.SDBNOMOR{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old numbering data"})
			return
		}
		if err := h.db.Create(&payload).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create new numbering data"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Numbering data updated successfully", "data": payload})
}
