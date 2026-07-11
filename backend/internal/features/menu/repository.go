package menu

import (
	"context"
	"fmt"
	"strings"

	"github.com/masza1/dapen-backend/internal/shared/pagination"
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
	Create(ctx context.Context, menu *SDbMenu) error
	// Update overwrites an existing menu (GORM Save).
	Update(ctx context.Context, menu *SDbMenu) error
	// Delete removes a menu by KODEMENU.
	Delete(ctx context.Context, kodeMenu string) error
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

	// SQL Server 2008-compatible path: build baseSQL + args, then delegate to
	// pagination.PaginatedFind which wraps a ROW_NUMBER() CTE and avoids
	// OFFSET ... FETCH NEXT (SQL Server 2012+).
	//
	// Placeholders use `?` (GORM's portable binding syntax) rather than
	// the SQL Server native `@pN` form. The latter conflicts with how
	// mssql binds through `db.Raw` — the driver rewrites them in
	// ways that produce "@p1 not declared" errors during paginated
	// count queries. The `?` placeholder is what the working
	// kasbank/filters repositories use.
	baseSQL := "SELECT * FROM dbmenu"
	var args []any
	if search != "" {
		// SQL Server: default collation is case-insensitive (e.g.
		// SQL_Latin1_General_CP1_CI_AS) so LIKE matches both
		// "brows" and "Browse". We still uppercase the pattern so
		// logs and query plans are stable across DBs.
		searchPattern := "%" + strings.ToUpper(strings.TrimSpace(search)) + "%"
		baseSQL += " WHERE (KODEMENU LIKE ? OR Keterangan LIKE ?)"
		args = append(args, searchPattern, searchPattern)
	}

	total, err := pagination.PaginatedFind(r.db, &menus, baseSQL, "[KODEMENU] ASC", page, limit, args...)
	if err != nil {
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
	if err := pagination.First2008(r.db, &menu, "[KODEMENU]", func(q *gorm.DB) *gorm.DB {
		return q.Where("KODEMENU = ?", kodeMenu)
	}); err != nil {
		return nil, fmt.Errorf("finding menu %q: %w", kodeMenu, err)
	}
	return &menu, nil
}

func (r *menuRepository) Create(ctx context.Context, menu *SDbMenu) error {
	if err := r.db.WithContext(ctx).Create(menu).Error; err != nil {
		return fmt.Errorf("creating menu %q: %w", menu.KODEMENU, err)
	}
	return nil
}

func (r *menuRepository) Update(ctx context.Context, menu *SDbMenu) error {
	// Use Save to update all fields based on primary key KODEMENU
	// WithContext passes the context (containing UserID) to GORM hooks/callbacks
	if err := r.db.WithContext(ctx).Save(menu).Error; err != nil {
		return fmt.Errorf("updating menu %q: %w", menu.KODEMENU, err)
	}
	return nil
}

func (r *menuRepository) Delete(ctx context.Context, kodeMenu string) error {
	if err := r.db.WithContext(ctx).Where("KODEMENU = ?", kodeMenu).Delete(&SDbMenu{}).Error; err != nil {
		return fmt.Errorf("deleting menu %q: %w", kodeMenu, err)
	}
	return nil
}
