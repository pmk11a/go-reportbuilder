package browse

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/internal/infrastructure/response"
)

// ListConfigs returns all browse configs with pagination.
// GET /api/browse/configs?page=1&limit=20&search=...
func (h *Handler) ListConfigs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")

	configs, total, err := h.resolver.ListConfigs(c.Request.Context(), page, limit, search)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, "Browse configs retrieved", response.NewPaginatedResponse(configs, total, page, limit))
}

// CreateConfig creates a new browse config.
// POST /api/browse/configs
func (h *Handler) CreateConfig(c *gin.Context) {
	var req models.SDbBrowseConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.resolver.CreateConfig(c.Request.Context(), &req); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, "Browse config created", req)
}

// UpdateConfig updates an existing browse config.
// PUT /api/browse/configs/:id
func (h *Handler) UpdateConfig(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID format")
		return
	}

	var req models.SDbBrowseConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.resolver.UpdateConfig(c.Request.Context(), uint(id), &req); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, "Browse config updated", req)
}

// DeleteConfig soft-deletes a browse config.
// DELETE /api/browse/configs/:id
func (h *Handler) DeleteConfig(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID format")
		return
	}

	if err := h.resolver.DeleteConfig(c.Request.Context(), uint(id)); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, "Browse config deleted", nil)
}
