package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/masza1/dapen-backend/internal/config"
	"github.com/stretchr/testify/assert"
)

func TestAuthMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := &config.SConfig{JWTSecret: "test-secret"}

	t.Run("No Header", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest(http.MethodGet, "/", nil)

		AuthMiddleware(cfg)(c)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
		assert.True(t, c.IsAborted())
	})

	t.Run("Invalid Token", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest(http.MethodGet, "/", nil)
		c.Request.Header.Set("Authorization", "Bearer invalid-token")

		AuthMiddleware(cfg)(c)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
		assert.True(t, c.IsAborted())
	})

	t.Run("Valid Token", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest(http.MethodGet, "/", nil)

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"user_id":        "123",
			"legacy_user_id": "legacy123",
			"role":           "admin",
		})
		tokenString, _ := token.SignedString([]byte("test-secret"))

		c.Request.Header.Set("Authorization", "Bearer "+tokenString)

		AuthMiddleware(cfg)(c)

		assert.Equal(t, http.StatusOK, w.Code) // Because it calls Next() and doesn't write anything if we don't handle it further. It shouldn't abort.
		assert.False(t, c.IsAborted())
		
		val, _ := c.Get("user_id")
		assert.Equal(t, "123", val)
		
		val, _ = c.Get("role")
		assert.Equal(t, "admin", val)
	})
}

func TestRoleMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Role Not Set", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		RoleMiddleware("admin")(c)
		assert.Equal(t, http.StatusForbidden, w.Code)
		assert.True(t, c.IsAborted())
	})

	t.Run("Not Allowed Role", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Set("role", "user")

		RoleMiddleware("admin")(c)
		assert.Equal(t, http.StatusForbidden, w.Code)
		assert.True(t, c.IsAborted())
	})

	t.Run("Allowed Role", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Set("role", "admin")

		RoleMiddleware("admin")(c)
		assert.Equal(t, http.StatusOK, w.Code)
		assert.False(t, c.IsAborted())
	})
}
