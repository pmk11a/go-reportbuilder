package activity

import (
		"gorm.io/gorm"
)

// IActivityLogRepository defines the persistence contract for the activity log
// (configuration + log rows + SQL Server metadata queries).
type IActivityLogRepository interface {
	// GetConfigs returns all activity-log configurations with their field
	// definitions eagerly loaded.
	GetConfigs() ([]SActivityLogConfig, error)
	// GetConfigByTableName looks up the configuration for a single table
	// (case-insensitive on the table_name column).
	GetConfigByTableName(tableName string) (*SActivityLogConfig, error)
	// SaveConfig upserts a config + replaces its child Fields in a transaction.
	SaveConfig(config *SActivityLogConfig) error
	// GetLogs returns a page of activity log rows ordered by date desc.
	// Optional filters: pemakai (user), startDate, endDate.
	GetLogs(limit int, offset int, pemakai string, startDate string, endDate string) ([]SDBLogFile, int64, error)
	// GetTables returns all user table names from SQL Server INFORMATION_SCHEMA.
	GetTables() ([]string, error)
	// GetTableColumns returns the column names for the given table.
	GetTableColumns(tableName string) ([]string, error)
}

type sqlServerActivityLogRepository struct {
	db *gorm.DB
}

// NewActivityLogRepository constructs the default SQL-Server-backed activity
// log repository. The implementation is GORM-based; the "sqlServer" prefix
// is informational only (queries use SQL Server INFORMATION_SCHEMA).
func NewActivityLogRepository(db *gorm.DB) IActivityLogRepository {
	return &sqlServerActivityLogRepository{db: db}
}

func (r *sqlServerActivityLogRepository) GetConfigs() ([]SActivityLogConfig, error) {
	var configs []SActivityLogConfig
	err := r.db.Preload("Fields").Find(&configs).Error
	return configs, err
}

func (r *sqlServerActivityLogRepository) GetConfigByTableName(tableName string) (*SActivityLogConfig, error) {
	var config SActivityLogConfig
	err := r.db.Preload("Fields").Where("table_name = ?", tableName).First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *sqlServerActivityLogRepository) SaveConfig(config *SActivityLogConfig) error {
	// Wrap the upsert in a transaction so the parent config + its child Fields
	// stay in sync — a partial failure would otherwise leave dangling
	// activity_log_fields rows pointing at a missing config_id.
	return r.db.Transaction(func(tx *gorm.DB) error {
		var existing SActivityLogConfig
		err := tx.Where("table_name = ?", config.TargetTable).First(&existing).Error

		if err == gorm.ErrRecordNotFound {
			return tx.Create(config).Error
		} else if err != nil {
			return err
		}

		// Replace the field list wholesale: the new payload is the source of
		// truth, so the simplest correct operation is delete-then-reinsert.
		if err := tx.Where("config_id = ?", existing.ID).Delete(&SActivityLogField{}).Error; err != nil {
			return err
		}

		config.ID = existing.ID
		for i := range config.Fields {
			config.Fields[i].ConfigID = existing.ID
		}

		return tx.Save(config).Error
	})
}

func (r *sqlServerActivityLogRepository) GetLogs(limit int, offset int, pemakai string, startDate string, endDate string) ([]SDBLogFile, int64, error) {
	var logs []SDBLogFile
	var count int64

	query := r.db.Model(&SDBLogFile{})

	if pemakai != "" {
		query = query.Where("pemakai = ?", pemakai)
	}
	if startDate != "" {
		query = query.Where("tanggal >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("tanggal <= ?", endDate)
	}

	err := query.Count(&count).Error
	if err != nil {
		return nil, 0, err
	}

	err = query.Order("tanggal desc").Limit(limit).Offset(offset).Find(&logs).Error
	return logs, count, err
}

func (r *sqlServerActivityLogRepository) GetTables() ([]string, error) {
	var tables []string
	// SQL Server specific query to get all user tables
	err := r.db.Raw("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'").Scan(&tables).Error
	return tables, err
}

func (r *sqlServerActivityLogRepository) GetTableColumns(tableName string) ([]string, error) {
	var columns []string
	// SQL Server specific query to get columns for a table
	err := r.db.Raw("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?", tableName).Scan(&columns).Error
	return columns, err
}
