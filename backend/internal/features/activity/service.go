package activity

import (
	"github.com/masza1/dapen-backend/internal/infrastructure/database"
)

// IActivityLogService is the business-logic entry point for the activity log
// domain. Handlers depend on this interface; tests can swap a mock.
type IActivityLogService interface {
	// GetConfigs lists all configurations, mapped to the response DTO shape.
	GetConfigs() ([]SActivityLogConfigRes, error)
	// GetConfigByTableName looks up a single config (DTO shape).
	GetConfigByTableName(tableName string) (*SActivityLogConfigRes, error)
	// SaveConfig persists a new or updated configuration and reloads the
	// in-process GORM plugin cache.
	SaveConfig(req *SActivityLogConfigReq) error
	// GetLogs returns a paginated slice of log rows + the total count.
	GetLogs(limit int, offset int) ([]SActivityLogRes, int64, error)
	// GetTables returns all user table names (UI helper for the config form).
	GetTables() ([]string, error)
	// GetTableColumns returns the column names for a given table.
	GetTableColumns(tableName string) ([]string, error)
}

type activityLogService struct {
	repo IActivityLogRepository
}

// NewActivityLogService constructs the default activity-log service.
func NewActivityLogService(repo IActivityLogRepository) IActivityLogService {
	return &activityLogService{repo: repo}
}

func (s *activityLogService) GetConfigs() ([]SActivityLogConfigRes, error) {
	configs, err := s.repo.GetConfigs()
	if err != nil {
		return nil, err
	}

	var res []SActivityLogConfigRes
	for _, c := range configs {
		res = append(res, mapConfigToRes(c))
	}
	return res, nil
}

func (s *activityLogService) GetConfigByTableName(tableName string) (*SActivityLogConfigRes, error) {
	config, err := s.repo.GetConfigByTableName(tableName)
	if err != nil {
		return nil, err
	}
	res := mapConfigToRes(*config)
	return &res, nil
}

func (s *activityLogService) SaveConfig(req *SActivityLogConfigReq) error {
	config := SActivityLogConfig{
		TargetTable:     req.TableName,
		DisplayName:     req.DisplayName,
		SourceName:      req.SourceName,
		PrimaryKeyField: req.PrimaryKeyField,
		IsEnabled:       req.IsEnabled,
		LogCreate:       req.LogCreate,
		LogUpdate:       req.LogUpdate,
		LogDelete:       req.LogDelete,
	}

	for _, f := range req.Fields {
		config.Fields = append(config.Fields, SActivityLogField{
			FieldName:   f.FieldName,
			DisplayName: f.DisplayName,
			IsTracked:   f.IsTracked,
			IsSensitive: f.IsSensitive,
			FieldType:   f.FieldType,
			SortOrder:   f.SortOrder,
		})
	}

	err := s.repo.SaveConfig(&config)
	if err != nil {
		return err
	}

	// Reload GORM plugin cache so the in-process tracker picks up the new config.
	// We intentionally ignore the error here: a cache reload failure should not fail
	// a successful config write — the next request will re-trigger the load.
	_ = ReloadActivityLogConfig(database.DB)

	return nil
}

func (s *activityLogService) GetLogs(limit int, offset int) ([]SActivityLogRes, int64, error) {
	logs, count, err := s.repo.GetLogs(limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var res []SActivityLogRes
	for _, l := range logs {
		res = append(res, SActivityLogRes{
			ID:         l.ID,
			Tahun:      int(l.Tahun),
			Bulan:      int(l.Bulan),
			Tanggal:    l.Tanggal,
			Pemakai:    l.Pemakai,
			Aktivitas:  l.Aktivitas,
			Sumber:     l.Sumber,
			NoBukti:    l.NoBukti,
			Keterangan: l.Keterangan,
		})
	}
	return res, count, nil
}

func (s *activityLogService) GetTables() ([]string, error) {
	return s.repo.GetTables()
}

func (s *activityLogService) GetTableColumns(tableName string) ([]string, error) {
	return s.repo.GetTableColumns(tableName)
}

func mapConfigToRes(c SActivityLogConfig) SActivityLogConfigRes {
	res := SActivityLogConfigRes{
		ID:              c.ID,
		TableName:       c.TargetTable,
		DisplayName:     c.DisplayName,
		SourceName:      c.SourceName,
		PrimaryKeyField: c.PrimaryKeyField,
		IsEnabled:       c.IsEnabled,
		LogCreate:       c.LogCreate,
		LogUpdate:       c.LogUpdate,
		LogDelete:       c.LogDelete,
	}
	for _, f := range c.Fields {
		res.Fields = append(res.Fields, SActivityLogFieldRes{
			ID:          f.ID,
			FieldName:   f.FieldName,
			DisplayName: f.DisplayName,
			IsTracked:   f.IsTracked,
			IsSensitive: f.IsSensitive,
			FieldType:   f.FieldType,
			SortOrder:   f.SortOrder,
		})
	}
	return res
}
