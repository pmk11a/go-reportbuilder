package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"golang.org/x/time/rate"
)

func TestRateLimitMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	limiter := NewIPBasedLimiter(rate.Limit(10), 1)

	t.Run("Allowed", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest(http.MethodGet, "/", nil)
		c.Request.RemoteAddr = "127.0.0.1:12345"

		limiter.RateLimitMiddleware()(c)
		assert.False(t, c.IsAborted())
		assert.NotEmpty(t, w.Header().Get("X-RateLimit-Limit"))
		assert.NotEmpty(t, w.Header().Get("X-RateLimit-Remaining"))
		assert.NotEmpty(t, w.Header().Get("X-RateLimit-Reset"))
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

func TestIPBasedLimiterCleanup(t *testing.T) {
	limiter := NewIPBasedLimiter(rate.Limit(100), 5)
	
	// Add some active IPs
	ip1 := "10.0.0.1"
	ip2 := "10.0.0.2"
	
	limiter.getLimiter(ip1)
	l2 := limiter.getLimiter(ip2)
	l2.Allow() // consume token so it's not fully full

	// Initially they are both in the map
	_, exists1 := limiter.ips.Load(ip1)
	_, exists2 := limiter.ips.Load(ip2)
	assert.True(t, exists1)
	assert.True(t, exists2)

	// Manually trigger a cleanup check by running the sweep function logic
	limiter.ips.Range(func(key, val interface{}) bool {
		lim := val.(*rate.Limiter)
		if lim.Tokens() >= float64(limiter.b) {
			limiter.ips.Delete(key)
		}
		return true
	})

	// IP1 has all tokens full -> evicted. IP2 is active -> retained.
	_, exists1 = limiter.ips.Load(ip1)
	_, exists2 = limiter.ips.Load(ip2)
	assert.False(t, exists1)
	assert.True(t, exists2)
}

func TestRedisIPBasedLimiterFailOpen(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Nil Client", func(t *testing.T) {
		redisLimiter := NewRedisIPBasedLimiter(nil, rate.Limit(10), 20)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest(http.MethodGet, "/", nil)

		redisLimiter.RateLimitMiddleware()(c)
		// Should let request through (Fail-Open)
		assert.False(t, c.IsAborted())
	})

	t.Run("Reachable but Down Client Connection", func(t *testing.T) {
		// Create a redis client pointing to an offline port
		client := redis.NewClient(&redis.Options{
			Addr: "localhost:1234", // offline port
		})
		defer client.Close()

		redisLimiter := NewRedisIPBasedLimiter(client, rate.Limit(10), 20)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest(http.MethodGet, "/", nil)

		redisLimiter.RateLimitMiddleware()(c)
		// Should bypass rate limiter gracefully (Fail-Open)
		assert.False(t, c.IsAborted())
	})
}

func TestGetRateLimiterFactory(t *testing.T) {
	os.Setenv("RATE_LIMIT_MODE", "redis")
	lim1 := GetRateLimiter(nil, rate.Limit(10), 20)
	_, isRedis := lim1.(*RedisIPBasedLimiter)
	assert.True(t, isRedis)

	os.Setenv("RATE_LIMIT_MODE", "in-memory")
	lim2 := GetRateLimiter(nil, rate.Limit(10), 20)
	_, isInMemory := lim2.(*IPBasedLimiter)
	assert.True(t, isInMemory)

	os.Unsetenv("RATE_LIMIT_MODE")
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
