package user

import (
	"github.com/gin-gonic/gin"

	"github.com/masza1/dapen-backend/internal/shared/auth"
)

// RegisterRoutes attaches all identity/user routes to the given router group.
// The caller decides which prefix + which middlewares to apply.
//
// Routes:
//   GET    /api/admin/users
//   POST   /api/admin/users
//   PUT    /api/admin/users/:id
//   DELETE /api/admin/users/:id
func RegisterRoutes(rg *gin.RouterGroup, h *SUserHandler, authMW gin.HandlerFunc) {
	users := rg.Group("/users")
	users.Use(authMW)
	{
		users.GET("", h.GetUsers)
		users.POST("", h.CreateUser)
		users.PUT("/:id", h.UpdateUser)
		users.DELETE("/:id", h.DeleteUser)
	}
	_ = auth.AuthMiddleware // re-export so callers can apply if needed
}
