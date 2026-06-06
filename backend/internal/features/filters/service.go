package filters

import (
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	)

// IFilterService is the business-logic entry point for the shared filter
// widgets (customers, perkiraan, kelompok kas). Each method applies default
// pagination clamps before delegating to the repository.
type IFilterService interface {
	// GetCustomers returns a paginated list of DBCUSTSUPP rows filtered by
	// customer type (legacy JENIS column).
	GetCustomers(customerType int, search string, page int, limit int) ([]models.SDbCustSupp, int64, error)
	// GetPerkiraan returns perkiraan rows matching the search, optionally
	// excluding one code (withoutUserAccess) and/or scoped to post-hutang-piut.
	GetPerkiraan(search string, withoutUserAccess string, onlyPostHutPiut string) ([]models.SDbPerkiraan, error)
	// GetKelompokKas returns perkiraan rows joined to DBPOSTHUTPIUT for the
	// given account type (defaults to "KAS" if empty).
	GetKelompokKas(accountType string, search string) ([]models.SDbPerkiraan, error)
}

type filterService struct {
	repo IFilterRepository
}

// NewFilterService constructs the default filter service.
func NewFilterService(repo IFilterRepository) IFilterService {
	return &filterService{repo: repo}
}

func (s *filterService) GetCustomers(customerType int, search string, page int, limit int) ([]models.SDbCustSupp, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10 // Default limit
	}
	offset := (page - 1) * limit
	return s.repo.GetCustomers(customerType, search, offset, limit)
}

func (s *filterService) GetPerkiraan(search string, withoutUserAccess string, onlyPostHutPiut string) ([]models.SDbPerkiraan, error) {
	return s.repo.GetPerkiraan(search, withoutUserAccess, onlyPostHutPiut)
}

func (s *filterService) GetKelompokKas(accountType string, search string) ([]models.SDbPerkiraan, error) {
	if accountType == "" {
		accountType = "KAS"
	}
	return s.repo.GetKelompokKas(accountType, search)
}
