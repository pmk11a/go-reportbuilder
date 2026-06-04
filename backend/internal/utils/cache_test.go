package utils

import (
	"context"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
)

type TestData struct {
	Name  string `json:"name"`
	Value int    `json:"value"`
}

func TestCacheManager(t *testing.T) {
	ctx := context.Background()

	// Connect to local Redis (expected to be running on 6379 in local dev)
	client := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})
	defer client.Close()

	// Check if Redis is up, otherwise skip tests requiring real connection
	redisUp := true
	if err := client.Ping(ctx).Err(); err != nil {
		t.Logf("Redis is down (%v) - running in Fail-Open test mode only", err)
		redisUp = false
	}

	t.Run("Fail-Open when Redis Client is Nil", func(t *testing.T) {
		manager := NewCacheManager(nil)
		assert.False(t, manager.IsActive(ctx))

		// Get, Set, and Delete should return false/fail-open gracefully
		var data TestData
		assert.False(t, manager.Get(ctx, "test_nil", &data))
		assert.False(t, manager.Set(ctx, "test_nil", TestData{"Alice", 42}, time.Minute))
		assert.False(t, manager.Delete(ctx, "test_nil"))
		assert.False(t, manager.DeleteByPattern(ctx, "test_*"))
	})

	if !redisUp {
		t.Skip("Skipping live Redis tests as local Redis server is down")
		return
	}

	// Live Redis tests
	manager := NewCacheManager(client)
	assert.True(t, manager.IsActive(ctx))

	t.Run("Get and Set Successful Operations", func(t *testing.T) {
		key := "cache_test:item_1"
		original := TestData{
			Name:  "Dapen User",
			Value: 99,
		}

		// Cleanup before
		manager.Delete(ctx, key)

		// Get empty
		var result TestData
		found := manager.Get(ctx, key, &result)
		assert.False(t, found)

		// Set
		stored := manager.Set(ctx, key, original, 5*time.Second)
		assert.True(t, stored)

		// Get success
		found = manager.Get(ctx, key, &result)
		assert.True(t, found)
		assert.Equal(t, original.Name, result.Name)
		assert.Equal(t, original.Value, result.Value)

		// Delete success
		deleted := manager.Delete(ctx, key)
		assert.True(t, deleted)

		// Verify deletion
		var deletedResult TestData
		found = manager.Get(ctx, key, &deletedResult)
		assert.False(t, found)
	})

	t.Run("Delete by Pattern", func(t *testing.T) {
		key1 := "cache_test:pattern:1"
		key2 := "cache_test:pattern:2"
		key3 := "cache_test:other:1"

		manager.Set(ctx, key1, "val1", time.Minute)
		manager.Set(ctx, key2, "val2", time.Minute)
		manager.Set(ctx, key3, "val3", time.Minute)

		// Delete by pattern
		cleared := manager.DeleteByPattern(ctx, "cache_test:pattern:*")
		assert.True(t, cleared)

		// Verify deleted
		var v1, v2, v3 string
		assert.False(t, manager.Get(ctx, key1, &v1))
		assert.False(t, manager.Get(ctx, key2, &v2))
		assert.True(t, manager.Get(ctx, key3, &v3)) // this should NOT be deleted

		// Cleanup remaining
		manager.Delete(ctx, key3)
	})
}
