package session

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockSessionRepository mocks ISessionRepository
type MockSessionRepository struct {
	mock.Mock
}

func (m *MockSessionRepository) GetUserSessions(ctx context.Context, userID uint) ([]SSessionInfo, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]SSessionInfo), args.Error(1)
}

func (m *MockSessionRepository) GetSession(ctx context.Context, sessionID string) (*SSessionInfo, error) {
	args := m.Called(ctx, sessionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*SSessionInfo), args.Error(1)
}

func (m *MockSessionRepository) RevokeSession(ctx context.Context, sessionID string) error {
	args := m.Called(ctx, sessionID)
	return args.Error(0)
}

func (m *MockSessionRepository) GetSessionsToRevoke(ctx context.Context) ([]string, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]string), args.Error(1)
}

func (m *MockSessionRepository) ClearRevocationFlag(ctx context.Context, sessionID string) error {
	args := m.Called(ctx, sessionID)
	return args.Error(0)
}


func TestListUserSessions_Success(t *testing.T) {
	// Setup
	mockRepo := new(MockSessionRepository)

	now := time.Now()
	sessions := []SSessionInfo{
		{
			SessionID: "session-1",
			UserID:    1,
			LoginTime: now.Add(-2 * time.Hour),
			ExpiresAt: now.Add(5 * time.Hour),
			LoginIP:   "192.168.1.100",
			Browser:   "Chrome/macOS",
			Status:    "active",
		},
		{
			SessionID: "session-2",
			UserID:    1,
			LoginTime: now.Add(-1 * time.Hour),
			ExpiresAt: now.Add(6 * time.Hour),
			LoginIP:   "192.168.1.101",
			Browser:   "Safari/macOS",
			Status:    "active",
		},
	}

	mockRepo.On("GetUserSessions", mock.Anything, uint(1)).Return(sessions, nil)

	svc := NewSessionService(mockRepo, nil)
	handler := NewSessionHandler(svc)

	// Create request
	req := httptest.NewRequest("GET", "/api/admin/users/1/sessions", nil)
	w := httptest.NewRecorder()

	// Setup Gin context
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{{Key: "userId", Value: "1"}}
	c.Set("user_id", 999.0) // Mock admin user

	// Execute
	handler.ListUserSessions(c)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.True(t, resp["success"].(bool))
	assert.Equal(t, "Sessions retrieved successfully", resp["message"])

	dataMap := resp["data"].(map[string]interface{})
	sessionsList := dataMap["sessions"].([]interface{})
	assert.Equal(t, 2, len(sessionsList))
}

func TestListUserSessions_InvalidUserID(t *testing.T) {
	mockRepo := new(MockSessionRepository)

	svc := NewSessionService(mockRepo, nil)
	handler := NewSessionHandler(svc)

	req := httptest.NewRequest("GET", "/api/admin/users/invalid/sessions", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{{Key: "userId", Value: "invalid"}}

	handler.ListUserSessions(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.False(t, resp["success"].(bool))
}

func TestRevokeSessionHandler_Success(t *testing.T) {
	mockRepo := new(MockSessionRepository)

	now := time.Now()
	session := &SSessionInfo{
		SessionID: "session-1",
		UserID:    1,
		LoginTime: now.Add(-1 * time.Hour),
		ExpiresAt: now.Add(6 * time.Hour),
		LoginIP:   "192.168.1.100",
		Browser:   "Chrome/macOS",
		Status:    "active",
	}

	mockRepo.On("GetSession", mock.Anything, "session-1").Return(session, nil)
	mockRepo.On("RevokeSession", mock.Anything, "session-1").Return(nil)

	svc := NewSessionService(mockRepo, nil)
	handler := NewSessionHandler(svc)

	req := httptest.NewRequest("DELETE", "/api/admin/users/1/sessions/session-1", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{
		{Key: "userId", Value: "1"},
		{Key: "sessionId", Value: "session-1"},
	}
	c.Set("user_id", 999.0) // Admin user

	handler.RevokeSession(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.True(t, resp["success"].(bool))
	assert.Equal(t, "Session revoked successfully", resp["message"])

	mockRepo.AssertCalled(t, "RevokeSession", mock.Anything, "session-1")
}

func TestRevokeSessionHandler_SessionNotFound(t *testing.T) {
	mockRepo := new(MockSessionRepository)

	mockRepo.On("GetSession", mock.Anything, "nonexistent").Return(nil, nil)

	svc := NewSessionService(mockRepo, nil)
	handler := NewSessionHandler(svc)

	req := httptest.NewRequest("DELETE", "/api/admin/users/1/sessions/nonexistent", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{
		{Key: "userId", Value: "1"},
		{Key: "sessionId", Value: "nonexistent"},
	}
	c.Set("user_id", 999.0)

	handler.RevokeSession(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.False(t, resp["success"].(bool))
}

func TestRevokeSessionHandler_SessionBelongsToOtherUser(t *testing.T) {
	mockRepo := new(MockSessionRepository)

	now := time.Now()
	session := &SSessionInfo{
		SessionID: "session-1",
		UserID:    2, // Different user
		LoginTime: now.Add(-1 * time.Hour),
		ExpiresAt: now.Add(6 * time.Hour),
		LoginIP:   "192.168.1.100",
		Browser:   "Chrome/macOS",
		Status:    "active",
	}

	mockRepo.On("GetSession", mock.Anything, "session-1").Return(session, nil)

	svc := NewSessionService(mockRepo, nil)
	handler := NewSessionHandler(svc)

	req := httptest.NewRequest("DELETE", "/api/admin/users/1/sessions/session-1", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{
		{Key: "userId", Value: "1"},
		{Key: "sessionId", Value: "session-1"},
	}
	c.Set("user_id", 999.0)

	handler.RevokeSession(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.False(t, resp["success"].(bool))
}

func TestRevokeAllSessions_Success(t *testing.T) {
	mockRepo := new(MockSessionRepository)

	now := time.Now()
	sessions := []SSessionInfo{
		{
			SessionID: "session-1",
			UserID:    1,
			LoginTime: now.Add(-2 * time.Hour),
			ExpiresAt: now.Add(5 * time.Hour),
			LoginIP:   "192.168.1.100",
			Browser:   "Chrome/macOS",
			Status:    "active",
		},
		{
			SessionID: "session-2",
			UserID:    1,
			LoginTime: now.Add(-1 * time.Hour),
			ExpiresAt: now.Add(6 * time.Hour),
			LoginIP:   "192.168.1.101",
			Browser:   "Safari/macOS",
			Status:    "active",
		},
	}

	mockRepo.On("GetUserSessions", mock.Anything, uint(1)).Return(sessions, nil)
	mockRepo.On("RevokeSession", mock.Anything, "session-1").Return(nil)
	mockRepo.On("RevokeSession", mock.Anything, "session-2").Return(nil)

	svc := NewSessionService(mockRepo, nil)
	handler := NewSessionHandler(svc)

	req := httptest.NewRequest("DELETE", "/api/admin/users/1/sessions", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{{Key: "userId", Value: "1"}}
	c.Set("user_id", 999.0)

	handler.RevokeAllSessions(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.True(t, resp["success"].(bool))
	assert.Equal(t, "All sessions revoked successfully", resp["message"])

	mockRepo.AssertCalled(t, "RevokeSession", mock.Anything, "session-1")
	mockRepo.AssertCalled(t, "RevokeSession", mock.Anything, "session-2")
}

func TestRevokeSessionHandler_NoUserIDInContext(t *testing.T) {
	mockRepo := new(MockSessionRepository)

	svc := NewSessionService(mockRepo, nil)
	handler := NewSessionHandler(svc)

	req := httptest.NewRequest("DELETE", "/api/admin/users/1/sessions/session-1", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{
		{Key: "userId", Value: "1"},
		{Key: "sessionId", Value: "session-1"},
	}
	// Don't set user_id in context

	handler.RevokeSession(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.False(t, resp["success"].(bool))
}
