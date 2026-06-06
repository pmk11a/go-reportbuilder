package session

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)


// TestNewSessionService tests the constructor
func TestNewSessionService(t *testing.T) {
	mockRepo := new(MockSessionRepository)
	mockDB := &gorm.DB{}

	svc := NewSessionService(mockRepo, mockDB)
	assert.NotNil(t, svc)
	assert.Equal(t, mockRepo, svc.repo)
	assert.Equal(t, mockDB, svc.db)
}

// TestListUserSessions_FilterExpiredSessions tests that expired sessions are filtered out
func TestListUserSessions_FilterExpiredSessions(t *testing.T) {
	mockRepo := new(MockSessionRepository)
	mockDB := &gorm.DB{}

	now := time.Now()
	sessions := []SSessionInfo{
		{
			SessionID: "active-1",
			UserID:    1,
			LoginTime: now.Add(-1 * time.Hour),
			ExpiresAt: now.Add(5 * time.Hour), // Expires in future
			Status:    "active",
		},
		{
			SessionID: "expired-1",
			UserID:    1,
			LoginTime: now.Add(-10 * time.Hour),
			ExpiresAt: now.Add(-1 * time.Hour), // Expired
			Status:    "expired",
		},
		{
			SessionID: "active-2",
			UserID:    1,
			LoginTime: now.Add(-2 * time.Hour),
			ExpiresAt: now.Add(4 * time.Hour),
			Status:    "active",
		},
	}

	mockRepo.On("GetUserSessions", mock.Anything, uint(1)).Return(sessions, nil)

	svc := NewSessionService(mockRepo, mockDB)
	result, err := svc.ListUserSessions(context.Background(), 1)

	assert.NoError(t, err)
	assert.Equal(t, 2, len(result)) // Only active sessions
	assert.Equal(t, "active-1", result[0].SessionID)
	assert.Equal(t, "active-2", result[1].SessionID)
}

// TestListUserSessions_Empty tests empty session list
func TestListUserSessions_Empty(t *testing.T) {
	mockRepo := new(MockSessionRepository)
	mockDB := &gorm.DB{}

	mockRepo.On("GetUserSessions", mock.Anything, uint(1)).Return([]SSessionInfo{}, nil)

	svc := NewSessionService(mockRepo, mockDB)
	result, err := svc.ListUserSessions(context.Background(), 1)

	assert.NoError(t, err)
	assert.Equal(t, 0, len(result))
}

// TestListUserSessions_RepositoryError tests error propagation
func TestListUserSessions_RepositoryError(t *testing.T) {
	mockRepo := new(MockSessionRepository)
	mockDB := &gorm.DB{}

	mockRepo.On("GetUserSessions", mock.Anything, uint(1)).Return(nil, assert.AnError)

	svc := NewSessionService(mockRepo, mockDB)
	_, err := svc.ListUserSessions(context.Background(), 1)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "fetching sessions for user 1")
}

// TestRevokeUserSession_Success tests successful revocation
func TestRevokeUserSession_Success(t *testing.T) {
	mockRepo := new(MockSessionRepository)
	mockDB := &gorm.DB{}

	now := time.Now()
	session := &SSessionInfo{
		SessionID: "session-1",
		UserID:    1,
		LoginTime: now.Add(-1 * time.Hour),
		ExpiresAt: now.Add(6 * time.Hour),
		Status:    "active",
	}

	mockRepo.On("GetSession", mock.Anything, "session-1").Return(session, nil)
	mockRepo.On("RevokeSession", mock.Anything, "session-1").Return(nil)

	svc := NewSessionService(mockRepo, mockDB)
	err := svc.RevokeUserSession(context.Background(), 999, 1, "session-1")

	assert.NoError(t, err)
	mockRepo.AssertCalled(t, "RevokeSession", mock.Anything, "session-1")
}

// TestRevokeUserSession_SessionNotFound tests error when session doesn't exist
func TestRevokeUserSession_SessionNotFound(t *testing.T) {
	mockRepo := new(MockSessionRepository)
	mockDB := &gorm.DB{}

	mockRepo.On("GetSession", mock.Anything, "nonexistent").Return(nil, nil)

	svc := NewSessionService(mockRepo, mockDB)
	err := svc.RevokeUserSession(context.Background(), 999, 1, "nonexistent")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found or already expired")
}

// TestRevokeUserSession_SessionBelongsToOtherUser tests authorization check
func TestRevokeUserSession_SessionBelongsToOtherUser(t *testing.T) {
	mockRepo := new(MockSessionRepository)
	mockDB := &gorm.DB{}

	now := time.Now()
	session := &SSessionInfo{
		SessionID: "session-1",
		UserID:    2, // Different user
		LoginTime: now.Add(-1 * time.Hour),
		ExpiresAt: now.Add(6 * time.Hour),
		Status:    "active",
	}

	mockRepo.On("GetSession", mock.Anything, "session-1").Return(session, nil)

	svc := NewSessionService(mockRepo, mockDB)
	err := svc.RevokeUserSession(context.Background(), 999, 1, "session-1")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "does not belong to user")
}

// TestRevokeAllUserSessions_Success tests bulk revocation
func TestRevokeAllUserSessions_Success(t *testing.T) {
	mockRepo := new(MockSessionRepository)
	mockDB := &gorm.DB{}

	now := time.Now()
	sessions := []SSessionInfo{
		{
			SessionID: "session-1",
			UserID:    1,
			LoginTime: now.Add(-2 * time.Hour),
			ExpiresAt: now.Add(5 * time.Hour),
			Status:    "active",
		},
		{
			SessionID: "session-2",
			UserID:    1,
			LoginTime: now.Add(-1 * time.Hour),
			ExpiresAt: now.Add(6 * time.Hour),
			Status:    "active",
		},
	}

	mockRepo.On("GetUserSessions", mock.Anything, uint(1)).Return(sessions, nil)
	mockRepo.On("RevokeSession", mock.Anything, "session-1").Return(nil)
	mockRepo.On("RevokeSession", mock.Anything, "session-2").Return(nil)

	svc := NewSessionService(mockRepo, mockDB)
	err := svc.RevokeAllUserSessions(context.Background(), 999, 1)

	assert.NoError(t, err)
	mockRepo.AssertCalled(t, "RevokeSession", mock.Anything, "session-1")
	mockRepo.AssertCalled(t, "RevokeSession", mock.Anything, "session-2")
}

// TestRevokeAllUserSessions_NoSessions tests when user has no sessions
func TestRevokeAllUserSessions_NoSessions(t *testing.T) {
	mockRepo := new(MockSessionRepository)
	mockDB := &gorm.DB{}

	mockRepo.On("GetUserSessions", mock.Anything, uint(1)).Return([]SSessionInfo{}, nil)

	svc := NewSessionService(mockRepo, mockDB)
	err := svc.RevokeAllUserSessions(context.Background(), 999, 1)

	assert.NoError(t, err)
}

// TestRevokeAllUserSessions_PartialFailure tests best-effort revocation
func TestRevokeAllUserSessions_PartialFailure(t *testing.T) {
	mockRepo := new(MockSessionRepository)
	mockDB := &gorm.DB{}

	now := time.Now()
	sessions := []SSessionInfo{
		{
			SessionID: "session-1",
			UserID:    1,
			LoginTime: now.Add(-2 * time.Hour),
			ExpiresAt: now.Add(5 * time.Hour),
			Status:    "active",
		},
		{
			SessionID: "session-2",
			UserID:    1,
			LoginTime: now.Add(-1 * time.Hour),
			ExpiresAt: now.Add(6 * time.Hour),
			Status:    "active",
		},
	}

	mockRepo.On("GetUserSessions", mock.Anything, uint(1)).Return(sessions, nil)
	mockRepo.On("RevokeSession", mock.Anything, "session-1").Return(assert.AnError)
	mockRepo.On("RevokeSession", mock.Anything, "session-2").Return(nil)

	svc := NewSessionService(mockRepo, mockDB)
	err := svc.RevokeAllUserSessions(context.Background(), 999, 1)

	// Should still succeed (best-effort)
	assert.NoError(t, err)
}
