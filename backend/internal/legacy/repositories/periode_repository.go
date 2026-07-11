package repositories

import (
	"errors"

	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/internal/shared/pagination"
	"gorm.io/gorm"
)

type IPeriodeRepository interface {
	GetPeriodeByUserID(userID string) (*models.DBPeriode, error)
	UpsertPeriode(periode *models.DBPeriode) error
}

type SPeriodeRepository struct {
	db *gorm.DB
}

func NewPeriodeRepository(db *gorm.DB) IPeriodeRepository {
	return &SPeriodeRepository{db: db}
}

func (r *SPeriodeRepository) GetPeriodeByUserID(userID string) (*models.DBPeriode, error) {
	var periode models.DBPeriode
	err := pagination.First2008(r.db, &periode, "[USERID]", func(q *gorm.DB) *gorm.DB {
		return q.Where("USERID = ?", userID)
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil if not found, it's not a fatal error
		}
		return nil, err
	}
	return &periode, nil
}

func (r *SPeriodeRepository) UpsertPeriode(periode *models.DBPeriode) error {
	var existing models.DBPeriode
	err := pagination.First2008(r.db, &existing, "[USERID]", func(q *gorm.DB) *gorm.DB {
		return q.Where("USERID = ?", periode.USERID)
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create
			return r.db.Create(periode).Error
		}
		return err
	}
	// Update
	return r.db.Model(&existing).Where("USERID = ?", periode.USERID).Updates(map[string]interface{}{
		"BULAN": periode.BULAN,
		"TAHUN": periode.TAHUN,
	}).Error
}
