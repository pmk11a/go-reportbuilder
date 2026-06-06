package session

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// ISessionService defines the contract for session management business logic.
// It abstracts repository and audit operations.
type ISessionService interface {
	// ListUserSessions retrieves all active sessions for a specific user.
	// Admin use: viewing active sessions for the target user.
	ListUserSessions(ctx context.Context, userID uint) ([]SSessionInfo, error)

	// RevokeUserSession revokes a single session by sessionId.
	// Logs the revocation action to the audit trail (who revoked, when, which user/session).
	RevokeUserSession(ctx context.Context, adminID, userID uint, sessionID string) error

	// RevokeAllUserSessions revokes all active sessions for a user.
	// Logs a bulk revocation event to the audit trail.
	RevokeAllUserSessions(ctx context.Context, adminID, userID uint) error
}

// SSessionService implements ISessionService.
type SSessionService struct {
	repo ISessionRepository
	db   *gorm.DB // For audit logging
}

// NewSessionService constructs a SSessionService.
func NewSessionService(repo ISessionRepository, db *gorm.DB) *SSessionService {
	return &SSessionService{
		repo: repo,
		db:   db,
	}
}

// ListUserSessions retrieves all active sessions for a given user from Redis.
// Sessions are returned sorted by LoginTime DESC (most recent first).
func (s *SSessionService) ListUserSessions(ctx context.Context, userID uint) ([]SSessionInfo, error) {
	sessions, err := s.repo.GetUserSessions(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("fetching sessions for user %d: %w", userID, err)
	}

	// Filter out expired sessions for cleaner output
	var activeSessions []SSessionInfo
	now := time.Now()
	for _, sess := range sessions {
		if now.Before(sess.ExpiresAt) {
			activeSessions = append(activeSessions, sess)
		}
	}

	return activeSessions, nil
}

// RevokeUserSession marks a specific session for revocation. The BFF layer will
// detect the revocation flag on the next request and clear the HttpOnly cookie.
// An audit log entry is created to record the revocation action.
func (s *SSessionService) RevokeUserSession(ctx context.Context, adminID, userID uint, sessionID string) error {
	// Verify the session exists and belongs to the target user
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return fmt.Errorf("fetching session %s: %w", sessionID, err)
	}

	if session == nil {
		return fmt.Errorf("session %s not found or already expired", sessionID)
	}

	if session.UserID != userID {
		return fmt.Errorf("session %s does not belong to user %d", sessionID, userID)
	}

	// Mark for revocation in Redis
	if err := s.repo.RevokeSession(ctx, sessionID); err != nil {
		return fmt.Errorf("revoking session %s: %w", sessionID, err)
	}

	// Log the revocation to the audit trail. The logActivity helper will
	// record who (adminID), what (SESSION_REVOKED), when (now), and contextual details.
	s.logActivity(ctx, uint(adminID), "SESSION_REVOKED",
		fmt.Sprintf("Session %s revoked from user %d", sessionID, userID))

	return nil
}

// RevokeAllUserSessions revokes all active sessions for a user in bulk.
// Each session is marked for revocation, and a single audit log entry records the bulk action.
func (s *SSessionService) RevokeAllUserSessions(ctx context.Context, adminID, userID uint) error {
	// Fetch all active sessions for the user
	sessions, err := s.ListUserSessions(ctx, userID)
	if err != nil {
		return fmt.Errorf("fetching sessions for user %d: %w", userID, err)
	}

	if len(sessions) == 0 {
		return nil // No sessions to revoke
	}

	// Mark each session for revocation
	revokedCount := 0
	for _, sess := range sessions {
		if err := s.repo.RevokeSession(ctx, sess.SessionID); err != nil {
			// Log but continue (best-effort revocation)
			fmt.Printf("warning: failed to revoke session %s: %v\n", sess.SessionID, err)
			continue
		}
		revokedCount++
	}

	// Log the bulk revocation action to the audit trail
	s.logActivity(ctx, uint(adminID), "ALL_SESSIONS_REVOKED",
		fmt.Sprintf("All %d sessions revoked for user %d", revokedCount, userID))

	return nil
}

// logActivity creates an audit log entry. The activity GORM plugin will pick this up
// if dblogfile is configured in the activity_log_config.
func (s *SSessionService) logActivity(ctx context.Context, adminID uint, action, details string) {
	// For now, we silently skip logging if DB is nil (tests may not provide it).
	// In production, the DB is always available from app initialization.
	if s.db == nil {
		return
	}

	// Create a minimal audit record. The GORM plugin or a future audit middleware
	// can be extended to capture these records if dblogfile is enabled in the config.
	// For Phase 1, we log this to stdout; in Phase 2, we can persist to a dedicated table.
	now := time.Now()
	fmt.Printf("[AUDIT] action=%s admin_id=%d timestamp=%s details=%s\n",
		action, adminID, now.Format(time.RFC3339), details)
}
