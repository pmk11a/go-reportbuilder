package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/masza1/dapen-backend/internal/services"
	"github.com/masza1/dapen-backend/internal/utils"
)

type SAuthHandler struct {
	authService services.IAuthService
}

func NewAuthHandler(as services.IAuthService) *SAuthHandler {
	return &SAuthHandler{authService: as}
}

func (h *SAuthHandler) Login(c *gin.Context) {
	var req models.SLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body: "+err.Error())
		return
	}

	res, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		utils.Unauthorized(c, err.Error())
		return
	}

	utils.Success(c, "Login successful", res)
}

// RefreshToken handles token rotation (RTR).
// The BFF layer sends the current refresh_token to get a new token pair.
func (h *SAuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body: "+err.Error())
		return
	}

	res, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		utils.Unauthorized(c, err.Error())
		return
	}

	utils.Success(c, "Token refreshed successfully", res)
}

func (h *SAuthHandler) ChangePassword(c *gin.Context) {
	var req struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body: "+err.Error())
		return
	}

	userIDFloat, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "SUser not authenticated")
		return
	}

	// In JWT claims parsed by AuthMiddleware, user_id is float64
	userIDVal, ok := userIDFloat.(float64)
	if !ok {
		utils.BadRequest(c, "Invalid user ID type in token")
		return
	}
	userID := uint(userIDVal)

	err := h.authService.ChangePassword(userID, req.OldPassword, req.NewPassword)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, "Password changed successfully", nil)
}

func (h *SAuthHandler) GetMe(c *gin.Context) {
	userIDFloat, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "Not authenticated")
		return
	}
	
	userIDVal, ok := userIDFloat.(float64)
	if !ok {
		utils.BadRequest(c, "Invalid user ID type in token")
		return
	}
	userID := uint(userIDVal)

	user, err := h.authService.GetMe(userID)
	if err != nil {
		utils.Unauthorized(c, err.Error())
		return
	}

	utils.Success(c, "Access granted", user)
}

