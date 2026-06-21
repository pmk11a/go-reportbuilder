package user

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes attaches all identity/user routes to the given router group.
// If authMW is non-nil, it is applied to the /users sub-group; otherwise the
// caller is responsible for ensuring the parent group is already protected.
//
// Routes:
//   GET    /users
//   GET    /users/:id
//   POST   /users
//   PUT    /users/:id
//   DELETE /users/:id
func RegisterRoutes(rg *gin.RouterGroup, h *SUserHandler, authMW gin.HandlerFunc) {
	users := rg.Group("/users")
	if authMW != nil {
		users.Use(authMW)
	}
	{
		users.GET("", h.GetUsers)
		users.GET("/:id", h.GetUser)
		users.POST("", h.CreateUser)
		users.PUT("/:id", h.UpdateUser)
		users.DELETE("/:id", h.DeleteUser)
	}
}
