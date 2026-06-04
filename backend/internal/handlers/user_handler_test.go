package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/masza1/dapen-backend/internal/dto"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/masza1/dapen-backend/internal/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockUserRepository struct {
	GetByUsernameFunc func(username string) (*models.SUser, error)
	GetByIDFunc       func(id uint) (*models.SUser, error)
	CreateFunc        func(user *models.SUser) error
	UpdateFunc        func(user *models.SUser) error
	DeleteFunc        func(id uint) error

	GetPaginatedDBFLPASSFunc func(page, pageSize int, search string, status string) ([]models.SDBFLPASS, int64, error)
	GetByUserIDDBFLPASSFunc  func(userID string) (*models.SDBFLPASS, error)
	CreateDBFLPASSFunc       func(user *models.SDBFLPASS) error
	UpdateDBFLPASSFunc       func(user *models.SDBFLPASS) error
	DeleteDBFLPASSFunc       func(userID string) error

	GetUserPermissionsFunc    func(userID string) ([]models.SUserPermission, []models.SUserPermission, []models.SUserCoaAccess, error)
	UpdateUserPermissionsFunc func(userID string, menuPerms []models.SUserPermission, reportPerms []models.SUserPermission, coaPerms []models.SUserCoaAccess) error
}

// mockUserService is a testify mock for services.IUserService. It is used by
// the new split-getter and report handlers added in TASK-009.
type mockUserService struct {
	mock.Mock
}

func (m *mockUserService) GetUserMenuPermissions(userID string) ([]models.SUserPermission, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SUserPermission), args.Error(1)
}

func (m *mockUserService) GetUserReportPermissions(userID string) ([]models.SUserPermission, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SUserPermission), args.Error(1)
}

func (m *mockUserService) GetUserCoaAccess(userID string) ([]models.SUserCoaAccess, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SUserCoaAccess), args.Error(1)
}

func (m *mockUserService) GetUserPermissions(userID string) ([]models.SUserPermission, []models.SUserPermission, []models.SUserCoaAccess, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, nil, nil, args.Error(3)
	}
	return args.Get(0).([]models.SUserPermission), args.Get(1).([]models.SUserPermission), args.Get(2).([]models.SUserCoaAccess), args.Error(3)
}

func (m *mockUserService) UpdateUserPermissions(userID string, menuPerms []models.SUserPermission, reportPerms []models.SUserPermission, coaPerms []models.SUserCoaAccess) error {
	args := m.Called(userID, menuPerms, reportPerms, coaPerms)
	return args.Error(0)
}

func (m *mockUserService) GetPermissionReportMatrix(userID, menuCode, menuType string, page, pageSize int) ([]models.SPermissionReportRow, int64, error) {
	args := m.Called(userID, menuCode, menuType, page, pageSize)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]models.SPermissionReportRow), args.Get(1).(int64), args.Error(2)
}

// Compile-time check that mockUserService satisfies IUserService.
var _ services.IUserService = (*mockUserService)(nil)

func (m *mockUserRepository) GetByUsername(username string) (*models.SUser, error) {
	if m.GetByUsernameFunc != nil {
		return m.GetByUsernameFunc(username)
	}
	return nil, nil
}

func (m *mockUserRepository) GetByID(id uint) (*models.SUser, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(id)
	}
	return nil, nil
}

func (m *mockUserRepository) Create(user *models.SUser) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(user)
	}
	return nil
}

func (m *mockUserRepository) Update(user *models.SUser) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(user)
	}
	return nil
}

func (m *mockUserRepository) Delete(id uint) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(id)
	}
	return nil
}

func (m *mockUserRepository) GetPaginatedDBFLPASS(page, pageSize int, search string, status string) ([]models.SDBFLPASS, int64, error) {
	if m.GetPaginatedDBFLPASSFunc != nil {
		return m.GetPaginatedDBFLPASSFunc(page, pageSize, search, status)
	}
	return nil, 0, nil
}

func (m *mockUserRepository) GetByUserIDDBFLPASS(userID string) (*models.SDBFLPASS, error) {
	if m.GetByUserIDDBFLPASSFunc != nil {
		return m.GetByUserIDDBFLPASSFunc(userID)
	}
	return nil, nil
}

func (m *mockUserRepository) CreateDBFLPASS(user *models.SDBFLPASS) error {
	if m.CreateDBFLPASSFunc != nil {
		return m.CreateDBFLPASSFunc(user)
	}
	return nil
}

func (m *mockUserRepository) UpdateDBFLPASS(user *models.SDBFLPASS) error {
	if m.UpdateDBFLPASSFunc != nil {
		return m.UpdateDBFLPASSFunc(user)
	}
	return nil
}

func (m *mockUserRepository) DeleteDBFLPASS(userID string) error {
	if m.DeleteDBFLPASSFunc != nil {
		return m.DeleteDBFLPASSFunc(userID)
	}
	return nil
}

func (m *mockUserRepository) GetUserPermissions(userID string) ([]models.SUserPermission, []models.SUserPermission, []models.SUserCoaAccess, error) {
	if m.GetUserPermissionsFunc != nil {
		return m.GetUserPermissionsFunc(userID)
	}
	return nil, nil, nil, nil
}

func (m *mockUserRepository) UpdateUserPermissions(userID string, menuPerms []models.SUserPermission, reportPerms []models.SUserPermission, coaPerms []models.SUserCoaAccess) error {
	if m.UpdateUserPermissionsFunc != nil {
		return m.UpdateUserPermissionsFunc(userID, menuPerms, reportPerms, coaPerms)
	}
	return nil
}

func (m *mockUserRepository) GetUserMenuPermissions(userID string) ([]models.SUserPermission, error) {
	return nil, nil
}

func (m *mockUserRepository) GetUserReportPermissions(userID string) ([]models.SUserPermission, error) {
	return nil, nil
}

func (m *mockUserRepository) GetUserCoaAccess(userID string) ([]models.SUserCoaAccess, error) {
	return nil, nil
}

func (m *mockUserRepository) GetPermissionReportMatrix(userID, menuCode, menuType string, page, pageSize int) ([]models.SPermissionReportRow, int64, error) {
	return nil, 0, nil
}

func TestGetUsers(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Success retrieval", func(t *testing.T) {
		mockRepo := &mockUserRepository{
			GetPaginatedDBFLPASSFunc: func(page, pageSize int, search string, status string) ([]models.SDBFLPASS, int64, error) {
				return []models.SDBFLPASS{{USERID: "ADMIN", UID: "admin", FullName: "Administrator"}}, 1, nil
			},
		}
		handler := NewUserHandler(mockRepo, nil)

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/users?page=1&limit=10", nil)

		r.GET("/api/admin/users", handler.GetUsers)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "ADMIN")
	})

	t.Run("Error retrieval", func(t *testing.T) {
		mockRepo := &mockUserRepository{
			GetPaginatedDBFLPASSFunc: func(page, pageSize int, search string, status string) ([]models.SDBFLPASS, int64, error) {
				return nil, 0, errors.New("DB failure")
			},
		}
		handler := NewUserHandler(mockRepo, nil)

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/users", nil)

		r.GET("/api/admin/users", handler.GetUsers)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		assert.Contains(t, w.Body.String(), "Failed to retrieve users")
	})
}

func TestCreateUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Success create", func(t *testing.T) {
		mockRepo := &mockUserRepository{
			GetByUserIDDBFLPASSFunc: func(userID string) (*models.SDBFLPASS, error) {
				return nil, nil // unique
			},
			CreateDBFLPASSFunc: func(user *models.SDBFLPASS) error {
				return nil
			},
		}
		handler := NewUserHandler(mockRepo, nil)

		payload := dto.SCreateUserPayload{
			Username: "newuser",
			Password: "securepassword",
			FullName: "New User",
			Role:     "employee",
		}
		body, _ := json.Marshal(payload)

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("POST", "/api/admin/users", bytes.NewBuffer(body))

		r.POST("/api/admin/users", handler.CreateUser)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusCreated, w.Code)
	})

	t.Run("Duplicate username", func(t *testing.T) {
		mockRepo := &mockUserRepository{
			GetByUserIDDBFLPASSFunc: func(userID string) (*models.SDBFLPASS, error) {
				return &models.SDBFLPASS{USERID: "ADMIN", UID: "admin"}, nil
			},
		}
		handler := NewUserHandler(mockRepo, nil)

		payload := dto.SCreateUserPayload{
			Username: "admin",
			Password: "securepassword",
			FullName: "Admin User",
			Role:     "admin",
		}
		body, _ := json.Marshal(payload)

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("POST", "/api/admin/users", bytes.NewBuffer(body))

		r.POST("/api/admin/users", handler.CreateUser)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Username already exists")
	})

	t.Run("Validation failure", func(t *testing.T) {
		handler := NewUserHandler(&mockUserRepository{}, nil)

		payload := dto.SCreateUserPayload{
			Username: "",   // empty
			Password: "12", // too short
		}
		body, _ := json.Marshal(payload)

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("POST", "/api/admin/users", bytes.NewBuffer(body))

		r.POST("/api/admin/users", handler.CreateUser)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestUpdateUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Success update with no password change", func(t *testing.T) {
		mockRepo := &mockUserRepository{
			GetByUserIDDBFLPASSFunc: func(userID string) (*models.SDBFLPASS, error) {
				return &models.SDBFLPASS{USERID: "ADMIN", UID: "admin", UID2: "oldhash"}, nil
			},
			UpdateDBFLPASSFunc: func(user *models.SDBFLPASS) error {
				return nil
			},
		}
		handler := NewUserHandler(mockRepo, nil)

		payload := dto.SUpdateUserPayload{
			FullName: "Updated Admin",
			Role:     "admin",
		}
		body, _ := json.Marshal(payload)

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("PUT", "/api/admin/users/ADMIN", bytes.NewBuffer(body))

		r.PUT("/api/admin/users/:id", handler.UpdateUser)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "Updated Admin")
	})

	t.Run("Not found", func(t *testing.T) {
		mockRepo := &mockUserRepository{
			GetByUserIDDBFLPASSFunc: func(userID string) (*models.SDBFLPASS, error) {
				return nil, errors.New("not found")
			},
		}
		handler := NewUserHandler(mockRepo, nil)

		payload := dto.SUpdateUserPayload{
			FullName: "Updated Admin",
			Role:     "admin",
		}
		body, _ := json.Marshal(payload)

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("PUT", "/api/admin/users/UNKNOWN", bytes.NewBuffer(body))

		r.PUT("/api/admin/users/:id", handler.UpdateUser)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestDeleteUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Success delete other user", func(t *testing.T) {
		mockRepo := &mockUserRepository{
			DeleteDBFLPASSFunc: func(userID string) error {
				return nil
			},
		}
		handler := NewUserHandler(mockRepo, nil)

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("DELETE", "/api/admin/users/MIA", nil)

		r.DELETE("/api/admin/users/:id", func(ctx *gin.Context) {
			ctx.Set("legacy_user_id", "SA") // active user is SA, target is MIA
			handler.DeleteUser(ctx)
		})
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("Self deletion blocked", func(t *testing.T) {
		handler := NewUserHandler(&mockUserRepository{}, nil)

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("DELETE", "/api/admin/users/SA", nil)

		r.DELETE("/api/admin/users/:id", func(ctx *gin.Context) {
			ctx.Set("legacy_user_id", "SA") // active user is SA, target is SA
			handler.DeleteUser(ctx)
		})
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "You cannot delete your own account")
	})
}

// ─── TASK-009 split-getter & report handler tests ───────────────────────────

func TestGetUserMenuPermissions(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Success", func(t *testing.T) {
		mockSvc := new(mockUserService)
		handler := NewUserHandler(nil, mockSvc)
		expected := []models.SUserPermission{{KodeMenu: "M01", HasAccess: 1}}
		mockSvc.On("GetUserMenuPermissions", "ADMIN").Return(expected, nil).Once()

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/users/ADMIN/permissions/menu", nil)
		r.GET("/api/admin/users/:id/permissions/menu", handler.GetUserMenuPermissions)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "M01")
		mockSvc.AssertExpectations(t)
	})

	t.Run("Service error", func(t *testing.T) {
		mockSvc := new(mockUserService)
		handler := NewUserHandler(nil, mockSvc)
		mockSvc.On("GetUserMenuPermissions", "X").Return([]models.SUserPermission(nil), errors.New("db down")).Once()

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/users/X/permissions/menu", nil)
		r.GET("/api/admin/users/:id/permissions/menu", handler.GetUserMenuPermissions)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("Missing service surfaces 500", func(t *testing.T) {
		handler := NewUserHandler(nil, nil)

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/users/ADMIN/permissions/menu", nil)
		r.GET("/api/admin/users/:id/permissions/menu", handler.GetUserMenuPermissions)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		assert.Contains(t, w.Body.String(), "service is not configured")
	})
}

func TestGetUserReportPermissions(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Success", func(t *testing.T) {
		mockSvc := new(mockUserService)
		handler := NewUserHandler(nil, mockSvc)
		expected := []models.SUserPermission{{KodeMenu: "R01", IsPrint: 1}}
		mockSvc.On("GetUserReportPermissions", "ADMIN").Return(expected, nil).Once()

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/users/ADMIN/permissions/report", nil)
		r.GET("/api/admin/users/:id/permissions/report", handler.GetUserReportPermissions)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "R01")
		mockSvc.AssertExpectations(t)
	})

	t.Run("Service error", func(t *testing.T) {
		mockSvc := new(mockUserService)
		handler := NewUserHandler(nil, mockSvc)
		mockSvc.On("GetUserReportPermissions", "X").Return([]models.SUserPermission(nil), errors.New("db down")).Once()

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/users/X/permissions/report", nil)
		r.GET("/api/admin/users/:id/permissions/report", handler.GetUserReportPermissions)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("Missing service surfaces 500", func(t *testing.T) {
		handler := NewUserHandler(nil, nil)

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/users/ADMIN/permissions/report", nil)
		r.GET("/api/admin/users/:id/permissions/report", handler.GetUserReportPermissions)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestGetUserCoaAccess(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Success", func(t *testing.T) {
		mockSvc := new(mockUserService)
		handler := NewUserHandler(nil, mockSvc)
		expected := []models.SUserCoaAccess{{Perkiraan: "1101", Checked: 1}}
		mockSvc.On("GetUserCoaAccess", "ADMIN").Return(expected, nil).Once()

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/users/ADMIN/permissions/coa", nil)
		r.GET("/api/admin/users/:id/permissions/coa", handler.GetUserCoaAccess)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "1101")
		mockSvc.AssertExpectations(t)
	})

	t.Run("Service error", func(t *testing.T) {
		mockSvc := new(mockUserService)
		handler := NewUserHandler(nil, mockSvc)
		mockSvc.On("GetUserCoaAccess", "X").Return([]models.SUserCoaAccess(nil), errors.New("db down")).Once()

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/users/X/permissions/coa", nil)
		r.GET("/api/admin/users/:id/permissions/coa", handler.GetUserCoaAccess)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("Missing service surfaces 500", func(t *testing.T) {
		handler := NewUserHandler(nil, nil)

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/users/ADMIN/permissions/coa", nil)
		r.GET("/api/admin/users/:id/permissions/coa", handler.GetUserCoaAccess)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestGetPermissionReport(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("JSON success", func(t *testing.T) {
		mockSvc := new(mockUserService)
		handler := NewUserHandler(nil, mockSvc)
		rows := []models.SPermissionReportRow{
			{UserID: "ADMIN", MenuCode: "M01", MenuName: "Dashboard", Role: "admin", MenuType: "menu", HasAccess: 1},
		}
		mockSvc.On("GetPermissionReportMatrix", "ADMIN", "", "menu", 1, 50).Return(rows, int64(1), nil).Once()

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/reports/permissions?format=json&userId=ADMIN&page=1&perPage=50", nil)
		r.GET("/api/admin/reports/permissions", handler.GetPermissionReport)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "ADMIN")
		assert.Contains(t, w.Body.String(), "M01")
		mockSvc.AssertExpectations(t)
	})

	t.Run("Invalid format", func(t *testing.T) {
		handler := NewUserHandler(nil, new(mockUserService))
		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/reports/permissions?format=xml", nil)
		r.GET("/api/admin/reports/permissions", handler.GetPermissionReport)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Invalid format")
	})

	t.Run("Excel requires filter", func(t *testing.T) {
		handler := NewUserHandler(nil, new(mockUserService))
		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/reports/permissions?format=xlsx", nil)
		r.GET("/api/admin/reports/permissions", handler.GetPermissionReport)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "at least one filter")
	})

	t.Run("PDF requires filter", func(t *testing.T) {
		handler := NewUserHandler(nil, new(mockUserService))
		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/reports/permissions?format=pdf", nil)
		r.GET("/api/admin/reports/permissions", handler.GetPermissionReport)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "at least one filter")
	})

	t.Run("Excel with filter streams xlsx", func(t *testing.T) {
		mockSvc := new(mockUserService)
		handler := NewUserHandler(nil, mockSvc)
		rows := []models.SPermissionReportRow{
			{UserID: "ADMIN", MenuCode: "M01", MenuName: "Dashboard", HasAccess: 1, IsCreate: 1, IsPrint: 1},
		}
		// When format is xlsx the handler calls with page=0, pageSize=0
		mockSvc.On("GetPermissionReportMatrix", "ADMIN", "", "menu", 0, 0).Return(rows, int64(1), nil).Once()

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/reports/permissions?format=xlsx&userId=ADMIN", nil)
		r.GET("/api/admin/reports/permissions", handler.GetPermissionReport)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusOK, w.Code)
		ct := w.Header().Get("Content-Type")
		assert.Contains(t, ct, "spreadsheetml")
		cd := w.Header().Get("Content-Disposition")
		assert.Contains(t, cd, "permission-report-")
		// body should look like a real .xlsx
		assert.Equal(t, []byte{0x50, 0x4B, 0x03, 0x04}, w.Body.Bytes()[:4])
		mockSvc.AssertExpectations(t)
	})

	t.Run("PDF with filter streams pdf", func(t *testing.T) {
		mockSvc := new(mockUserService)
		handler := NewUserHandler(nil, mockSvc)
		rows := []models.SPermissionReportRow{
			{UserID: "ADMIN", MenuCode: "M01", MenuName: "Dashboard", HasAccess: 1, IsCreate: 1, IsPrint: 1},
		}
		mockSvc.On("GetPermissionReportMatrix", "ADMIN", "", "menu", 0, 0).Return(rows, int64(1), nil).Once()

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/reports/permissions?format=pdf&userId=ADMIN", nil)
		r.GET("/api/admin/reports/permissions", handler.GetPermissionReport)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusOK, w.Code)
		ct := w.Header().Get("Content-Type")
		assert.Contains(t, ct, "application/pdf")
		assert.True(t, bytes.HasPrefix(w.Body.Bytes(), []byte("%PDF")))
		mockSvc.AssertExpectations(t)
	})

	t.Run("Service error surfaces 500", func(t *testing.T) {
		mockSvc := new(mockUserService)
		handler := NewUserHandler(nil, mockSvc)
		mockSvc.On("GetPermissionReportMatrix", "ADMIN", "", "menu", 1, 50).
			Return([]models.SPermissionReportRow(nil), int64(0), errors.New("db down")).Once()

		c, r := gin.CreateTestContext(httptest.NewRecorder())
		c.Request, _ = http.NewRequest("GET", "/api/admin/reports/permissions?format=json&userId=ADMIN", nil)
		r.GET("/api/admin/reports/permissions", handler.GetPermissionReport)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, c.Request)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		mockSvc.AssertExpectations(t)
	})
}
