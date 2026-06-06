package auth

import (
	"os"
	"testing"

	"github.com/masza1/dapen-backend/internal/features/identity/user"
	"github.com/masza1/dapen-backend/internal/infrastructure/config"
	"github.com/masza1/dapen-backend/tests/testhelper"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var testDB *gorm.DB

func TestMain(m *testing.M) {
	testDB = testhelper.InitTestDB(nil)
	code := m.Run()
	os.Exit(code)
}

// TestAuthService_LoginSuccess tests successful login with valid credentials.
func TestAuthService_LoginSuccess(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test user with bcrypt-hashed password
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		testUser := &user.SUser{
			Username: "testuser",
			Password: string(hashedPassword),
			Name:     "Test User",
			Email:    "test@example.com",
			Role:     user.RoleEmployee,
		}
		assert.NoError(t, tx.Create(testUser).Error)

		// Create a minimal config
		cfg := &config.SConfig{
			JWTSecret:           "test-secret",
			JWTExpiration:       "15m",
			RefreshTokenSecret:  "test-refresh-secret",
			RefreshTokenExpiry:  "168h",
		}

		// Create service with real repository
		userRepo := user.NewUserRepository(tx)
		authSvc := NewAuthService(userRepo, cfg)

		// Act: Login with correct credentials
		response, err := authSvc.Login("testuser", "password123")

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.NotEmpty(t, response.AccessToken)
		assert.NotEmpty(t, response.RefreshToken)
		assert.NotZero(t, response.ExpiresAt)
		assert.Equal(t, "testuser", response.SUser.Username)
		assert.Equal(t, "Test User", response.SUser.Name)
	})
}

// TestAuthService_LoginInvalidPassword tests login with incorrect password.
func TestAuthService_LoginInvalidPassword(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test user
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		testUser := &user.SUser{
			Username: "testuser",
			Password: string(hashedPassword),
			Name:     "Test User",
			Email:    "test@example.com",
		}
		assert.NoError(t, tx.Create(testUser).Error)

		cfg := &config.SConfig{
			JWTSecret:           "test-secret",
			JWTExpiration:       "15m",
			RefreshTokenSecret:  "test-refresh-secret",
			RefreshTokenExpiry:  "168h",
		}

		userRepo := user.NewUserRepository(tx)
		authSvc := NewAuthService(userRepo, cfg)

		// Act: Login with wrong password
		response, err := authSvc.Login("testuser", "wrongpassword")

		// Assert: Should fail with "invalid username or password" error
		assert.Error(t, err)
		assert.Nil(t, response)
		assert.Equal(t, "invalid username or password", err.Error())
	})
}

// TestAuthService_LoginUserNotFound tests login with non-existent username.
func TestAuthService_LoginUserNotFound(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		cfg := &config.SConfig{
			JWTSecret:           "test-secret",
			JWTExpiration:       "15m",
			RefreshTokenSecret:  "test-refresh-secret",
			RefreshTokenExpiry:  "168h",
		}

		userRepo := user.NewUserRepository(tx)
		authSvc := NewAuthService(userRepo, cfg)

		// Act: Login with non-existent user
		response, err := authSvc.Login("nonexistent", "password")

		// Assert
		assert.Error(t, err)
		assert.Nil(t, response)
		assert.Equal(t, "invalid username or password", err.Error())
	})
}

// TestAuthService_GetMe tests retrieving the current user profile.
func TestAuthService_GetMe(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test user
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		testUser := &user.SUser{
			Username: "getmetest",
			Password: string(hashedPassword),
			Name:     "Get Me Test",
			Email:    "getme@example.com",
			Role:     user.RoleEmployee,
		}
		assert.NoError(t, tx.Create(testUser).Error)

		cfg := &config.SConfig{
			JWTSecret:           "test-secret",
			JWTExpiration:       "15m",
			RefreshTokenSecret:  "test-refresh-secret",
			RefreshTokenExpiry:  "168h",
		}

		userRepo := user.NewUserRepository(tx)
		authSvc := NewAuthService(userRepo, cfg)

		// Act: Get user by ID
		retrievedUser, err := authSvc.GetMe(testUser.ID)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, retrievedUser)
		assert.Equal(t, testUser.ID, retrievedUser.ID)
		assert.Equal(t, "getmetest", retrievedUser.Username)
		assert.Equal(t, "Get Me Test", retrievedUser.Name)
	})
}

// TestAuthService_ChangePassword tests changing user password.
func TestAuthService_ChangePassword(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test user with initial password
		oldPassword := "oldpassword123"
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(oldPassword), bcrypt.DefaultCost)
		testUser := &user.SUser{
			Username: "changepasstest",
			Password: string(hashedPassword),
			Name:     "Change Pass Test",
			Email:    "changepass@example.com",
		}
		assert.NoError(t, tx.Create(testUser).Error)

		cfg := &config.SConfig{
			JWTSecret:           "test-secret",
			JWTExpiration:       "15m",
			RefreshTokenSecret:  "test-refresh-secret",
			RefreshTokenExpiry:  "168h",
		}

		userRepo := user.NewUserRepository(tx)
		authSvc := NewAuthService(userRepo, cfg)

		// Act: Change password
		newPassword := "newpassword123"
		err := authSvc.ChangePassword(testUser.ID, oldPassword, newPassword)

		// Assert: Password change should succeed
		assert.NoError(t, err)

		// Verify that the password was actually changed
		updatedUser, err := userRepo.GetByID(testUser.ID)
		assert.NoError(t, err)
		assert.NotEqual(t, string(hashedPassword), updatedUser.Password)

		// Verify that old password no longer works
		err = bcrypt.CompareHashAndPassword([]byte(updatedUser.Password), []byte(oldPassword))
		assert.Error(t, err)

		// Verify that new password works
		err = bcrypt.CompareHashAndPassword([]byte(updatedUser.Password), []byte(newPassword))
		assert.NoError(t, err)
	})
}

// TestAuthService_ChangePasswordWrongOldPassword tests changing password with incorrect old password.
func TestAuthService_ChangePasswordWrongOldPassword(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("correctpassword"), bcrypt.DefaultCost)
		testUser := &user.SUser{
			Username: "wrongoldpass",
			Password: string(hashedPassword),
			Name:     "Wrong Old Pass",
			Email:    "wrongoldpass@example.com",
		}
		assert.NoError(t, tx.Create(testUser).Error)

		cfg := &config.SConfig{
			JWTSecret:           "test-secret",
			JWTExpiration:       "15m",
			RefreshTokenSecret:  "test-refresh-secret",
			RefreshTokenExpiry:  "168h",
		}

		userRepo := user.NewUserRepository(tx)
		authSvc := NewAuthService(userRepo, cfg)

		// Act: Try to change password with wrong old password
		err := authSvc.ChangePassword(testUser.ID, "wrongpassword", "newpassword")

		// Assert: Should fail
		assert.Error(t, err)
	})
}

// TestAuthService_RefreshToken tests token refresh functionality (Refresh Token Rotation).
func TestAuthService_RefreshToken(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		// Arrange: Create a test user and generate initial token pair
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		testUser := &user.SUser{
			Username: "refreshtest",
			Password: string(hashedPassword),
			Name:     "Refresh Test",
			Email:    "refresh@example.com",
		}
		assert.NoError(t, tx.Create(testUser).Error)

		cfg := &config.SConfig{
			JWTSecret:           "test-secret",
			JWTExpiration:       "15m",
			RefreshTokenSecret:  "test-refresh-secret",
			RefreshTokenExpiry:  "168h",
		}

		userRepo := user.NewUserRepository(tx)
		authSvc := NewAuthService(userRepo, cfg)

		// Get initial login response to obtain refresh token
		loginResponse, err := authSvc.Login("refreshtest", "password123")
		assert.NoError(t, err)
		assert.NotNil(t, loginResponse)
		oldRefreshToken := loginResponse.RefreshToken
		oldAccessToken := loginResponse.AccessToken

		// Act: Refresh the token pair
		newResponse, err := authSvc.RefreshToken(oldRefreshToken)

		// Assert: Should get new tokens
		assert.NoError(t, err)
		assert.NotNil(t, newResponse)
		assert.NotEmpty(t, newResponse.AccessToken)
		assert.NotEmpty(t, newResponse.RefreshToken)
		// New tokens should be different from old ones (Refresh Token Rotation)
		assert.NotEqual(t, oldAccessToken, newResponse.AccessToken)
		assert.NotEqual(t, oldRefreshToken, newResponse.RefreshToken)
		// User data should remain the same
		assert.Equal(t, testUser.ID, newResponse.SUser.ID)
		assert.Equal(t, "refreshtest", newResponse.SUser.Username)
	})
}

// TestAuthService_RefreshTokenInvalid tests refresh with invalid token.
func TestAuthService_RefreshTokenInvalid(t *testing.T) {
	testhelper.WithTestTx(t, testDB, func(tx *gorm.DB) {
		cfg := &config.SConfig{
			JWTSecret:           "test-secret",
			JWTExpiration:       "15m",
			RefreshTokenSecret:  "test-refresh-secret",
			RefreshTokenExpiry:  "168h",
		}

		userRepo := user.NewUserRepository(tx)
		authSvc := NewAuthService(userRepo, cfg)

		// Act: Try to refresh with invalid token
		response, err := authSvc.RefreshToken("invalid.token.here")

		// Assert: Should fail
		assert.Error(t, err)
		assert.Nil(t, response)
	})
}
