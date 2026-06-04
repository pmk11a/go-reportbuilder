package middleware

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"golang.org/x/time/rate"
)

// RateLimiter interface for dynamic selection
type RateLimiter interface {
	RateLimitMiddleware() gin.HandlerFunc
}

// IPBasedLimiter manages unique limiters for each IP address (In-Memory)
type IPBasedLimiter struct {
	ips sync.Map
	r   rate.Limit
	b   int
}

// GlobalLimiter protects the overall backend capacity (Enterprise Standard)
// Limit: 500 requests per second across all users
var globalLimiter = rate.NewLimiter(rate.Limit(500), 1000)

// NewIPBasedLimiter creates a new Token Bucket rate limiter factory
func NewIPBasedLimiter(r rate.Limit, b int) *IPBasedLimiter {
	limiter := &IPBasedLimiter{
		r: r,
		b: b,
	}
	limiter.startCleanup()
	return limiter
}

// startCleanup periodically sweeps the ips map and evicts inactive entries to prevent memory leak (TASK-007)
func (i *IPBasedLimiter) startCleanup() {
	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		for range ticker.C {
			i.ips.Range(func(key, val interface{}) bool {
				limiter := val.(*rate.Limiter)
				// If the limiter has fully recovered its capacity (i.e. is inactive), delete it.
				// This prevents the map from leaking memory indefinitely.
				if limiter.Tokens() >= float64(i.b) {
					i.ips.Delete(key)
				}
				return true
			})
		}
	}()
}

func (i *IPBasedLimiter) getLimiter(ip string) *rate.Limiter {
	limiter, exists := i.ips.Load(ip)
	if !exists {
		// Per-IP limit: e.g. 10 requests per second with burst of 20
		newLimiter := rate.NewLimiter(i.r, i.b)
		i.ips.Store(ip, newLimiter)
		return newLimiter
	}
	return limiter.(*rate.Limiter)
}

// RateLimitMiddleware combines Global and IP-based limiting using Token Bucket
func (i *IPBasedLimiter) RateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Check Global Capacity first
		if !globalLimiter.Allow() {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
				"success": false,
				"message": "Server is at full capacity. Please try again later.",
			})
			return
		}

		// 2. Check Per-IP Capacity
		ip := c.ClientIP()
		limiter := i.getLimiter(ip)
		if !limiter.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "Too many requests from your IP. Please slow down.",
			})
			return
		}

		// Inject standard enterprise rate-limiting headers (TASK-007)
		tokensRemaining := int(limiter.Tokens())
		c.Header("X-RateLimit-Limit", strconv.Itoa(i.b))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(tokensRemaining))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(time.Second).Unix(), 10))

		c.Next()
	}
}

// RedisIPBasedLimiter manages per-IP rate limiting using Redis for horizontal scaling (TASK-007)
type RedisIPBasedLimiter struct {
	client *redis.Client
	r      rate.Limit
	b      int
}

// NewRedisIPBasedLimiter creates a new RedisIPBasedLimiter instance
func NewRedisIPBasedLimiter(client *redis.Client, r rate.Limit, b int) *RedisIPBasedLimiter {
	return &RedisIPBasedLimiter{
		client: client,
		r:      r,
		b:      b,
	}
}

// RateLimitMiddleware implements rate limiting using Redis atomic INCR + EXPIRE
func (r *RedisIPBasedLimiter) RateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Check Global Capacity first
		if !globalLimiter.Allow() {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
				"success": false,
				"message": "Server is at full capacity. Please try again later.",
			})
			return
		}

		if r.client == nil {
			// Fail-Open: let requests pass if Redis is down
			c.Next()
			return
		}

		ctx := c.Request.Context()
		ip := c.ClientIP()
		key := "ratelimit:backend:" + ip

		// Fail-open connection check with a brief 150ms timeout
		pingCtx, cancel := context.WithTimeout(ctx, 150*time.Millisecond)
		defer cancel()
		if err := r.client.Ping(pingCtx).Err(); err != nil {
			log.Printf("RedisIPBasedLimiter: Redis is down (%v) - bypassing rate limiter (Fail-Open)", err)
			c.Next()
			return
		}

		// Fixed window per minute logic (scale standard rate limit per second to per minute)
		limitPerMin := int64(r.r * 60)
		if limitPerMin <= 0 {
			limitPerMin = int64(r.b * 3) // Fallback calculation based on burst
		}

		current, err := r.client.Incr(ctx, key).Result()
		if err != nil {
			log.Printf("RedisIPBasedLimiter: Incr error for key %s: %v", key, err)
			c.Next()
			return
		}

		if current == 1 {
			// First request, set TTL to 60 seconds
			r.client.Expire(ctx, key, 60*time.Second)
		}

		ttlVal, _ := r.client.TTL(ctx, key).Result()
		resetTime := time.Now().Add(ttlVal).Unix()

		remaining := limitPerMin - current
		if remaining < 0 {
			remaining = 0
		}

		// Inject standard enterprise headers
		c.Header("X-RateLimit-Limit", strconv.FormatInt(limitPerMin, 10))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(remaining, 10))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(resetTime, 10))

		if current > limitPerMin {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "Too many requests from your IP. Please slow down.",
			})
			return
		}

		c.Next()
	}
}

// GetRateLimiter returns the configured RateLimiter middleware (In-Memory or Redis)
func GetRateLimiter(client *redis.Client, r rate.Limit, b int) RateLimiter {
	mode := os.Getenv("RATE_LIMIT_MODE")
	if mode == "redis" {
		return NewRedisIPBasedLimiter(client, r, b)
	}
	return NewIPBasedLimiter(r, b)
}

// TimeoutMiddleware implements a robust request timeout using channels
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Channel to signal handler completion
		finished := make(chan struct{}, 1)

		// Run the rest of the handler chain in a separate goroutine
		go func() {
			c.Next()
			finished <- struct{}{}
		}()

		select {
		case <-finished:
			// Success within timeout
			return
		case <-time.After(timeout):
			// Timeout exceeded
			c.AbortWithStatusJSON(http.StatusRequestTimeout, gin.H{
				"success": false,
				"message": "Request timed out. The server took too long to process your request.",
			})
		}
	}
}
