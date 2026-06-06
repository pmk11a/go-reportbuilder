package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/masza1/dapen-backend/internal/features/identity/user"
	"github.com/masza1/dapen-backend/internal/infrastructure/config"
	"golang.org/x/crypto/bcrypt"
)

type IAuthService interface {
	Login(username, password string) (*SLoginResponse, error)
	RefreshToken(refreshTokenString string) (*SLoginResponse, error)
	ChangePassword(userID uint, oldPassword, newPassword string) error
	GetMe(userID uint) (*user.SUser, error)
}

type authService struct {
	repo   user.IUserRepository
	config *config.SConfig
}

func NewAuthService(repo user.IUserRepository, cfg *config.SConfig) IAuthService {
	return &authService{
		repo:   repo,
		config: cfg,
	}
}

// generateTokenPair creates a short-lived access token and a long-lived refresh token.
// Access token: contains user claims, used for API authorization (default 15m).
// Refresh token: contains only user_id, used to obtain a new token pair (default 7d).
func (s *authService) generateTokenPair(u *user.SUser) (accessToken string, refreshToken string, expiresAt int64, err error) {
	// Parse access token expiry duration
	accessExpiry, err := time.ParseDuration(s.config.JWTExpiration)
	if err != nil {
		accessExpiry = 15 * time.Minute
	}

	// Parse refresh token expiry duration
	refreshExpiry, err := time.ParseDuration(s.config.RefreshTokenExpiry)
	if err != nil {
		refreshExpiry = 7 * 24 * time.Hour
	}

	now := time.Now()
	accessExpiresAt := now.Add(accessExpiry)
	refreshExpiresAt := now.Add(refreshExpiry)

	accessClaims := jwt.MapClaims{
		"user_id":        u.ID,
		"legacy_user_id": u.UserID,
		"username":       u.Username,
		"role":           u.GetDynamicRole(),
		"type":           "access",
		"iat":            now.Unix(),
		"exp":            accessExpiresAt.Unix(),
	}
	accessTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessToken, err = accessTokenObj.SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return "", "", 0, err
	}

	// Generate Refresh Token (long-lived, contains minimal claims)
	refreshClaims := jwt.MapClaims{
		"user_id": u.ID,
		"type":    "refresh",
		"iat":     now.Unix(),
		"exp":     refreshExpiresAt.Unix(),
	}
	refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err = refreshTokenObj.SignedString([]byte(s.config.RefreshTokenSecret))
	if err != nil {
		return "", "", 0, err
	}

	// Return expiry as millisecond timestamp (for BFF session TTL)
	expiresAt = accessExpiresAt.UnixMilli()
	return accessToken, refreshToken, expiresAt, nil
}

func (s *authService) Login(username, password string) (*SLoginResponse, error) {
	u, err := s.repo.GetByUsername(username)
	if err != nil {
		return nil, errors.New("invalid username or password")
	}

	// Verify password
	// generate password hash and save to database:
	// newHasedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	// u.Password = string(newHasedPassword)
	// s.repo.Update(u)

	err = bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	if err != nil {
		return nil, errors.New("invalid username or password")
	}

	// Generate token pair
	accessToken, refreshToken, expiresAt, err := s.generateTokenPair(u)
	if err != nil {
		return nil, err
	}

	// Return login response; the user object already carries its dynamic role
	// via SUser.GetDynamicRole() so no extra field is needed here.
	return &SLoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
		SUser:        *u,
	}, nil
}

// RefreshToken validates a refresh token and issues a new token pair (Refresh Token Rotation).
// The old refresh token is implicitly invalidated because a new one is issued.
func (s *authService) RefreshToken(refreshTokenString string) (*SLoginResponse, error) {
	// Parse and validate refresh token
	token, err := jwt.Parse(refreshTokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.config.RefreshTokenSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired refresh token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// Verify token type
	tokenType, _ := claims["type"].(string)
	if tokenType != "refresh" {
		return nil, errors.New("invalid token type: expected refresh token")
	}

	// Extract user_id
	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return nil, errors.New("invalid user_id in token")
	}
	userID := uint(userIDFloat)

	// Fetch user from database (ensures user still exists and is active)
	u, err := s.repo.GetByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Generate new token pair (Refresh Token Rotation — old token is now implicitly stale)
	accessToken, refreshToken, expiresAt, err := s.generateTokenPair(u)
	if err != nil {
		return nil, err
	}

	// Return refreshed login response; user role is read from SUser.GetDynamicRole() on demand.
	return &SLoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
		SUser:        *u,
	}, nil
}

func (s *authService) ChangePassword(userID uint, oldPassword, newPassword string) error {
	u, err := s.repo.GetByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	// Verify old password
	err = bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(oldPassword))
	if err != nil {
		return errors.New("incorrect old password")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	u.Password = string(hashedPassword)
	if u.SDBFLPASS != nil {
		u.SDBFLPASS.UID2 = string(hashedPassword)
	}

	return s.repo.Update(u)
}

func (s *authService) GetMe(userID uint) (*user.SUser, error) {
	u, err := s.repo.GetByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}
	return u, nil
}
