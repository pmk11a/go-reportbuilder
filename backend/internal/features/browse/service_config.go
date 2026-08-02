package browse

import (
	"context"
	"fmt"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
)

// ListConfigs retrieves a paginated list of browse configurations
func (r *SConfigResolver) ListConfigs(ctx context.Context, page, limit int, search string) ([]models.SDbBrowseConfig, int64, error) {
	var configs []models.SDbBrowseConfig
	var total int64

	q := r.db.WithContext(ctx).Model(&models.SDbBrowseConfig{})
	if search != "" {
		searchLike := "%" + search + "%"
		q = q.Where("kodebrowse LIKE ? OR tablename LIKE ?", searchLike, searchLike)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := q.Order("id DESC").Offset(offset).Limit(limit).Find(&configs).Error; err != nil {
		return nil, 0, err
	}

	return configs, total, nil
}

// CreateConfig creates a new browse configuration
func (r *SConfigResolver) CreateConfig(ctx context.Context, config *models.SDbBrowseConfig) error {
	var count int64
	r.db.WithContext(ctx).Model(&models.SDbBrowseConfig{}).Where("kodebrowse = ?", config.KodeBrowse).Count(&count)
	if count > 0 {
		return fmt.Errorf("kodebrowse %s already exists", config.KodeBrowse)
	}

	return r.db.WithContext(ctx).Create(config).Error
}

// UpdateConfig updates an existing browse configuration
func (r *SConfigResolver) UpdateConfig(ctx context.Context, id uint, config *models.SDbBrowseConfig) error {
	var existing models.SDbBrowseConfig
	if err := r.db.WithContext(ctx).First(&existing, id).Error; err != nil {
		return err
	}

	// Make sure kodebrowse remains unique if changed
	if existing.KodeBrowse != config.KodeBrowse {
		var count int64
		r.db.WithContext(ctx).Model(&models.SDbBrowseConfig{}).Where("kodebrowse = ? AND id != ?", config.KodeBrowse, id).Count(&count)
		if count > 0 {
			return fmt.Errorf("kodebrowse %s already exists", config.KodeBrowse)
		}
	}

	// Fields to update
	updates := map[string]interface{}{
		"kodebrowse":       config.KodeBrowse,
		"tablename":        config.TargetTable,
		"keyfield":         config.KeyField,
		"labelfield":       config.LabelField,
		"query":            config.Query,
		"additionalfields": config.AdditionalFields,
		"joins":            config.Joins,
		"whereextra":       config.WhereExtra,
		"aliasfields":      config.AliasFields,
		"parentfilters":    config.ParentFilters,
		"params":           config.Params,
		"is_active":        config.IsActive,
	}

	return r.db.WithContext(ctx).Model(&existing).Updates(updates).Error
}

// DeleteConfig soft-deletes a browse configuration
func (r *SConfigResolver) DeleteConfig(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.SDbBrowseConfig{}, id).Error
}
