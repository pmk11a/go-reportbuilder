package repositories

import (
	"github.com/masza1/dapen-backend/internal/models"
	"gorm.io/gorm"
)

type IMenuRepository interface {
	FindPaginated(page, limit int, search string) ([]models.SDbMenu, int64, error)
	FindParentsByLevel(level int) ([]models.SDbMenu, error)
	FindByID(kodeMenu string) (*models.SDbMenu, error)
	Create(menu *models.SDbMenu) error
	Update(menu *models.SDbMenu) error
	Delete(kodeMenu string) error
}

type menuRepository struct {
	db *gorm.DB
}

func NewMenuRepository(db *gorm.DB) IMenuRepository {
	return &menuRepository{db: db}
}

func (r *menuRepository) FindPaginated(page, limit int, search string) ([]models.SDbMenu, int64, error) {
	var menus []models.SDbMenu
	var total int64

	query := r.db.Model(&models.SDbMenu{})

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("KODEMENU LIKE ? OR Keterangan LIKE ?", searchPattern, searchPattern)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Order("KODEMENU ASC").Offset(offset).Limit(limit).Find(&menus).Error; err != nil {
		return nil, 0, err
	}

	return menus, total, nil
}

// FindParentsByLevel fetches menus at a specific level to act as parent dropdown options
func (r *menuRepository) FindParentsByLevel(level int) ([]models.SDbMenu, error) {
	var menus []models.SDbMenu
	if err := r.db.Where("L0 = ?", level).Order("KODEMENU ASC").Find(&menus).Error; err != nil {
		return nil, err
	}
	return menus, nil
}

func (r *menuRepository) FindByID(kodeMenu string) (*models.SDbMenu, error) {
	var menu models.SDbMenu
	if err := r.db.Where("KODEMENU = ?", kodeMenu).First(&menu).Error; err != nil {
		return nil, err
	}
	return &menu, nil
}

func (r *menuRepository) Create(menu *models.SDbMenu) error {
	return r.db.Create(menu).Error
}

func (r *menuRepository) Update(menu *models.SDbMenu) error {
	// Use Save to update all fields based on primary key KODEMENU
	return r.db.Save(menu).Error
}

func (r *menuRepository) Delete(kodeMenu string) error {
	return r.db.Where("KODEMENU = ?", kodeMenu).Delete(&models.SDbMenu{}).Error
}
