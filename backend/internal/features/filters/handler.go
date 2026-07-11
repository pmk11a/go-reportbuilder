package filters

import (
	"math"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	responsepkg "github.com/masza1/dapen-backend/internal/infrastructure/response"
)

type SFilterHandler struct {
	service IFilterService
}

func NewFilterHandler(service IFilterService) *SFilterHandler {
	return &SFilterHandler{service: service}
}


// GetCustomers godoc
// @Summary Get Customers
// @Description Fetch customer data with pagination and search
// @Tags Filter
// @Produce json
// @Param customerType query int false "Customer type (legacy DBCUSTSUPP.JENIS)" default(0)
// @Param page query int false "Page Number" default(1)
// @Param limit query int false "Limit per page" default(10)
// @Param search query string false "Search query"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /customers [get]
func (h *SFilterHandler) GetCustomers(c *gin.Context) {
	// Query parameter name is preserved as "jenis" to keep the legacy frontend contract;
	// the Go variable and downstream call use the English name.
	customerType, _ := strconv.Atoi(c.DefaultQuery("jenis", "0"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	customers, total, err := h.service.GetCustomers(customerType, search, page, limit)
	if err != nil {
		responsepkg.InternalError(c, err.Error())
		return
	}

	lastPage := int(math.Ceil(float64(total) / float64(limit)))

	payload := map[string]interface{}{
		"data":         customers,
		"current_page": page,
		"last_page":    lastPage,
		"total":        total,
	}

	responsepkg.Success(c, "Customers retrieved successfully", payload)
}

// GetPerkiraan godoc
// @Summary Get Perkiraan
// @Description Fetch perkiraan data with pagination and search
// @Tags Filter
// @Produce json
// @Param q query string false "Search query"
// @Param without query string false "Comma-separated perkiraan codes to exclude"
// @Param posthutpiut query string false "Restrict to hutang/piut entries"
// @Param page query int false "Page Number" default(1)
// @Param limit query int false "Limit per page" default(10)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /perkiraan [get]
func (h *SFilterHandler) GetPerkiraan(c *gin.Context) {
	search := c.Query("q")
	// Query param names are preserved for the legacy frontend contract;
	// the Go variables use the English names below.
	withoutUserAccess := c.Query("without")
	onlyPostHutPiut := c.Query("posthutpiut")

	data, err := h.service.GetPerkiraan(search, withoutUserAccess, onlyPostHutPiut)
	if err != nil {
		responsepkg.InternalError(c, err.Error())
		return
	}

	var formatted []SPerkiraanResponse
	for _, p := range data {
		kode := ""
		if p.KelompokKas != nil {
			kode = p.KelompokKas.Kode
		}
		formatted = append(formatted, SPerkiraanResponse{
			ID:          p.Perkiraan,
			Text:        p.Perkiraan + " - " + p.Keterangan,
			Kode:        kode,
			Description: p.Keterangan,
		})
	}

	responsepkg.Success(c, "Perkiraan retrieved successfully", formatted)
}

// GetKelompokKas godoc
// @Summary Get Kelompok Kas
// @Description Fetch kelompok kas data filtered by one or more DBPOSTHUTPIUT
// @Description codes. Pass `type` (single, legacy) or `types` (comma-separated,
// @Description preferred) — `types=KAS,BANK` returns accounts in either category.
// @Tags Filter
// @Produce json
// @Param type query string false "Single DBPOSTHUTPIUT.Kode (e.g. KAS, BANK)" default(KAS)
// @Param types query string false "Comma-separated DBPOSTHUTPIUT.Kode list (e.g. KAS,BANK)"
// @Param query query string false "Search query"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /perkiraan/kelompok-kas [get]
func (h *SFilterHandler) GetKelompokKas(c *gin.Context) {
	// Prefer the `types` (comma-separated) param for multi-category lookup;
	// fall back to the single-value `type` for backward compatibility.
	typesParam := c.Query("types")
	var accountTypes []string
	if typesParam != "" {
		for _, t := range strings.Split(typesParam, ",") {
			if v := strings.TrimSpace(t); v != "" {
				accountTypes = append(accountTypes, v)
			}
		}
	}
	if len(accountTypes) == 0 {
		accountTypes = []string{c.DefaultQuery("type", "KAS")}
	}
	search := c.Query("query")

	data, err := h.service.GetKelompokKas(accountTypes, search)
	if err != nil {
		responsepkg.InternalError(c, err.Error())
		return
	}

	var formatted []SPerkiraanResponse
	for _, p := range data {
		formatted = append(formatted, SPerkiraanResponse{
			ID:          p.Perkiraan,
			Text:        p.Keterangan,
			Description: p.Keterangan,
		})
	}

	responsepkg.Success(c, "Kelompok Kas retrieved successfully", formatted)
}
