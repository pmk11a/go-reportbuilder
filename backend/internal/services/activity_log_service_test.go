package services

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"

	"github.com/masza1/dapen-backend/internal/db"
	"github.com/masza1/dapen-backend/internal/dto"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockActivityLogRepository struct {
	mock.Mock
}

func (m *MockActivityLogRepository) GetConfigs() ([]models.SActivityLogConfig, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.SActivityLogConfig), args.Error(1)
}

func (m *MockActivityLogRepository) GetConfigByTableName(tableName string) (*models.SActivityLogConfig, error) {
	args := m.Called(tableName)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SActivityLogConfig), args.Error(1)
}

func (m *MockActivityLogRepository) SaveConfig(config *models.SActivityLogConfig) error {
	args := m.Called(config)
	return args.Error(0)
}

func (m *MockActivityLogRepository) GetTables() ([]string, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]string), args.Error(1)
}

func (m *MockActivityLogRepository) GetTableColumns(tableName string) ([]string, error) {
	args := m.Called(tableName)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]string), args.Error(1)
}

func (m *MockActivityLogRepository) GetLogs(limit, offset int) ([]models.SDBLogFile, int64, error) {
	args := m.Called(limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]models.SDBLogFile), args.Get(1).(int64), args.Error(2)
}

func TestActivityLogService_GetLogs(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	t.Run("Success GetLogs", func(t *testing.T) {
		logs := []models.SDBLogFile{{Aktivitas: "LOGIN"}}
		mockRepo.On("GetLogs", 10, 0).Return(logs, int64(1), nil).Once()

		res, total, err := service.GetLogs(10, 0)
		
		assert.NoError(t, err)
		assert.Len(t, res, 1)
		assert.Equal(t, int64(1), total)
		assert.Equal(t, "LOGIN", res[0].Aktivitas)
		mockRepo.AssertExpectations(t)
	})
}

func TestActivityLogService_GetConfigs(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		configs := []models.SActivityLogConfig{{ID: 1, TargetTable: "users", Fields: []models.SActivityLogField{{FieldName: "username"}}}}
		mockRepo.On("GetConfigs").Return(configs, nil).Once()

		res, err := service.GetConfigs()
		assert.NoError(t, err)
		assert.Len(t, res, 1)
		assert.Equal(t, "users", res[0].TableName)
		assert.Len(t, res[0].Fields, 1)
		mockRepo.AssertExpectations(t)
	})
}

func TestActivityLogService_GetConfigByTableName(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		config := &models.SActivityLogConfig{ID: 1, TargetTable: "users"}
		mockRepo.On("GetConfigByTableName", "users").Return(config, nil).Once()

		res, err := service.GetConfigByTableName("users")
		assert.NoError(t, err)
		assert.Equal(t, "users", res.TableName)
		mockRepo.AssertExpectations(t)
	})
}

func TestActivityLogService_SaveConfig(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		mockDB, sqlMock, _ := sqlmock.New()
		db.DB, _ = gorm.Open(sqlserver.New(sqlserver.Config{
			Conn: mockDB,
		}), &gorm.Config{})
		defer func() { db.DB = nil }()

		sqlMock.ExpectQuery(`(?i)SELECT.*activity_log_config`).WillReturnRows(sqlmock.NewRows([]string{"id"}))

		req := &dto.SActivityLogConfigReq{TableName: "users", Fields: []dto.SActivityLogFieldReq{{FieldName: "username"}}}
		mockRepo.On("SaveConfig", mock.AnythingOfType("*models.SActivityLogConfig")).Return(nil).Once()

		err := service.SaveConfig(req)
		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestActivityLogService_GetTables(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		mockRepo.On("GetTables").Return([]string{"users"}, nil).Once()

		res, err := service.GetTables()
		assert.NoError(t, err)
		assert.Len(t, res, 1)
		mockRepo.AssertExpectations(t)
	})
}

func TestActivityLogService_GetTableColumns(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	t.Run("Success", func(t *testing.T) {
		mockRepo.On("GetTableColumns", "users").Return([]string{"id", "username"}, nil).Once()

		res, err := service.GetTableColumns("users")
		assert.NoError(t, err)
		assert.Len(t, res, 2)
		mockRepo.AssertExpectations(t)
	})
}
