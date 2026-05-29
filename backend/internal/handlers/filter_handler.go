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
