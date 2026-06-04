package activity

import (
	"github.com/masza1/dapen-backend/internal/shared/database"
	"github.com/masza1/dapen-backend/internal/dto"
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/masza1/dapen-backend/internal/repositories"
)

type IActivityLogService interface {
	GetConfigs() ([]dto.SActivityLogConfigRes, error)
	GetConfigByTableName(tableName string) (*dto.SActivityLogConfigRes, error)
	SaveConfig(req *dto.SActivityLogConfigReq) error
	GetLogs(limit int, offset int) ([]dto.SActivityLogRes, int64, error)
	GetTables() ([]string, error)
	GetTableColumns(tableName string) ([]string, error)
}

type activityLogService struct {
	repo repositories.IActivityLogRepository
}

func NewActivityLogService(repo repositories.IActivityLogRepository) IActivityLogService {
	return &activityLogService{repo: repo}
}

func (s *activityLogService) GetConfigs() ([]dto.SActivityLogConfigRes, error) {
	configs, err := s.repo.GetConfigs()
	if err != nil {
		return nil, err
	}

	var res []dto.SActivityLogConfigRes
	for _, c := range configs {
		res = append(res, mapConfigToRes(c))
	}
	return res, nil
}

func (s *activityLogService) GetConfigByTableName(tableName string) (*dto.SActivityLogConfigRes, error) {
	config, err := s.repo.GetConfigByTableName(tableName)
	if err != nil {
		return nil, err
	}
	res := mapConfigToRes(*config)
	return &res, nil
}

func (s *activityLogService) SaveConfig(req *dto.SActivityLogConfigReq) error {
	config := models.SActivityLogConfig{
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
		config.Fields = append(config.Fields, models.SActivityLogField{
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

	// Reload GORM plugin cache
	_ = database.ReloadActivityLogConfig(database.DB)
	
	return nil
}

func (s *activityLogService) GetLogs(limit int, offset int) ([]dto.SActivityLogRes, int64, error) {
	logs, count, err := s.repo.GetLogs(limit, offset)
	if err != nil {
		return nil, 0, err
	}

	var res []dto.SActivityLogRes
	for _, l := range logs {
		res = append(res, dto.SActivityLogRes{
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

func mapConfigToRes(c models.SActivityLogConfig) dto.SActivityLogConfigRes {
	res := dto.SActivityLogConfigRes{
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
		res.Fields = append(res.Fields, dto.SActivityLogFieldRes{
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
