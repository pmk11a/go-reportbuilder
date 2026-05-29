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

func (h *SMenuHandler) GetMenuByID(c *gin.Context) {
	kodeMenu := c.Param("kode")
	menu, err := h.menuService.GetMenuByID(kodeMenu)
	if err != nil {
		utils.NotFound(c, "Menu not found")
		return
	}
	utils.Success(c, "Menu retrieved successfully", menu)
}

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

func (h *SMenuHandler) DeleteMenu(c *gin.Context) {
	kodeMenu := c.Param("kode")
	if err := h.menuService.DeleteMenu(kodeMenu); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, "Menu deleted successfully", nil)
}
