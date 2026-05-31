package services

import (
	"testing"

	"github.com/masza1/dapen-backend/internal/config"
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
		ID:       1,
		Password: string(hashedPassword),
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
