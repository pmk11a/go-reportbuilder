package session

import "github.com/gin-gonic/gin"

// RegisterRoutes wires the session management endpoints into the admin group.
// Expects the admin group to already have AuthMiddleware and RoleMiddleware("admin") applied.
func RegisterRoutes(adminGroup *gin.RouterGroup, handler *SSessionHandler) {
	sessionGroup := adminGroup.Group("/users")
	{
		// GET  /api/admin/users/{userId}/sessions           - List active sessions
		sessionGroup.GET("/:userId/sessions", handler.ListUserSessions)

		// DELETE /api/admin/users/{userId}/sessions/{sessionId} - Revoke single session
		sessionGroup.DELETE("/:userId/sessions/:sessionId", handler.RevokeSession)

		// DELETE /api/admin/users/{userId}/sessions         - Revoke all sessions
		sessionGroup.DELETE("/:userId/sessions", handler.RevokeAllSessions)
	}
}
