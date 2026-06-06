package session

import (
	"encoding/json"
	"testing"
	"time"
)

// TestRepositoryLayer_SkipUnitTests indicates that repository layer tests
// require a real Redis instance and belong in E2E tests, not unit tests.
// The helper function createMockSessionData below documents the expected format.
func TestRepositoryLayer_SkipUnitTests(t *testing.T) {
	t.Skip("Redis integration tests belong in E2E; unit tests use mocked repositories (see service_test.go)")
}

// Helper: createMockSessionData creates a JSON-encoded session for Redis storage.
// This helper documents the expected JSON structure that the repository parses.
func createMockSessionData(userID uint, loginTime, expiresAt time.Time, loginIP, browser string) string {
	sessionData := map[string]interface{}{
		"user_id":    userID,
		"login_time": loginTime.Format(time.RFC3339),
		"expires_at": expiresAt.Format(time.RFC3339),
		"login_ip":   loginIP,
		"browser":    browser,
	}
	data, _ := json.Marshal(sessionData)
	return string(data)
}

// Note on test strategy:
// =====================
// Unit tests for the repository layer mostly verify error handling paths,
// since the actual Redis interaction requires either:
// 1. A real Redis instance (E2E tests in backend/tests/e2e/)
// 2. A Redis mock (requires DATA-DOG/go-redismock which is less mature than go-sqlmock)
//
// The main logic (parsing JSON, filtering expired sessions, permission checks) is tested
// in handler_test.go and service_test.go via mocked repositories.
//
// For full E2E coverage of Redis session storage, spin up a Redis container
// in docker-compose and write integration tests that actually store/retrieve sessions.
