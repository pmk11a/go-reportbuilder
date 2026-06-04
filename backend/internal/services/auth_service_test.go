package services

import (
	"testing"

	"github.com/masza1/dapen-backend/internal/shared/config"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang.org/x/crypto/bcrypt"
)

// MockUserRepository is a mock of IUserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) GetByUsername(username string) (*models.SUser, error) {
	args := m.Called(username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SUser), args.Error(1)
}

func (m *MockUserRepository) Create(user *models.SUser) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) GetByID(id uint) (*models.SUser, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SUser), args.Error(1)
}

func (m *MockUserRepository) Update(user *models.SUser) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) Delete(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockUserRepository) GetPaginatedDBFLPASS(page, pageSize int, search string, status string) ([]models.SDBFLPASS, int64, error) {
	args := m.Called(page, pageSize, search, status)
	var users []models.SDBFLPASS
	if args.Get(0) != nil {
		users = args.Get(0).([]models.SDBFLPASS)
	}
	return users, int64(args.Int(1)), args.Error(2)
}

func (m *MockUserRepository) GetByUserIDDBFLPASS(userID string) (*models.SDBFLPASS, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SDBFLPASS), args.Error(1)
}

func (m *MockUserRepository) CreateDBFLPASS(user *models.SDBFLPASS) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) UpdateDBFLPASS(user *models.SDBFLPASS) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) DeleteDBFLPASS(userID string) error {
	args := m.Called(userID)
	return args.Error(0)
}

func (m *MockUserRepository) GetUserPermissions(userID string) ([]models.SUserPermission, []models.SUserPermission, []models.SUserCoaAccess, error) {
	args := m.Called(userID)
	var menu []models.SUserPermission
	var report []models.SUserPermission
	var coa []models.SUserCoaAccess
	if args.Get(0) != nil {
		menu = args.Get(0).([]models.SUserPermission)
	}
	if args.Get(1) != nil {
		report = args.Get(1).([]models.SUserPermission)
	}
	if args.Get(2) != nil {
		coa = args.Get(2).([]models.SUserCoaAccess)
	}
	return menu, report, coa, args.Error(3)
}

func (m *MockUserRepository) UpdateUserPermissions(userID string, menuPerms []models.SUserPermission, reportPerms []models.SUserPermission, coaPerms []models.SUserCoaAccess) error {
	args := m.Called(userID, menuPerms, reportPerms, coaPerms)
	return args.Error(0)
}

// GetUserMenuPermissions is the TASK-009 split-getter mock implementation.
func (m *MockUserRepository) GetUserMenuPermissions(userID string) ([]models.SUserPermission, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SUserPermission), args.Error(1)
}

// GetUserReportPermissions is the TASK-009 split-getter mock implementation.
func (m *MockUserRepository) GetUserReportPermissions(userID string) ([]models.SUserPermission, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SUserPermission), args.Error(1)
}

// GetUserCoaAccess is the TASK-009 split-getter mock implementation.
func (m *MockUserRepository) GetUserCoaAccess(userID string) ([]models.SUserCoaAccess, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SUserCoaAccess), args.Error(1)
}

// GetPermissionReportMatrix is the TASK-009 report matrix mock implementation.
func (m *MockUserRepository) GetPermissionReportMatrix(userID, menuCode, menuType string, page, pageSize int) ([]models.SPermissionReportRow, int64, error) {
	args := m.Called(userID, menuCode, menuType, page, pageSize)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]models.SPermissionReportRow), args.Get(1).(int64), args.Error(2)
}

func TestAuthService_Login(t *testing.T) {
	mockRepo := new(MockUserRepository)
	cfg := &config.SConfig{JWTSecret: "test-secret"}
	authService := NewAuthService(mockRepo, cfg)

	password := "password123"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	user := &models.SUser{
		ID:       1,
		Username: "testuser",
		Password: string(hashedPassword),
		Role:     models.RoleEmployee,
	}

	t.Run("Successful Login", func(t *testing.T) {
		mockRepo.On("GetByUsername", "testuser").Return(user, nil).Once()

		res, err := authService.Login("testuser", "password123")

		assert.NoError(t, err)
		assert.NotNil(t, res)
		assert.Equal(t, uint(1), res.SUser.ID)
		assert.NotEmpty(t, res.AccessToken)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Invalid Password", func(t *testing.T) {
		mockRepo.On("GetByUsername", "testuser").Return(user, nil).Once()

		res, err := authService.Login("testuser", "wrongpassword")

		assert.Error(t, err)
		assert.Nil(t, res)
		assert.Equal(t, "invalid username or password", err.Error())
		mockRepo.AssertExpectations(t)
	})
}

func TestAuthService_GetMe(t *testing.T) {
	mockRepo := new(MockUserRepository)
	cfg := &config.SConfig{}
	authService := NewAuthService(mockRepo, cfg)

	user := &models.SUser{
		ID:       1,
		Username: "testuser",
		Role:     models.RoleEmployee,
	}

	t.Run("Success", func(t *testing.T) {
		mockRepo.On("GetByID", uint(1)).Return(user, nil).Once()

		res, err := authService.GetMe(1)

		assert.NoError(t, err)
		assert.Equal(t, "testuser", res.Username)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuthService_ChangePassword(t *testing.T) {
	mockRepo := new(MockUserRepository)
	cfg := &config.SConfig{}
	authService := NewAuthService(mockRepo, cfg)

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("oldpassword"), bcrypt.DefaultCost)
	user := &models.SUser{
		ID:        1,
		Password:  string(hashedPassword),
		SDBFLPASS: &models.SDBFLPASS{},
	}

	t.Run("Success", func(t *testing.T) {
		mockRepo.On("GetByID", uint(1)).Return(user, nil).Once()
		mockRepo.On("Update", mock.AnythingOfType("*models.SUser")).Return(nil).Once()

		err := authService.ChangePassword(1, "oldpassword", "newpassword")

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuthService_RefreshToken(t *testing.T) {
	mockRepo := new(MockUserRepository)
	cfg := &config.SConfig{
		JWTSecret:          "test-secret",
		RefreshTokenSecret: "test-refresh-secret",
		JWTExpiration:      "15m",
		RefreshTokenExpiry: "168h",
	}
	svc := NewAuthService(mockRepo, cfg)

	user := &models.SUser{
		ID:       1,
		Username: "testuser",
		Role:     models.RoleEmployee,
	}

	t.Run("Success", func(t *testing.T) {
		// generate valid refresh token first
		_, refreshToken, _, _ := svc.(*authService).generateTokenPair(user)

		mockRepo.On("GetByID", uint(1)).Return(user, nil).Once()

		res, err := svc.RefreshToken(refreshToken)

		assert.NoError(t, err)
		assert.NotNil(t, res)
		assert.NotEmpty(t, res.AccessToken)
		assert.NotEmpty(t, res.RefreshToken)
		mockRepo.AssertExpectations(t)
	})
}
