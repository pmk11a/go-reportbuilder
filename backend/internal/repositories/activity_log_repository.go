package repositories

import (
	"github.com/masza1/dapen-backend/internal/models"
	"gorm.io/gorm"
)

type IActivityLogRepository interface {
	GetConfigs() ([]models.SActivityLogConfig, error)
	GetConfigByTableName(tableName string) (*models.SActivityLogConfig, error)
	SaveConfig(config *models.SActivityLogConfig) error
	GetLogs(limit int, offset int) ([]models.SDBLogFile, int64, error)
	GetTables() ([]string, error)
	GetTableColumns(tableName string) ([]string, error)
}

type postgresActivityLogRepository struct {
	db *gorm.DB
}

func NewActivityLogRepository(db *gorm.DB) IActivityLogRepository {
	return &postgresActivityLogRepository{db: db}
}

func (r *postgresActivityLogRepository) GetConfigs() ([]models.SActivityLogConfig, error) {
	var configs []models.SActivityLogConfig
	err := r.db.Preload("Fields").Find(&configs).Error
	return configs, err
}

func (r *postgresActivityLogRepository) GetConfigByTableName(tableName string) (*models.SActivityLogConfig, error) {
	var config models.SActivityLogConfig
	err := r.db.Preload("Fields").Where("table_name = ?", tableName).First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *postgresActivityLogRepository) SaveConfig(config *models.SActivityLogConfig) error {
	// Use transaction to ensure data integrity
	return r.db.Transaction(func(tx *gorm.DB) error {
		var existing models.SActivityLogConfig
		err := tx.Where("table_name = ?", config.TargetTable).First(&existing).Error
		
		if err == gorm.ErrRecordNotFound {
			// Create new
			return tx.Create(config).Error
		} else if err != nil {
			return err
		}

		// Delete old fields
		if err := tx.Where("config_id = ?", existing.ID).Delete(&models.SActivityLogField{}).Error; err != nil {
			return err
		}

		// Update config
		config.ID = existing.ID
		for i := range config.Fields {
			config.Fields[i].ConfigID = existing.ID
		}
		
		return tx.Save(config).Error
	})
}

func (r *postgresActivityLogRepository) GetLogs(limit int, offset int) ([]models.SDBLogFile, int64, error) {
	var logs []models.SDBLogFile
	var count int64

	err := r.db.Model(&models.SDBLogFile{}).Count(&count).Error
	if err != nil {
		return nil, 0, err
	}

	err = r.db.Order("tanggal desc").Limit(limit).Offset(offset).Find(&logs).Error
	return logs, count, err
}

func (r *postgresActivityLogRepository) GetTables() ([]string, error) {
	var tables []string
	// SQL Server specific query to get all user tables
	err := r.db.Raw("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'").Scan(&tables).Error
	return tables, err
}

func (r *postgresActivityLogRepository) GetTableColumns(tableName string) ([]string, error) {
	var columns []string
	// SQL Server specific query to get columns for a table
	err := r.db.Raw("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?", tableName).Scan(&columns).Error
	return columns, err
}
