package services

import (
	"testing"

	"github.com/masza1/dapen-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockMenuRepository struct {
	mock.Mock
}

func (m *MockMenuRepository) FindPaginated(page, limit int, search string) ([]models.SDbMenu, int64, error) {
	args := m.Called(page, limit, search)
	return args.Get(0).([]models.SDbMenu), args.Get(1).(int64), args.Error(2)
}

func (m *MockMenuRepository) FindParentsByLevel(level int) ([]models.SDbMenu, error) {
	args := m.Called(level)
	return args.Get(0).([]models.SDbMenu), args.Error(1)
}

func (m *MockMenuRepository) FindByID(kodeMenu string) (*models.SDbMenu, error) {
	args := m.Called(kodeMenu)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SDbMenu), args.Error(1)
}

func (m *MockMenuRepository) Create(menu *models.SDbMenu) error {
	args := m.Called(menu)
	return args.Error(0)
}

func (m *MockMenuRepository) Update(menu *models.SDbMenu) error {
	args := m.Called(menu)
	return args.Error(0)
}

func (m *MockMenuRepository) Delete(kodeMenu string) error {
	args := m.Called(kodeMenu)
	return args.Error(0)
}

func TestMenuService_GetParentMenus(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	service := NewMenuService(mockRepo)

	t.Run("Success GetParentMenus", func(t *testing.T) {
		menus := []models.SDbMenu{{KODEMENU: "01", Keterangan: "Dashboard"}}
		mockRepo.On("FindParentsByLevel", 0).Return(menus, nil).Once()

		res, err := service.GetParentMenus(1)
		
		assert.NoError(t, err)
		assert.Len(t, res, 1)
		assert.Equal(t, "Dashboard", res[0].Keterangan)
		mockRepo.AssertExpectations(t)
	})
}

func TestMenuService_GetPaginatedMenus(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	service := NewMenuService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		menus := []models.SDbMenu{{KODEMENU: "01", Keterangan: "Dashboard"}}
		mockRepo.On("FindPaginated", 1, 10, "").Return(menus, int64(1), nil).Once()

		res, err := service.GetPaginatedMenus(1, 10, "")
		
		assert.NoError(t, err)
		assert.Equal(t, int64(1), res.Pagination.Total)
		assert.Len(t, res.Data, 1)
		mockRepo.AssertExpectations(t)
	})
}

func TestMenuService_CRUD(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	service := NewMenuService(mockRepo)
	menu := &models.SDbMenu{KODEMENU: "01", Keterangan: "Dashboard"}

	t.Run("Create Success", func(t *testing.T) {
		mockRepo.On("FindByID", "01").Return(nil, nil).Once() // not exists
		mockRepo.On("Create", menu).Return(nil).Once()

		err := service.CreateMenu(menu)
		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Update Success", func(t *testing.T) {
		mockRepo.On("FindByID", "01").Return(menu, nil).Once()
		mockRepo.On("Update", mock.AnythingOfType("*models.SDbMenu")).Return(nil).Once()

		err := service.UpdateMenu("01", menu)
		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Delete Success", func(t *testing.T) {
		mockRepo.On("FindByID", "01").Return(menu, nil).Once()
		mockRepo.On("Delete", "01").Return(nil).Once()

		err := service.DeleteMenu("01")
		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestMenuService_GetMenuByID(t *testing.T) {
	mockRepo := new(MockMenuRepository)
	service := NewMenuService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		menu := &models.SDbMenu{KODEMENU: "01"}
		mockRepo.On("FindByID", "01").Return(menu, nil).Once()

		res, err := service.GetMenuByID("01")
		assert.NoError(t, err)
		assert.Equal(t, "01", res.KODEMENU)
		mockRepo.AssertExpectations(t)
	})
}
