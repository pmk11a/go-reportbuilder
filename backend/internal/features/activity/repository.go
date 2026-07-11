package activity

import (		"github.com/masza1/dapen-backend/internal/shared/pagination"
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
	// .Find() without .Limit() is fine on SQL Server 2008 — the OFFSET/FETCH path
	// is only triggered by .Limit()/First()/Preload(). Use ORDER BY for stable
	// paging downstream (the handler may page this list).
	if err := r.db.Order("id ASC").Find(&configs).Error; err != nil {
		return nil, err
	}
	// Manually fetch the Fields relation per config (replaces .Preload("Fields")
	// which triggers OFFSET/FETCH in the SQL Server 2008 path).
	for i := range configs {
		var fields []SActivityLogField
		if err := r.db.Where("config_id = ?", configs[i].ID).Find(&fields).Error; err != nil {
			return nil, err
		}
		configs[i].Fields = fields
	}
	return configs, nil
}

func (r *sqlServerActivityLogRepository) GetConfigByTableName(tableName string) (*SActivityLogConfig, error) {
	var config SActivityLogConfig
	err := pagination.First2008(r.db, &config, "id", func(q *gorm.DB) *gorm.DB {
		return q.Where("table_name = ?", tableName)
	})
	if err != nil {
		return nil, err
	}
	// Manually fetch the Fields relation (replaces .Preload("Fields") which
	// triggers OFFSET/FETCH on SQL Server 2008).
	var fields []SActivityLogField
	if err := r.db.Where("config_id = ?", config.ID).Find(&fields).Error; err != nil {
		return nil, err
	}
	config.Fields = fields
	return &config, nil
}

func (r *sqlServerActivityLogRepository) SaveConfig(config *SActivityLogConfig) error {
	// Wrap the upsert in a transaction so the parent config + its child Fields
	// stay in sync — a partial failure would otherwise leave dangling
	// activity_log_fields rows pointing at a missing config_id.
	return r.db.Transaction(func(tx *gorm.DB) error {
		var existing SActivityLogConfig
		err := pagination.First2008(tx, &existing, "id", func(q *gorm.DB) *gorm.DB {
			return q.Where("table_name = ?", config.TargetTable)
		})

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

	// SQL Server 2008-compatible path: build baseSQL + args, then delegate to
	// pagination.PaginatedFind which wraps a ROW_NUMBER() CTE and avoids
	// OFFSET ... FETCH NEXT (SQL Server 2012+).
	baseSQL := "SELECT * FROM dblogfile"
	var (
		whereSQL string
		args     []any
	)
	if pemakai != "" {
		whereSQL += " AND pemakai = ?"
		args = append(args, pemakai)
	}
	if startDate != "" {
		whereSQL += " AND tanggal >= ?"
		args = append(args, startDate)
	}
	if endDate != "" {
		whereSQL += " AND tanggal <= ?"
		args = append(args, endDate)
	}
	if whereSQL != "" {
		// Strip leading " AND "
		baseSQL += " WHERE " + whereSQL[5:]
	}

	// Preserve the legacy (offset, limit) semantics: derive 1-based page
	// number so callers that previously used offset/limit continue to work.
	page := 1
	if limit > 0 && offset > 0 {
		page = (offset / limit) + 1
	}

	total, err := pagination.PaginatedFind(r.db, &logs, baseSQL, "[Tanggal] DESC", page, limit, args...)
	return logs, total, err
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
