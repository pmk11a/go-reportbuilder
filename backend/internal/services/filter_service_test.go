package services

import (
	"testing"

	"github.com/masza1/dapen-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockFilterRepository struct {
	mock.Mock
}

func (m *MockFilterRepository) GetCustomers(jenis int, search string, offset int, limit int) ([]models.SDbCustSupp, int64, error) {
	args := m.Called(jenis, search, offset, limit)
	return args.Get(0).([]models.SDbCustSupp), args.Get(1).(int64), args.Error(2)
}

func (m *MockFilterRepository) GetPerkiraan(search string, without string, postHutPiut string) ([]models.SDbPerkiraan, error) {
	args := m.Called(search, without, postHutPiut)
	return args.Get(0).([]models.SDbPerkiraan), args.Error(1)
}

func (m *MockFilterRepository) GetKelompokKas(tipe string, search string) ([]models.SDbPerkiraan, error) {
	args := m.Called(tipe, search)
	return args.Get(0).([]models.SDbPerkiraan), args.Error(1)
}

func TestFilterService_GetCustomers(t *testing.T) {
	mockRepo := new(MockFilterRepository)
	service := NewFilterService(mockRepo)

	t.Run("Success GetCustomers", func(t *testing.T) {
		cust := []models.SDbCustSupp{{KodeCustSupp: "1", NamaCustSupp: "Test"}}
		mockRepo.On("GetCustomers", 1, "", 0, 10).Return(cust, int64(1), nil).Once()

		res, total, err := service.GetCustomers(1, "", 1, 10)
		
		assert.NoError(t, err)
		assert.Len(t, res, 1)
		assert.Equal(t, int64(1), total)
		assert.Equal(t, "1", res[0].KodeCustSupp)
		mockRepo.AssertExpectations(t)
	})
}

func TestFilterService_GetPerkiraan(t *testing.T) {
	mockRepo := new(MockFilterRepository)
	service := NewFilterService(mockRepo)

	t.Run("Success GetPerkiraan", func(t *testing.T) {
		perkiraan := []models.SDbPerkiraan{{Perkiraan: "1000", Keterangan: "Kas"}}
		mockRepo.On("GetPerkiraan", "Kas", "", "").Return(perkiraan, nil).Once()

		res, err := service.GetPerkiraan("Kas", "", "")
		assert.NoError(t, err)
		assert.Len(t, res, 1)
		mockRepo.AssertExpectations(t)
	})
}

func TestFilterService_GetKelompokKas(t *testing.T) {
	mockRepo := new(MockFilterRepository)
	service := NewFilterService(mockRepo)

	t.Run("Success GetKelompokKas", func(t *testing.T) {
		perkiraan := []models.SDbPerkiraan{{Perkiraan: "1000", Keterangan: "Kas"}}
		mockRepo.On("GetKelompokKas", "Tipe1", "Kas").Return(perkiraan, nil).Once()

		res, err := service.GetKelompokKas("Tipe1", "Kas")
		assert.NoError(t, err)
		assert.Len(t, res, 1)
		mockRepo.AssertExpectations(t)
	})
}
