package auth

import (
	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/masza1/dapen-backend/internal/services"
	"github.com/masza1/dapen-backend/internal/shared/response"
)

type SAuthHandler struct {
	authService services.IAuthService
}

func NewAuthHandler(as services.IAuthService) *SAuthHandler {
	return &SAuthHandler{authService: as}
}

// Login godoc
// @Summary User Login
// @Description Authenticate user and return JWT tokens
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body models.SLoginRequest true "Login Credentials"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /auth/login [post]
func (h *SAuthHandler) Login(c *gin.Context) {
	var req models.SLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body: "+err.Error())
		return
	}

	res, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, "Login successful", res)
}

// RefreshToken handles token rotation (RTR).
// The BFF layer sends the current refresh_token to get a new token pair.
// @Summary Refresh JWT Token
// @Description Rotate JWT tokens using a valid refresh token
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body map[string]string true "Refresh Token"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /auth/refresh [post]
func (h *SAuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body: "+err.Error())
		return
	}

	res, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, "Token refreshed successfully", res)
}

// ChangePassword godoc
// @Summary Change User Password
// @Description Change the password of the currently authenticated user
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body map[string]string true "Old and New Password"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Security BearerAuth
// @Router /auth/change-password [post]
func (h *SAuthHandler) ChangePassword(c *gin.Context) {
	var req struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body: "+err.Error())
		return
	}

	userIDFloat, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "SUser not authenticated")
		return
	}

	// In JWT claims parsed by AuthMiddleware, user_id is float64
	userIDVal, ok := userIDFloat.(float64)
	if !ok {
		response.BadRequest(c, "Invalid user ID type in token")
		return
	}
	userID := uint(userIDVal)

	err := h.authService.ChangePassword(userID, req.OldPassword, req.NewPassword)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, "Password changed successfully", nil)
}

// GetMe godoc
// @Summary Get Current User
// @Description Retrieves the currently authenticated user profile
// @Tags User
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Security BearerAuth
// @Router /me [get]
func (h *SAuthHandler) GetMe(c *gin.Context) {
	userIDFloat, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "Not authenticated")
		return
	}
	
	userIDVal, ok := userIDFloat.(float64)
	if !ok {
		response.BadRequest(c, "Invalid user ID type in token")
		return
	}
	userID := uint(userIDVal)

	user, err := h.authService.GetMe(userID)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, "Access granted", user)
}

