package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"golang.org/x/time/rate"
)

func TestRateLimitMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Temporarily override globalLimiter for test if necessary, but we can test IP limiter first
	limiter := NewIPBasedLimiter(rate.Limit(10), 1)

	t.Run("Allowed", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest(http.MethodGet, "/", nil)
		c.Request.RemoteAddr = "127.0.0.1:12345" // Simulates ClientIP() inside Gin if set properly or we can trust Gin's default ClientIP extraction

		limiter.RateLimitMiddleware()(c)
		assert.False(t, c.IsAborted())
	})

	t.Run("Too Many Requests", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest(http.MethodGet, "/", nil)
		c.Request.RemoteAddr = "127.0.0.2:12345" 
		
		// Consume the bucket
		ipLimiter := limiter.getLimiter("127.0.0.2")
		ipLimiter.Allow() // burst 1 used up

		limiter.RateLimitMiddleware()(c)
		assert.Equal(t, http.StatusTooManyRequests, w.Code)
		assert.True(t, c.IsAborted())
	})
}

func TestTimeoutMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Success within timeout", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, engine := gin.CreateTestContext(w)
		
		engine.Use(TimeoutMiddleware(1 * time.Second))
		engine.GET("/", func(c *gin.Context) {
			c.String(http.StatusOK, "OK")
		})

		c.Request, _ = http.NewRequest(http.MethodGet, "/", nil)
		engine.HandleContext(c)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "OK", w.Body.String())
	})

	t.Run("Timeout exceeded", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, engine := gin.CreateTestContext(w)
		
		engine.Use(TimeoutMiddleware(10 * time.Millisecond))
		engine.GET("/", func(c *gin.Context) {
			time.Sleep(50 * time.Millisecond) // This will exceed the timeout
			c.String(http.StatusOK, "OK")
		})

		c.Request, _ = http.NewRequest(http.MethodGet, "/", nil)
		engine.HandleContext(c)

		assert.Equal(t, http.StatusRequestTimeout, w.Code)
	})
}
