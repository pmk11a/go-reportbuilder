package services

import (
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/internal/legacy/repositories"
)

type IPeriodeService interface {
	GetPeriode(userID string) (*models.DBPeriode, error)
	SetPeriode(userID, bulan, tahun string) error
}

type SPeriodeService struct {
	repo repositories.IPeriodeRepository
}

func NewPeriodeService(repo repositories.IPeriodeRepository) IPeriodeService {
	return &SPeriodeService{repo: repo}
}

func (s *SPeriodeService) GetPeriode(userID string) (*models.DBPeriode, error) {
	periode, err := s.repo.GetPeriodeByUserID(userID)
	if err != nil {
		return nil, err
	}
	if periode == nil {
		return &models.DBPeriode{USERID: userID}, nil // firstOrNew equivalent
	}
	return periode, nil
}

func (s *SPeriodeService) SetPeriode(userID, bulan, tahun string) error {
	periode := &models.DBPeriode{
		USERID: userID,
		BULAN:  bulan,
		TAHUN:  tahun,
	}
	return s.repo.UpsertPeriode(periode)
}
