package session

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/infrastructure/response"
)

// SSessionHandler handles HTTP requests for session management endpoints.
// All endpoints are admin-only (protected by RoleMiddleware("admin")).
type SSessionHandler struct {
	service ISessionService
}

// NewSessionHandler constructs a SSessionHandler with the given service.
func NewSessionHandler(svc ISessionService) *SSessionHandler {
	return &SSessionHandler{service: svc}
}

// ListUserSessions godoc
// @Summary List User Active Sessions
// @Description Fetch all active sessions for a specific user. Admin-only endpoint.
// @Tags Session Management
// @Security BearerAuth
// @Param id path uint true "User ID"
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users/{id}/sessions [get]
func (h *SSessionHandler) ListUserSessions(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID format")
		return
	}

	// Extract the current session ID from the HttpOnly cookie set by the BFF.
	// This allows the frontend to highlight the row belonging to the current session.
	currentSessionID, _ := c.Cookie("session_id")

	sessions, currentSessionID, err := h.service.ListUserSessions(c.Request.Context(), uint(userID), currentSessionID)
	if err != nil {
		response.InternalError(c, "Failed to fetch sessions: "+err.Error())
		return
	}

	response.Success(c, "Sessions retrieved successfully", SListSessionsResponse{
		Sessions:         sessions,
		CurrentSessionID: currentSessionID,
	})
}

// RevokeSession godoc
// @Summary Revoke a Single Session
// @Description Revoke a specific session by sessionId. The user will be logged out from that device/session.
// @Tags Session Management
// @Security BearerAuth
// @Param id path uint true "User ID"
// @Param sessionId path string true "Session ID"
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users/{id}/sessions/{sessionId} [delete]
func (h *SSessionHandler) RevokeSession(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID format")
		return
	}

	sessionID := c.Param("sessionId")
	if sessionID == "" {
		response.BadRequest(c, "Session ID is required")
		return
	}

	// Extract admin user ID from JWT context (set by AuthMiddleware)
	adminIDVal, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "User ID not found in token")
		return
	}

	adminID, ok := adminIDVal.(float64)
	if !ok {
		response.Unauthorized(c, "Invalid user ID in token")
		return
	}

	// Revoke the session (includes audit logging)
	if err := h.service.RevokeUserSession(c.Request.Context(), uint(adminID), uint(userID), sessionID); err != nil {
		response.InternalError(c, "Failed to revoke session: "+err.Error())
		return
	}

	response.Success(c, "Session revoked successfully", SRevokeSessionResponse{
		Message: "Session revoked",
	})
}

// RevokeAllSessions godoc
// @Summary Revoke All User Sessions
// @Description Revoke all active sessions for a user. The user will be logged out from all devices.
// @Tags Session Management
// @Security BearerAuth
// @Param id path uint true "User ID"
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/admin/users/{id}/sessions [delete]
func (h *SSessionHandler) RevokeAllSessions(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID format")
		return
	}

	// Extract admin user ID from JWT context
	adminIDVal, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "User ID not found in token")
		return
	}

	adminID, ok := adminIDVal.(float64)
	if !ok {
		response.Unauthorized(c, "Invalid user ID in token")
		return
	}

	// Revoke all sessions (includes audit logging)
	if err := h.service.RevokeAllUserSessions(c.Request.Context(), uint(adminID), uint(userID)); err != nil {
		response.InternalError(c, "Failed to revoke sessions: "+err.Error())
		return
	}

	response.Success(c, "All sessions revoked successfully", SRevokeAllSessionsResponse{
		Message:      "All sessions revoked",
		RevokedCount: 0, // Count is logged in audit, but could be fetched if needed
	})
}
