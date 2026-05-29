package db

import (
	"context"
	"log"

	"github.com/masza1/dapen-backend/internal/config"
	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

// InitRedis initializes the Redis client connection.
// Redis is used for BFF session storage and concurrency locks.
func InitRedis(cfg *config.SConfig) *redis.Client {
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatalf("Failed to parse Redis URL: %v", err)
	}

	RedisClient = redis.NewClient(opt)

	// Verify connection
	ctx := context.Background()
	if err := RedisClient.Ping(ctx).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	log.Println("Redis connection established")
	return RedisClient
}
