package browse

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/infrastructure/response"
)

// Handler handles HTTP requests for browse features.
type Handler struct {
	resolver *SConfigResolver
}

// NewHandler creates a new browse handler.
func NewHandler(resolver *SConfigResolver) *Handler {
	return &Handler{resolver: resolver}
}

// ListTypes returns all available browse types.
// GET /api/browse/types
func (h *Handler) ListTypes(c *gin.Context) {
	types := h.resolver.ListTypes()
	c.JSON(http.StatusOK, gin.H{
		"data": types,
	})
}

// Search performs a search on a browse type.
// GET /api/browse/search?kodeBrowse=1001&q=BANK&limit=20&userMode=A
// Parent filters: parent_kodecus=XYZ (key format: parent_<source_column>)
func (h *Handler) Search(c *gin.Context) {
	kodeBrowse := c.Query("kodeBrowse")
	q := c.Query("q")
	userMode := c.Query("userMode")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if kodeBrowse == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "kodeBrowse is required"})
		return
	}

	// Extract parent filters from query params
	parentFilters := make(map[string]interface{})
	for key, values := range c.Request.URL.Query() {
		if len(values) > 0 && key[:7] == "parent_" {
			sourceColumn := key[7:] // remove "parent_" prefix
			parentFilters[sourceColumn] = values[0]
		}
	}

	results, err := h.resolver.Search(c.Request.Context(), kodeBrowse, q, limit, userMode, parentFilters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": results,
	})
}

// ValidateCode validates a single code for a browse type.
// POST /api/browse/validate
// Body: {"kodeBrowse": "1001", "code": "1101101"}
func (h *Handler) ValidateCode(c *gin.Context) {
	var req struct {
		KodeBrowse string `json:"kodeBrowse" binding:"required"`
		Code       string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.resolver.ValidateCode(c.Request.Context(), req.KodeBrowse, req.Code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "code not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": result,
	})
}

// ValidateBatch validates multiple codes for a browse type.
// POST /api/browse/validate-batch
// Body: {"kodeBrowse": "1001", "codes": ["1101101", "1101102"]}
func (h *Handler) ValidateBatch(c *gin.Context) {
	var req struct {
		KodeBrowse string   `json:"kodeBrowse" binding:"required"`
		Codes      []string `json:"codes" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	results, err := h.resolver.ValidateBatch(c.Request.Context(), req.KodeBrowse, req.Codes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": results,
	})
}

// GetAll returns all records for a browse type without search filtering.
// GET /api/browse/all?kodeBrowse=1001&limit=500&userMode=A
func (h *Handler) GetAll(c *gin.Context) {
	kodeBrowse := c.Query("kodeBrowse")
	userMode := c.Query("userMode")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "500"))

	if kodeBrowse == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "kodeBrowse is required"})
		return
	}

	results, err := h.resolver.GetAll(c.Request.Context(), kodeBrowse, limit, userMode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": results,
	})
}

// SearchPaged executes a paginated browse search with sorting and jenis filter.
// GET /api/browse/paged?kodeBrowse=1004&search=Bank&jenis=Y&sortBy=Keterangan&sortDir=ASC&limit=20&offset=0
func (h *Handler) SearchPaged(c *gin.Context) {
	filter := SearchFilter{
		KodeBrowse: c.Query("kodeBrowse"),
		Search:     c.Query("search"),
		Jenis:      c.Query("jenis"),
		SortBy:     c.Query("sortBy"),
		SortDir:    c.Query("sortDir"),
	}

	if filter.KodeBrowse == "" {
		response.Error(c, http.StatusBadRequest, "kodeBrowse is required")
		return
	}

	filter.Limit, _ = strconv.Atoi(c.DefaultQuery("limit", "20"))
	filter.Offset, _ = strconv.Atoi(c.DefaultQuery("offset", "0"))

	resp, err := h.resolver.SearchPaged(c.Request.Context(), filter)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	// We embed pagination metadata in a wrapper envelope so the FE can
	// read response.data.items / response.data.hasMore / etc.
	envelope := map[string]interface{}{
		"items":   resp.Items,
		"total":   resp.Total,
		"limit":   resp.Limit,
		"offset":  resp.Offset,
		"hasMore": resp.HasMore,
	}
	response.Success(c, "Browse paged results", envelope)
}