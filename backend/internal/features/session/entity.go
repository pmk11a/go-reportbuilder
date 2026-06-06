package session

import "time"

// SSessionInfo holds the details of a single active user session.
// It combines data stored in Redis under bff:session:{sessionId} and
// enriches it with metadata like login_ip, browser (user-agent), and status.
type SSessionInfo struct {
	SessionID string    `json:"session_id"`
	UserID    uint      `json:"user_id"`
	LoginTime time.Time `json:"login_time"`
	ExpiresAt time.Time `json:"expires_at"`
	LoginIP   string    `json:"login_ip"`
	Browser   string    `json:"browser"`
	Status    string    `json:"status"` // "active" or "expired"
}

// SRevokeSessionRequest holds the payload for revoking a specific session.
type SRevokeSessionRequest struct {
	UserID    uint
	SessionID string
}

// SRevokeAllSessionsRequest holds the payload for revoking all sessions for a user.
type SRevokeAllSessionsRequest struct {
	UserID uint
}

// SSessionRevocationResult wraps the result of a revocation operation.
type SSessionRevocationResult struct {
	RevokedCount int `json:"revoked_count"`
}
