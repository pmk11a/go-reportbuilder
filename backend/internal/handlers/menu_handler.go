package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/masza1/dapen-backend/internal/services"
	"github.com/masza1/dapen-backend/internal/utils"
)

type SMenuHandler struct {
	menuService services.IMenuService
}

func NewMenuHandler(menuService services.IMenuService) *SMenuHandler {
	return &SMenuHandler{menuService: menuService}
}

// GetAllMenus godoc
// @Summary Get All Menus
// @Description Fetch a paginated list of all menus
// @Tags Menu
// @Produce json
// @Param page query int false "Page Number" default(1)
// @Param limit query int false "Limit per page" default(10)
// @Param search query string false "Search query"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/menu [get]
func (h *SMenuHandler) GetAllMenus(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	search := c.Query("search")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	response, err := h.menuService.GetPaginatedMenus(page, limit, search)
	if err != nil {
		utils.InternalError(c, "Failed to retrieve menus")
		return
	}
	utils.Success(c, "Menus retrieved successfully", response)
}

// GetParentMenus godoc
// @Summary Get Parent Menus
// @Description Fetch parent menus based on specific hierarchy level
// @Tags Menu
// @Produce json
// @Param level query int true "Menu Level"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/menu/parents [get]
func (h *SMenuHandler) GetParentMenus(c *gin.Context) {
	levelStr := c.Query("level")
	level, err := strconv.Atoi(levelStr)
	if err != nil {
		utils.BadRequest(c, "Invalid level parameter")
		return
	}

	parents, err := h.menuService.GetParentMenus(level)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, "Parent menus retrieved successfully", parents)
}

// GetMenuByID godoc
// @Summary Get Menu By ID
// @Description Fetch a single menu by its code
// @Tags Menu
// @Produce json
// @Param kode path string true "Menu Code"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/menu/{kode} [get]
func (h *SMenuHandler) GetMenuByID(c *gin.Context) {
	kodeMenu := c.Param("kode")
	menu, err := h.menuService.GetMenuByID(kodeMenu)
	if err != nil {
		utils.NotFound(c, "Menu not found")
		return
	}
	utils.Success(c, "Menu retrieved successfully", menu)
}

// CreateMenu godoc
// @Summary Create New Menu
// @Description Add a new menu item to the system
// @Tags Menu
// @Accept json
// @Produce json
// @Param request body models.SDbMenu true "Menu Data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/menu [post]
func (h *SMenuHandler) CreateMenu(c *gin.Context) {
	var req models.SDbMenu
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if err := h.menuService.CreateMenu(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Created(c, "Menu created successfully", req)
}

// UpdateMenu godoc
// @Summary Update Menu
// @Description Modify an existing menu item
// @Tags Menu
// @Accept json
// @Produce json
// @Param kode path string true "Menu Code"
// @Param request body models.SDbMenu true "Updated Menu Data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/menu/{kode} [put]
func (h *SMenuHandler) UpdateMenu(c *gin.Context) {
	kodeMenu := c.Param("kode")
	var req models.SDbMenu
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if err := h.menuService.UpdateMenu(kodeMenu, &req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, "Menu updated successfully", req)
}

// DeleteMenu godoc
// @Summary Delete Menu
// @Description Remove a menu item from the system
// @Tags Menu
// @Produce json
// @Param kode path string true "Menu Code"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/menu/{kode} [delete]
func (h *SMenuHandler) DeleteMenu(c *gin.Context) {
	kodeMenu := c.Param("kode")
	if err := h.menuService.DeleteMenu(kodeMenu); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, "Menu deleted successfully", nil)
}
