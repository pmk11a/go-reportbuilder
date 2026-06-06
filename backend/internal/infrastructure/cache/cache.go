package cache

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

// CacheManager handles Redis operations with Fail-Open behavior.
type CacheManager struct {
	client *redis.Client
}

// NewCacheManager creates a new instance of CacheManager.
func NewCacheManager(client *redis.Client) *CacheManager {
	return &CacheManager{
		client: client,
	}
}

// IsActive checks if the Redis client is initialized and reachable.
func (c *CacheManager) IsActive(ctx context.Context) bool {
	if c.client == nil {
		return false
	}
	// Fail-open: ping with short timeout to prevent hanging request
	pingCtx, cancel := context.WithTimeout(ctx, 200*time.Millisecond)
	defer cancel()
	if err := c.client.Ping(pingCtx).Err(); err != nil {
		log.Printf("CacheManager: Redis is not reachable: %v", err)
		return false
	}
	return true
}

// Get retrieves a cached item and deserializes it into 'dest'.
// If a Redis error occurs or the item is missing, it returns false.
func (c *CacheManager) Get(ctx context.Context, key string, dest interface{}) bool {
	if !c.IsActive(ctx) {
		return false // Fail-Open: act as cache miss
	}

	val, err := c.client.Get(ctx, key).Result()
	if err != nil {
		if !errors.Is(err, redis.Nil) {
			log.Printf("CacheManager: Error getting key %s from Redis: %v", key, err)
		}
		return false // Cache miss or error
	}

	if err := json.Unmarshal([]byte(val), dest); err != nil {
		log.Printf("CacheManager: Failed to unmarshal JSON for key %s: %v", key, err)
		return false
	}

	return true
}

// Set serializes 'value' to JSON and stores it in Redis with the given TTL.
// It fails silently (Fail-Open) if Redis is down.
func (c *CacheManager) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) bool {
	if !c.IsActive(ctx) {
		return false
	}

	data, err := json.Marshal(value)
	if err != nil {
		log.Printf("CacheManager: Failed to marshal value to JSON for key %s: %v", key, err)
		return false
	}

	if err := c.client.Set(ctx, key, data, ttl).Err(); err != nil {
		log.Printf("CacheManager: Error setting key %s in Redis: %v", key, err)
		return false
	}

	return true
}

// Delete removes one or more keys from Redis.
func (c *CacheManager) Delete(ctx context.Context, keys ...string) bool {
	if !c.IsActive(ctx) {
		return false
	}

	if len(keys) == 0 {
		return true
	}

	if err := c.client.Del(ctx, keys...).Err(); err != nil {
		log.Printf("CacheManager: Error deleting keys %v from Redis: %v", keys, err)
		return false
	}

	return true
}

// DeleteByPattern deletes all keys matching a specific glob pattern.
func (c *CacheManager) DeleteByPattern(ctx context.Context, pattern string) bool {
	if !c.IsActive(ctx) {
		return false
	}

	var cursor uint64
	for {
		var keys []string
		var err error
		keys, cursor, err = c.client.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			log.Printf("CacheManager: Error scanning pattern %s in Redis: %v", pattern, err)
			return false
		}

		if len(keys) > 0 {
			if err := c.client.Del(ctx, keys...).Err(); err != nil {
				log.Printf("CacheManager: Error deleting scanned keys for pattern %s: %v", pattern, err)
				return false
			}
		}

		if cursor == 0 {
			break
		}
	}

	return true
}
