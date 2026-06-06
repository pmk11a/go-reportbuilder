package menu

import (
	"context"
	"errors"

	"github.com/masza1/dapen-backend/internal/infrastructure/response"
)

// IMenuService is the business-logic entry point for menu CRUD + sidebar
// derivation. Handlers depend on this interface.
type IMenuService interface {
	// GetPaginatedMenus returns a paginated list of menus + total count.
	GetPaginatedMenus(page, limit int, search string) (*response.SPaginatedResponse, error)
	// GetParentMenus returns candidate parents at a given hierarchy level.
	// The level argument is the requested level; the repository is queried
	// with level-1 to find menus that CAN be parents of items at `level`.
	GetParentMenus(level int) ([]SDbMenu, error)
	// GetMenuByID fetches a single menu by KODEMENU.
	GetMenuByID(kodeMenu string) (*SDbMenu, error)
	// CreateMenu validates (non-empty KODEMENU, no duplicate) and persists.
	CreateMenu(ctx context.Context, menu *SDbMenu) error
	// UpdateMenu overwrites an existing menu by KODEMENU.
	UpdateMenu(ctx context.Context, kodeMenu string, menu *SDbMenu) error
	// DeleteMenu removes a menu by KODEMENU.
	DeleteMenu(ctx context.Context, kodeMenu string) error
}

type menuService struct {
	repo IMenuRepository
}

// NewMenuService constructs the default menu service.
func NewMenuService(repo IMenuRepository) IMenuService {
	return &menuService{repo: repo}
}

func (s *menuService) GetPaginatedMenus(page, limit int, search string) (*response.SPaginatedResponse, error) {
	menus, total, err := s.repo.FindPaginated(page, limit, search)
	if err != nil {
		return nil, err
	}
	return response.NewPaginatedResponse(menus, total, page, limit), nil
}

func (s *menuService) GetParentMenus(level int) ([]SDbMenu, error) {
	if level <= 0 {
		return nil, errors.New("level must be greater than 0 to have parents")
	}
	return s.repo.FindParentsByLevel(level - 1)
}

func (s *menuService) GetMenuByID(kodeMenu string) (*SDbMenu, error) {
	return s.repo.FindByID(kodeMenu)
}

func (s *menuService) CreateMenu(ctx context.Context, menu *SDbMenu) error {
	// KODEMENU is the primary key; an empty value would crash GORM at INSERT time.
	if menu.KODEMENU == "" {
		return errors.New("kode menu is required")
	}

	// Reject duplicates so callers get a meaningful 400 instead of a GORM PK violation.
	existing, _ := s.repo.FindByID(menu.KODEMENU)
	if existing != nil {
		return errors.New("menu with this kode already exists")
	}

	return s.repo.Create(ctx, menu)
}

func (s *menuService) UpdateMenu(ctx context.Context, kodeMenu string, req *SDbMenu) error {
	existing, err := s.repo.FindByID(kodeMenu)
	if err != nil {
		return errors.New("menu not found")
	}

	existing.Keterangan = req.Keterangan
	existing.L0 = req.L0
	existing.ACCESS = req.ACCESS
	existing.OL = req.OL
	existing.TipeTrans = req.TipeTrans
	existing.Routename = req.Routename
	existing.Icon = req.Icon
	existing.PlatformMask = req.PlatformMask

	return s.repo.Update(ctx, existing)
}

func (s *menuService) DeleteMenu(ctx context.Context, kodeMenu string) error {
	_, err := s.repo.FindByID(kodeMenu)
	if err != nil {
		return errors.New("menu not found")
	}
	return s.repo.Delete(ctx, kodeMenu)
}
