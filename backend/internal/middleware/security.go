package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// IPBasedLimiter manages unique limiters for each IP address
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
	return &IPBasedLimiter{
		r: r,
		b: b,
	}
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

		c.Next()
	}
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
