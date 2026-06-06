package session

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// ISessionRepository defines the contract for session data access.
// Sessions are stored in Redis under keys: bff:session:{sessionId} and
// bff:user_sessions:{userId} (set of sessionIds).
type ISessionRepository interface {
	// GetUserSessions retrieves all active sessions for a given user from Redis.
	// Returns a list of session info ordered by LoginTime DESC.
	GetUserSessions(ctx context.Context, userID uint) ([]SSessionInfo, error)

	// GetSession retrieves a single session's full details from Redis by sessionId.
	// Returns nil if session not found (expired or invalid).
	GetSession(ctx context.Context, sessionID string) (*SSessionInfo, error)

	// RevokeSession marks a session for revocation by setting a flag in Redis.
	// The BFF layer will check this flag during the next request and clear the HttpOnly cookie.
	RevokeSession(ctx context.Context, sessionID string) error

	// GetSessionsToRevoke returns all sessionIds that are marked for revocation.
	// This is used for cleanup/audit logging.
	GetSessionsToRevoke(ctx context.Context) ([]string, error)

	// ClearRevocationFlag removes a session from the revocation set after cleanup.
	ClearRevocationFlag(ctx context.Context, sessionID string) error
}

// SSessionRepository is the concrete implementation of ISessionRepository.
type SSessionRepository struct {
	redisClient *redis.Client
}

// NewSessionRepository constructs a SSessionRepository with the given Redis client.
func NewSessionRepository(client *redis.Client) *SSessionRepository {
	return &SSessionRepository{redisClient: client}
}

// GetUserSessions queries Redis for all sessionIds belonging to a user,
// then fetches full SessionInfo for each. Returns ordered by LoginTime DESC.
func (r *SSessionRepository) GetUserSessions(ctx context.Context, userID uint) ([]SSessionInfo, error) {
	// Query the set bff:user_sessions:{userID} to get all sessionIds
	userSessionsKey := fmt.Sprintf("bff:user_sessions:%d", userID)
	sessionIDs, err := r.redisClient.SMembers(ctx, userSessionsKey).Result()
	if err != nil && err != redis.Nil {
		return nil, fmt.Errorf("fetching session IDs for user %d: %w", userID, err)
	}

	if len(sessionIDs) == 0 {
		return []SSessionInfo{}, nil // No sessions
	}

	var sessions []SSessionInfo
	for _, sessionID := range sessionIDs {
		session, err := r.GetSession(ctx, sessionID)
		if err != nil {
			// Log but continue (session may have expired)
			continue
		}
		if session != nil {
			sessions = append(sessions, *session)
		}
	}

	// Sort by LoginTime DESC (most recent first)
	// Simple bubble sort for small lists; in production, consider a heap or std lib sort
	for i := 0; i < len(sessions)-1; i++ {
		for j := i + 1; j < len(sessions); j++ {
			if sessions[j].LoginTime.After(sessions[i].LoginTime) {
				sessions[i], sessions[j] = sessions[j], sessions[i]
			}
		}
	}

	return sessions, nil
}

// GetSession fetches full SessionInfo from Redis key bff:session:{sessionId}.
// SessionData in Redis is expected to be JSON with at minimum:
// {
//   "user_id": 123,
//   "login_time": "2026-06-06T10:30:00Z",
//   "expires_at": "2026-06-13T10:30:00Z",
//   "login_ip": "192.168.1.100",
//   "browser": "Chrome/macOS"
// }
func (r *SSessionRepository) GetSession(ctx context.Context, sessionID string) (*SSessionInfo, error) {
	sessionKey := fmt.Sprintf("bff:session:%s", sessionID)
	sessionDataJSON, err := r.redisClient.Get(ctx, sessionKey).Result()
	if err == redis.Nil {
		return nil, nil // Session not found (expired or never existed)
	}
	if err != nil {
		return nil, fmt.Errorf("fetching session %s from Redis: %w", sessionID, err)
	}

	// Parse SessionData from JSON. The BFF stores the session data in this format.
	var sessionData map[string]interface{}
	if err := json.Unmarshal([]byte(sessionDataJSON), &sessionData); err != nil {
		return nil, fmt.Errorf("unmarshalling session data for %s: %w", sessionID, err)
	}

	// Extract and parse fields. Note: timestamps may arrive as strings (RFC3339) or unix timestamps.
	var session SSessionInfo
	session.SessionID = sessionID

	if userID, ok := sessionData["user_id"]; ok {
		if uid, ok := userID.(float64); ok {
			session.UserID = uint(uid)
		}
	}

	if loginTimeStr, ok := sessionData["login_time"].(string); ok {
		if t, err := time.Parse(time.RFC3339, loginTimeStr); err == nil {
			session.LoginTime = t
		}
	}

	if expiresAtStr, ok := sessionData["expires_at"].(string); ok {
		if t, err := time.Parse(time.RFC3339, expiresAtStr); err == nil {
			session.ExpiresAt = t
		}
	}

	if loginIP, ok := sessionData["login_ip"].(string); ok {
		session.LoginIP = loginIP
	}

	if browser, ok := sessionData["browser"].(string); ok {
		session.Browser = browser
	}

	// Determine status based on expiration
	if time.Now().After(session.ExpiresAt) {
		session.Status = "expired"
	} else {
		session.Status = "active"
	}

	return &session, nil
}

// RevokeSession sets a flag in Redis indicating that a session is revoked.
// The BFF layer checks bff:revoked_sessions:{sessionId} on every request and clears
// the session cookie if the flag exists. We set a TTL equal to the session's remaining life
// or a minimum of 1 minute.
func (r *SSessionRepository) RevokeSession(ctx context.Context, sessionID string) error {
	revocationKey := fmt.Sprintf("bff:revoked_sessions:%s", sessionID)

	// Fetch the session to determine TTL
	session, err := r.GetSession(ctx, sessionID)
	if err != nil {
		return fmt.Errorf("fetching session %s to determine TTL: %w", sessionID, err)
	}

	if session == nil {
		// Session already gone (expired); mark for cleanup anyway
		return r.redisClient.Set(ctx, revocationKey, "true", 1*time.Minute).Err()
	}

	ttl := time.Until(session.ExpiresAt)
	if ttl < 1*time.Minute {
		ttl = 1 * time.Minute
	}

	if err := r.redisClient.Set(ctx, revocationKey, "true", ttl).Err(); err != nil {
		return fmt.Errorf("setting revocation flag for session %s: %w", sessionID, err)
	}

	return nil
}

// GetSessionsToRevoke returns all sessionIds marked for revocation.
// These are keys matching pattern bff:revoked_sessions:*.
func (r *SSessionRepository) GetSessionsToRevoke(ctx context.Context) ([]string, error) {
	pattern := "bff:revoked_sessions:*"
	var cursor uint64
	var revocationKeys []string

	for {
		keys, cursor, err := r.redisClient.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			return nil, fmt.Errorf("scanning revocation keys: %w", err)
		}

		revocationKeys = append(revocationKeys, keys...)

		if cursor == 0 {
			break
		}
	}

	return revocationKeys, nil
}

// ClearRevocationFlag removes a session from the revocation set.
// Called after audit logging to clean up the revocation marker.
func (r *SSessionRepository) ClearRevocationFlag(ctx context.Context, sessionID string) error {
	revocationKey := fmt.Sprintf("bff:revoked_sessions:%s", sessionID)
	if err := r.redisClient.Del(ctx, revocationKey).Err(); err != nil {
		return fmt.Errorf("clearing revocation flag for session %s: %w", sessionID, err)
	}
	return nil
}
