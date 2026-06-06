package menu

import (
	"fmt"

	"gorm.io/gorm"
)

// IMenuRepository defines the persistence contract for the menu master catalogue.
// All implementations must be safe for concurrent use (GORM is by default).
type IMenuRepository interface {
	// FindPaginated returns a page of menus + the total count, optionally filtered
	// by a case-insensitive substring match on KODEMENU or Keterangan.
	FindPaginated(page, limit int, search string) ([]SDbMenu, int64, error)
	// FindParentsByLevel returns menus whose L0 equals the given level. Used to
	// populate the parent-menu dropdown on the create/edit menu form.
	FindParentsByLevel(level int) ([]SDbMenu, error)
	// FindByID fetches a single menu by its primary key (KODEMENU).
	FindByID(kodeMenu string) (*SDbMenu, error)
	// Create inserts a new menu row.
	Create(menu *SDbMenu) error
	// Update overwrites an existing menu (GORM Save).
	Update(menu *SDbMenu) error
	// Delete removes a menu by KODEMENU.
	Delete(kodeMenu string) error
}

type menuRepository struct {
	db *gorm.DB
}

// NewMenuRepository constructs the default GORM-backed menu repository.
func NewMenuRepository(db *gorm.DB) IMenuRepository {
	return &menuRepository{db: db}
}

func (r *menuRepository) FindPaginated(page, limit int, search string) ([]SDbMenu, int64, error) {
	var menus []SDbMenu
	var total int64

	query := r.db.Model(&SDbMenu{})

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("KODEMENU LIKE ? OR Keterangan LIKE ?", searchPattern, searchPattern)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("counting menus (page=%d limit=%d search=%q): %w", page, limit, search, err)
	}

	offset := (page - 1) * limit
	if err := query.Order("KODEMENU ASC").Offset(offset).Limit(limit).Find(&menus).Error; err != nil {
		return nil, 0, fmt.Errorf("finding menus (page=%d limit=%d search=%q): %w", page, limit, search, err)
	}

	return menus, total, nil
}

// FindParentsByLevel fetches menus at a specific level to act as parent dropdown options
func (r *menuRepository) FindParentsByLevel(level int) ([]SDbMenu, error) {
	var menus []SDbMenu
	if err := r.db.Where("L0 = ?", level).Order("KODEMENU ASC").Find(&menus).Error; err != nil {
		return nil, fmt.Errorf("finding parent menus at level %d: %w", level, err)
	}
	return menus, nil
}

func (r *menuRepository) FindByID(kodeMenu string) (*SDbMenu, error) {
	var menu SDbMenu
	if err := r.db.Where("KODEMENU = ?", kodeMenu).First(&menu).Error; err != nil {
		return nil, fmt.Errorf("finding menu %q: %w", kodeMenu, err)
	}
	return &menu, nil
}

func (r *menuRepository) Create(menu *SDbMenu) error {
	if err := r.db.Create(menu).Error; err != nil {
		return fmt.Errorf("creating menu %q: %w", menu.KODEMENU, err)
	}
	return nil
}

func (r *menuRepository) Update(menu *SDbMenu) error {
	// Use Save to update all fields based on primary key KODEMENU
	if err := r.db.Save(menu).Error; err != nil {
		return fmt.Errorf("updating menu %q: %w", menu.KODEMENU, err)
	}
	return nil
}

func (r *menuRepository) Delete(kodeMenu string) error {
	if err := r.db.Where("KODEMENU = ?", kodeMenu).Delete(&SDbMenu{}).Error; err != nil {
		return fmt.Errorf("deleting menu %q: %w", kodeMenu, err)
	}
	return nil
}
