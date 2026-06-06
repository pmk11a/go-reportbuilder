package middleware

import (
	"context"
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ContextKey untuk UserID (match dengan activity plugin)
type ContextKey string

const UserIDContextKey ContextKey = "userID"

// InjectUserContext middleware extracts user ID from JWT (set by AuthMiddleware)
// and injects it into Gin context globally, so GORM hooks can access it.
// This allows activity logging to work across ALL handlers without manual injection.
func InjectUserContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := "System"

		// Prefer legacy_user_id (username like "SA") for activity logging
		// Falls back to user_id (numeric ID) if legacy_user_id not available
		if val, ok := c.Get("legacy_user_id"); ok {
			// Handle multiple types: string, float64
			switch v := val.(type) {
			case string:
				if v != "" {
					userID = v
				}
			case float64:
				userID = strconv.Itoa(int(v))
			case int:
				userID = strconv.Itoa(v)
			default:
				userID = fmt.Sprintf("%v", v)
			}
		} else if val, ok := c.Get("user_id"); ok {
			// Fallback to numeric user_id if legacy_user_id not available
			switch v := val.(type) {
			case float64:
				userID = strconv.Itoa(int(v))
			case string:
				userID = v
			case int:
				userID = strconv.Itoa(v)
			default:
				userID = fmt.Sprintf("%v", v)
			}
		}

		// Inject into request context so GORM callbacks can access it
		// Use string key "userID" for compatibility with activity plugin
		newCtx := context.WithValue(c.Request.Context(), "userID", userID)
		c.Request = c.Request.WithContext(newCtx)

		c.Next()
	}
}
