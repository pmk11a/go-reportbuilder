package session

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/features/identity/user"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockSessionRepository mocks ISessionRepository
type MockSessionRepository struct {
	mock.Mock
}

// MockUserRepository mocks user.IUserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) GetByUsername(username string) (*user.SUser, error) {
	args := m.Called(username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.SUser), args.Error(1)
}

func (m *MockUserRepository) GetByID(id uint) (*user.SUser, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.SUser), args.Error(1)
}

func (m *MockUserRepository) Create(user *user.SUser) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) Update(user *user.SUser) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) Delete(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockUserRepository) GetUserIDByLegacyUserID(ctx context.Context, legacyUserID string) (uint, error) {
	args := m.Called(ctx, legacyUserID)
	if args.Error(1) != nil {
		return 0, args.Error(1)
	}
	return args.Get(0).(uint), args.Error(1)
}

func (m *MockUserRepository) GetPaginatedDBFLPASS(page, pageSize int, search string, status string) ([]user.SDBFLPASS, int64, error) {
	args := m.Called(page, pageSize, search, status)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]user.SDBFLPASS), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserRepository) GetByUserIDDBFLPASS(userID string) (*user.SDBFLPASS, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.SDBFLPASS), args.Error(1)
}

func (m *MockUserRepository) CreateDBFLPASS(user *user.SDBFLPASS) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) UpdateDBFLPASS(user *user.SDBFLPASS) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) DeleteDBFLPASS(userID string) error {
	args := m.Called(userID)
	return args.Error(0)
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
	mockSessionRepo := new(MockSessionRepository)
	mockUserRepo := new(MockUserRepository)

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

	mockUserRepo.On("GetUserIDByLegacyUserID", mock.Anything, "SA").Return(uint(1), nil)
	mockSessionRepo.On("GetUserSessions", mock.Anything, uint(1)).Return(sessions, nil)

	svc := NewSessionService(mockSessionRepo, nil)
	handler := NewSessionHandler(svc, mockUserRepo)

	// Create request with session_id cookie
	req := httptest.NewRequest("GET", "/api/admin/users/SA/sessions", nil)
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "session-1"})
	w := httptest.NewRecorder()

	// Setup Gin context
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "SA"}}
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
	assert.Equal(t, "session-1", dataMap["current_session_id"])
}

func TestListUserSessions_UserNotFound(t *testing.T) {
	mockSessionRepo := new(MockSessionRepository)
	mockUserRepo := new(MockUserRepository)

	// Simulate user not found
	mockUserRepo.On("GetUserIDByLegacyUserID", mock.Anything, "NONEXIST").
		Return(uint(0), context.DeadlineExceeded)

	svc := NewSessionService(mockSessionRepo, nil)
	handler := NewSessionHandler(svc, mockUserRepo)

	req := httptest.NewRequest("GET", "/api/admin/users/NONEXIST/sessions", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "NONEXIST"}}

	handler.ListUserSessions(c)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.False(t, resp["success"].(bool))
}

func TestRevokeSessionHandler_Success(t *testing.T) {
	mockSessionRepo := new(MockSessionRepository)
	mockUserRepo := new(MockUserRepository)

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

	mockUserRepo.On("GetUserIDByLegacyUserID", mock.Anything, "SA").Return(uint(1), nil)
	mockSessionRepo.On("GetSession", mock.Anything, "session-1").Return(session, nil)
	mockSessionRepo.On("RevokeSession", mock.Anything, "session-1").Return(nil)

	svc := NewSessionService(mockSessionRepo, nil)
	handler := NewSessionHandler(svc, mockUserRepo)

	req := httptest.NewRequest("DELETE", "/api/admin/users/SA/sessions/session-1", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{
		{Key: "id", Value: "SA"},
		{Key: "sessionId", Value: "session-1"},
	}
	c.Set("user_id", 999.0) // Admin user

	handler.RevokeSession(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.True(t, resp["success"].(bool))
	assert.Equal(t, "Session revoked successfully", resp["message"])

	mockSessionRepo.AssertCalled(t, "RevokeSession", mock.Anything, "session-1")
}

func TestRevokeSessionHandler_SessionNotFound(t *testing.T) {
	mockSessionRepo := new(MockSessionRepository)
	mockUserRepo := new(MockUserRepository)

	mockUserRepo.On("GetUserIDByLegacyUserID", mock.Anything, "SA").Return(uint(1), nil)
	mockSessionRepo.On("GetSession", mock.Anything, "nonexistent").Return(nil, nil)

	svc := NewSessionService(mockSessionRepo, nil)
	handler := NewSessionHandler(svc, mockUserRepo)

	req := httptest.NewRequest("DELETE", "/api/admin/users/SA/sessions/nonexistent", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{
		{Key: "id", Value: "SA"},
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
	mockSessionRepo := new(MockSessionRepository)
	mockUserRepo := new(MockUserRepository)

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

	mockUserRepo.On("GetUserIDByLegacyUserID", mock.Anything, "SA").Return(uint(1), nil)
	mockSessionRepo.On("GetSession", mock.Anything, "session-1").Return(session, nil)

	svc := NewSessionService(mockSessionRepo, nil)
	handler := NewSessionHandler(svc, mockUserRepo)

	req := httptest.NewRequest("DELETE", "/api/admin/users/SA/sessions/session-1", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{
		{Key: "id", Value: "SA"},
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
	mockSessionRepo := new(MockSessionRepository)
	mockUserRepo := new(MockUserRepository)

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

	mockUserRepo.On("GetUserIDByLegacyUserID", mock.Anything, "SA").Return(uint(1), nil)
	mockSessionRepo.On("GetUserSessions", mock.Anything, uint(1)).Return(sessions, nil)
	mockSessionRepo.On("RevokeSession", mock.Anything, "session-1").Return(nil)
	mockSessionRepo.On("RevokeSession", mock.Anything, "session-2").Return(nil)

	svc := NewSessionService(mockSessionRepo, nil)
	handler := NewSessionHandler(svc, mockUserRepo)

	req := httptest.NewRequest("DELETE", "/api/admin/users/SA/sessions", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{{Key: "id", Value: "SA"}}
	c.Set("user_id", 999.0)

	handler.RevokeAllSessions(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.True(t, resp["success"].(bool))
	assert.Equal(t, "All sessions revoked successfully", resp["message"])

	mockSessionRepo.AssertCalled(t, "RevokeSession", mock.Anything, "session-1")
	mockSessionRepo.AssertCalled(t, "RevokeSession", mock.Anything, "session-2")
}

func TestRevokeSessionHandler_NoUserIDInContext(t *testing.T) {
	mockSessionRepo := new(MockSessionRepository)
	mockUserRepo := new(MockUserRepository)

	mockUserRepo.On("GetUserIDByLegacyUserID", mock.Anything, "SA").Return(uint(1), nil)

	svc := NewSessionService(mockSessionRepo, nil)
	handler := NewSessionHandler(svc, mockUserRepo)

	req := httptest.NewRequest("DELETE", "/api/admin/users/SA/sessions/session-1", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{
		{Key: "id", Value: "SA"},
		{Key: "sessionId", Value: "session-1"},
	}
	// Don't set user_id in context

	handler.RevokeSession(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.False(t, resp["success"].(bool))
}
