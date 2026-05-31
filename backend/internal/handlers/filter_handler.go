package handlers

import (
	"math"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/dto"
	"github.com/masza1/dapen-backend/internal/services"
	"github.com/masza1/dapen-backend/internal/utils"
)

type SFilterHandler struct {
	service services.IFilterService
}

func NewFilterHandler(service services.IFilterService) *SFilterHandler {
	return &SFilterHandler{service: service}
}


// GetCustomers godoc
// @Summary Get Customers
// @Description Fetch customer data with pagination and search
// @Tags Filter
// @Produce json
// @Param jenis query int false "Jenis" default(0)
// @Param page query int false "Page Number" default(1)
// @Param limit query int false "Limit per page" default(10)
// @Param search query string false "Search query"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /customers [get]
func (h *SFilterHandler) GetCustomers(c *gin.Context) {
	jenis, _ := strconv.Atoi(c.DefaultQuery("jenis", "0"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	customers, total, err := h.service.GetCustomers(jenis, search, page, limit)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	lastPage := int(math.Ceil(float64(total) / float64(limit)))

	response := map[string]interface{}{
		"data":         customers,
		"current_page": page,
		"last_page":    lastPage,
		"total":        total,
	}

	utils.Success(c, "Customers retrieved successfully", response)
}

// GetPerkiraan godoc
// @Summary Get Perkiraan
// @Description Fetch perkiraan data with pagination and search
// @Tags Filter
// @Produce json
// @Param search query string false "Search query"
// @Param page query int false "Page Number" default(1)
// @Param limit query int false "Limit per page" default(10)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /perkiraan [get]
func (h *SFilterHandler) GetPerkiraan(c *gin.Context) {
	search := c.Query("q")
	without := c.Query("without")
	posthutpiut := c.Query("posthutpiut")

	data, err := h.service.GetPerkiraan(search, without, posthutpiut)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	var formatted []dto.SPerkiraanResponse
	for _, p := range data {
		kode := ""
		if p.KelompokKas != nil {
			kode = p.KelompokKas.Kode
		}
		formatted = append(formatted, dto.SPerkiraanResponse{
			ID:          p.Perkiraan,
			Text:        p.Perkiraan + " - " + p.Keterangan,
			Kode:        kode,
			Description: p.Keterangan,
		})
	}

	utils.Success(c, "Perkiraan retrieved successfully", formatted)
}

// GetKelompokKas godoc
// @Summary Get Kelompok Kas
// @Description Fetch kelompok kas data with pagination and search
// @Tags Filter
// @Produce json
// @Param search query string false "Search query"
// @Param page query int false "Page Number" default(1)
// @Param limit query int false "Limit per page" default(10)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /perkiraan/kelompok-kas [get]
func (h *SFilterHandler) GetKelompokKas(c *gin.Context) {
	tipe := c.DefaultQuery("type", "KAS")
	search := c.Query("query")

	data, err := h.service.GetKelompokKas(tipe, search)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	var formatted []dto.SPerkiraanResponse
	for _, p := range data {
		formatted = append(formatted, dto.SPerkiraanResponse{
			ID:          p.Perkiraan,
			Text:        p.Keterangan,
			Description: p.Keterangan,
		})
	}

	utils.Success(c, "Kelompok Kas retrieved successfully", formatted)
}
