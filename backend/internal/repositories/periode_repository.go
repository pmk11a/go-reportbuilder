package repositories

import (
	"github.com/masza1/dapen-backend/internal/models"
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
	err := r.db.Where("USERID = ?", userID).First(&periode).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // Return nil if not found, it's not a fatal error
		}
		return nil, err
	}
	return &periode, nil
}

func (r *SPeriodeRepository) UpsertPeriode(periode *models.DBPeriode) error {
	var existing models.DBPeriode
	err := r.db.Where("USERID = ?", periode.USERID).First(&existing).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
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
