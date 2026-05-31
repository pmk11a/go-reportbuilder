package services

import (
	"testing"

	"github.com/masza1/dapen-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockPeriodeRepository struct {
	mock.Mock
}

func (m *MockPeriodeRepository) GetPeriodeByUserID(userID string) (*models.DBPeriode, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.DBPeriode), args.Error(1)
}

func (m *MockPeriodeRepository) UpsertPeriode(periode *models.DBPeriode) error {
	args := m.Called(periode)
	return args.Error(0)
}

func TestPeriodeService_GetPeriode(t *testing.T) {
	mockRepo := new(MockPeriodeRepository)
	service := NewPeriodeService(mockRepo)

	t.Run("Success GetPeriode", func(t *testing.T) {
		periode := &models.DBPeriode{USERID: "usr01", BULAN: "01", TAHUN: "2024"}
		mockRepo.On("GetPeriodeByUserID", "usr01").Return(periode, nil).Once()

		res, err := service.GetPeriode("usr01")
		
		assert.NoError(t, err)
		assert.NotNil(t, res)
		assert.Equal(t, "01", res.BULAN)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Not Found GetPeriode", func(t *testing.T) {
		mockRepo.On("GetPeriodeByUserID", "unknown").Return(nil, nil).Once()

		res, err := service.GetPeriode("unknown")
		assert.NoError(t, err)
		assert.NotNil(t, res)
		assert.Equal(t, "unknown", res.USERID)
		mockRepo.AssertExpectations(t)
	})
}

func TestPeriodeService_SetPeriode(t *testing.T) {
	mockRepo := new(MockPeriodeRepository)
	service := NewPeriodeService(mockRepo)

	t.Run("Success SetPeriode", func(t *testing.T) {
		mockRepo.On("UpsertPeriode", mock.AnythingOfType("*models.DBPeriode")).Return(nil).Once()

		err := service.SetPeriode("usr01", "01", "2024")
		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}
