package menu

import (
	"errors"

	"github.com/masza1/dapen-backend/internal/models"
	"github.com/masza1/dapen-backend/internal/repositories"
	"github.com/masza1/dapen-backend/internal/shared/response"
)

type IMenuService interface {
	GetPaginatedMenus(page, limit int, search string) (*response.SPaginatedResponse, error)
	GetParentMenus(level int) ([]models.SDbMenu, error)
	GetMenuByID(kodeMenu string) (*models.SDbMenu, error)
	CreateMenu(menu *models.SDbMenu) error
	UpdateMenu(kodeMenu string, menu *models.SDbMenu) error
	DeleteMenu(kodeMenu string) error
}

type menuService struct {
	repo repositories.IMenuRepository
}

func NewMenuService(repo repositories.IMenuRepository) IMenuService {
	return &menuService{repo: repo}
}

func (s *menuService) GetPaginatedMenus(page, limit int, search string) (*response.SPaginatedResponse, error) {
	menus, total, err := s.repo.FindPaginated(page, limit, search)
	if err != nil {
		return nil, err
	}
	return response.NewPaginatedResponse(menus, total, page, limit), nil
}

func (s *menuService) GetParentMenus(level int) ([]models.SDbMenu, error) {
	if level <= 0 {
		return nil, errors.New("level must be greater than 0 to have parents")
	}
	return s.repo.FindParentsByLevel(level - 1)
}

func (s *menuService) GetMenuByID(kodeMenu string) (*models.SDbMenu, error) {
	return s.repo.FindByID(kodeMenu)
}

func (s *menuService) CreateMenu(menu *models.SDbMenu) error {
	// Add business logic/validation here if needed
	if menu.KODEMENU == "" {
		return errors.New("kode menu is required")
	}
	
	// Check if already exists
	existing, _ := s.repo.FindByID(menu.KODEMENU)
	if existing != nil {
		return errors.New("menu with this kode already exists")
	}

	return s.repo.Create(menu)
}

func (s *menuService) UpdateMenu(kodeMenu string, req *models.SDbMenu) error {
	existing, err := s.repo.FindByID(kodeMenu)
	if err != nil {
		return errors.New("menu not found")
	}

	// Update fields
	existing.Keterangan = req.Keterangan
	existing.L0 = req.L0
	existing.ACCESS = req.ACCESS
	existing.OL = req.OL
	existing.TipeTrans = req.TipeTrans
	existing.Routename = req.Routename
	existing.Icon = req.Icon
	existing.PlatformMask = req.PlatformMask

	return s.repo.Update(existing)
}

func (s *menuService) DeleteMenu(kodeMenu string) error {
	_, err := s.repo.FindByID(kodeMenu)
	if err != nil {
		return errors.New("menu not found")
	}
	return s.repo.Delete(kodeMenu)
}
