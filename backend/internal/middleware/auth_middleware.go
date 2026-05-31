package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/masza1/dapen-backend/internal/config"
	"github.com/masza1/dapen-backend/internal/utils"
)

func AuthMiddleware(cfg *config.SConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "Unauthorized")
			c.Abort()
			return
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			utils.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		c.Set("user_id", claims["user_id"])
		c.Set("legacy_user_id", claims["legacy_user_id"])
		c.Set("role", claims["role"])
		c.Next()
	}
}

func RoleMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			utils.Forbidden(c, "Role not found in context")
			c.Abort()
			return
		}

		allowed := false
		for _, role := range roles {
			if userRole == role {
				allowed = true
				break
			}
		}

		if !allowed {
			utils.Forbidden(c, "You don't have permission to access this resource")
			c.Abort()
			return
		}

		c.Next()
	}
}
