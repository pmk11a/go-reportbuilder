package filters

import (
	"github.com/masza1/dapen-backend/internal/models"
	"gorm.io/gorm"
)

type IFilterRepository interface {
	GetCustomers(jenis int, search string, offset int, limit int) ([]models.SDbCustSupp, int64, error)
	GetPerkiraan(search string, without string, postHutPiut string) ([]models.SDbPerkiraan, error)
	GetKelompokKas(tipe string, search string) ([]models.SDbPerkiraan, error)
}

type filterRepository struct {
	db *gorm.DB
}

func NewFilterRepository(db *gorm.DB) IFilterRepository {
	return &filterRepository{db: db}
}

func (r *filterRepository) GetCustomers(jenis int, search string, offset int, limit int) ([]models.SDbCustSupp, int64, error) {
	var customers []models.SDbCustSupp
	var total int64

	query := r.db.Model(&models.SDbCustSupp{}).Where("JENIS = ?", jenis)

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

func (r *filterRepository) GetPerkiraan(search string, without string, postHutPiut string) ([]models.SDbPerkiraan, error) {
	var results []models.SDbPerkiraan

	query := r.db.Model(&models.SDbPerkiraan{}).Where("Tipe = ?", 1)

	if search != "" {
		searchParam := "%" + search + "%"
		query = query.Where("Keterangan LIKE ? OR Perkiraan LIKE ?", searchParam, searchParam)
	}

	if without != "" {
		query = query.Where("Perkiraan != ?", without)
	}

	if postHutPiut != "" {
		query = query.Preload("KelompokKas")
	}

	err := query.Find(&results).Error
	return results, err
}

func (r *filterRepository) GetKelompokKas(tipe string, search string) ([]models.SDbPerkiraan, error) {
	var results []models.SDbPerkiraan

	query := r.db.Model(&models.SDbPerkiraan{}).
		Joins("JOIN DBPOSTHUTPIUT pht ON pht.Perkiraan = DBPERKIRAAN.Perkiraan").
		Where("pht.Kode = ?", tipe)

	if search != "" {
		query = query.Where("DBPERKIRAAN.Keterangan LIKE ?", "%"+search+"%")
	}

	err := query.Find(&results).Error
	return results, err
}
