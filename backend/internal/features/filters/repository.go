package filters

import (
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"gorm.io/gorm"
)

type IFilterRepository interface {
	GetCustomers(customerType int, search string, offset int, limit int) ([]models.SDbCustSupp, int64, error)
	GetPerkiraan(search string, withoutUserAccess string, onlyPostHutPiut string) ([]models.SDbPerkiraan, error)
	GetKelompokKas(accountType string, search string) ([]models.SDbPerkiraan, error)
}

type filterRepository struct {
	db *gorm.DB
}

func NewFilterRepository(db *gorm.DB) IFilterRepository {
	return &filterRepository{db: db}
}

func (r *filterRepository) GetCustomers(customerType int, search string, offset int, limit int) ([]models.SDbCustSupp, int64, error) {
	var customers []models.SDbCustSupp
	var total int64

	query := r.db.Model(&models.SDbCustSupp{}).Where("JENIS = ?", customerType)

	if search != "" {
		searchParam := "%" + search + "%"
		query = query.Where("KODECUSTSUPP LIKE ? OR NAMACUSTSUPP LIKE ?", searchParam, searchParam)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = query.Offset(offset).Limit(limit).Find(&customers).Error
	return customers, total, err
}

func (r *filterRepository) GetPerkiraan(search string, withoutUserAccess string, onlyPostHutPiut string) ([]models.SDbPerkiraan, error) {
	var results []models.SDbPerkiraan

	query := r.db.Model(&models.SDbPerkiraan{}).Where("Tipe = ?", 1)

	if search != "" {
		searchParam := "%" + search + "%"
		query = query.Where("Keterangan LIKE ? OR Perkiraan LIKE ?", searchParam, searchParam)
	}

	if withoutUserAccess != "" {
		query = query.Where("Perkiraan != ?", withoutUserAccess)
	}

	if onlyPostHutPiut != "" {
		query = query.Preload("KelompokKas")
	}

	err := query.Find(&results).Error
	return results, err
}

func (r *filterRepository) GetKelompokKas(accountType string, search string) ([]models.SDbPerkiraan, error) {
	var results []models.SDbPerkiraan

	query := r.db.Model(&models.SDbPerkiraan{}).
		Joins("JOIN DBPOSTHUTPIUT pht ON pht.Perkiraan = DBPERKIRAAN.Perkiraan").
		Where("pht.Kode = ?", accountType)

	if search != "" {
		query = query.Where("DBPERKIRAAN.Keterangan LIKE ?", "%"+search+"%")
	}

	err := query.Find(&results).Error
	return results, err
}
