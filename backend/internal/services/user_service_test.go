package services

import (
	"errors"
	"testing"

	"github.com/masza1/dapen-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestUserService_GetUserMenuPermissions asserts the service passes the userID
// through to the repository and returns its result unchanged.
func TestUserService_GetUserMenuPermissions(t *testing.T) {
	mockRepo := new(MockUserRepository)
	svc := NewUserService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		expected := []models.SUserPermission{{KodeMenu: "M01", HasAccess: 1}}
		mockRepo.On("GetUserMenuPermissions", "ADMIN").Return(expected, nil).Once()

		got, err := svc.GetUserMenuPermissions("ADMIN")
		assert.NoError(t, err)
		assert.Equal(t, expected, got)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Repo error surfaces", func(t *testing.T) {
		mockRepo.On("GetUserMenuPermissions", "MISSING").Return([]models.SUserPermission(nil), errors.New("db down")).Once()
		_, err := svc.GetUserMenuPermissions("MISSING")
		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserService_GetUserReportPermissions(t *testing.T) {
	mockRepo := new(MockUserRepository)
	svc := NewUserService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		expected := []models.SUserPermission{{KodeMenu: "R01", IsPrint: 1}}
		mockRepo.On("GetUserReportPermissions", "ADMIN").Return(expected, nil).Once()

		got, err := svc.GetUserReportPermissions("ADMIN")
		assert.NoError(t, err)
		assert.Equal(t, expected, got)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserService_GetUserCoaAccess(t *testing.T) {
	mockRepo := new(MockUserRepository)
	svc := NewUserService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		expected := []models.SUserCoaAccess{{Perkiraan: "1101", Checked: 1}}
		mockRepo.On("GetUserCoaAccess", "ADMIN").Return(expected, nil).Once()

		got, err := svc.GetUserCoaAccess("ADMIN")
		assert.NoError(t, err)
		assert.Equal(t, expected, got)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserService_GetPermissionReportMatrix(t *testing.T) {
	mockRepo := new(MockUserRepository)
	svc := NewUserService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		rows := []models.SPermissionReportRow{{UserID: "ADMIN", MenuCode: "M01", HasAccess: 1}}
		mockRepo.On("GetPermissionReportMatrix", "ADMIN", "M01", "menu", 1, 10).
			Return(rows, int64(1), nil).Once()

		got, total, err := svc.GetPermissionReportMatrix("ADMIN", "M01", "menu", 1, 10)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Equal(t, rows, got)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Propagates args (and uses mock.Anything when uncertain)", func(t *testing.T) {
		// This just guards the variadic passing
		mockRepo.On("GetPermissionReportMatrix", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
			Return([]models.SPermissionReportRow{}, int64(0), nil).Once()
		_, _, err := svc.GetPermissionReportMatrix("", "", "menu", 0, 0)
		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}
