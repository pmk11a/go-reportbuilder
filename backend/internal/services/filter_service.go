package services

import (
	"github.com/masza1/dapen-backend/internal/models"
	"github.com/masza1/dapen-backend/internal/repositories"
)

type IFilterService interface {
	GetCustomers(jenis int, search string, page int, limit int) ([]models.SDbCustSupp, int64, error)
	GetPerkiraan(search string, without string, postHutPiut string) ([]models.SDbPerkiraan, error)
	GetKelompokKas(tipe string, search string) ([]models.SDbPerkiraan, error)
}

type filterService struct {
	repo repositories.IFilterRepository
}

func NewFilterService(repo repositories.IFilterRepository) IFilterService {
	return &filterService{repo: repo}
}

func (s *filterService) GetCustomers(jenis int, search string, page int, limit int) ([]models.SDbCustSupp, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10 // Default limit
	}
	offset := (page - 1) * limit
	return s.repo.GetCustomers(jenis, search, offset, limit)
}

func (s *filterService) GetPerkiraan(search string, without string, postHutPiut string) ([]models.SDbPerkiraan, error) {
	return s.repo.GetPerkiraan(search, without, postHutPiut)
}

func (s *filterService) GetKelompokKas(tipe string, search string) ([]models.SDbPerkiraan, error) {
	if tipe == "" {
		tipe = "KAS"
	}
	return s.repo.GetKelompokKas(tipe, search)
}
