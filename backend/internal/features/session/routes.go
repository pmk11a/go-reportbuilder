package session

import "github.com/gin-gonic/gin"

// RegisterRoutes wires the session management endpoints into the admin group.
// Expects the admin group to already have AuthMiddleware and RoleMiddleware("admin") applied.
func RegisterRoutes(adminGroup *gin.RouterGroup, handler *SSessionHandler) {
	sessionGroup := adminGroup.Group("/users")
	{
		// GET  /api/admin/users/{id}/sessions           - List active sessions
		sessionGroup.GET("/:id/sessions", handler.ListUserSessions)

		// DELETE /api/admin/users/{id}/sessions/{sessionId} - Revoke single session
		sessionGroup.DELETE("/:id/sessions/:sessionId", handler.RevokeSession)

		// DELETE /api/admin/users/{id}/sessions         - Revoke all sessions
		sessionGroup.DELETE("/:id/sessions", handler.RevokeAllSessions)
	}
}
