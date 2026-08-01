package filters

import (
	"github.com/masza1/dapen-backend/internal/infrastructure/persistence/models"
	"github.com/masza1/dapen-backend/internal/shared/pagination"
	"gorm.io/gorm"
	"strings"
)

type IFilterRepository interface {
	GetCustomers(customerType int, search string, offset int, limit int) ([]models.SDbCustSupp, int64, error)
	GetPerkiraan(search string, withoutUserAccess string, onlyPostHutPiut string) ([]models.SDbPerkiraan, error)
	// GetKelompokKas returns perkiraan rows belonging to one or more DBPOSTHUTPIUT
	// categories (e.g. "KAS", "BANK"). Pass accountTypes as a slice — any length 1+.
	// Empty slice falls back to []string{"KAS"} for backward-compatibility.
	GetKelompokKas(accountTypes []string, search string) ([]models.SDbPerkiraan, error)
}

type filterRepository struct {
	db *gorm.DB
}

func NewFilterRepository(db *gorm.DB) IFilterRepository {
	return &filterRepository{db: db}
}

func (r *filterRepository) GetCustomers(customerType int, search string, offset int, limit int) ([]models.SDbCustSupp, int64, error) {
	// SQL Server 2008-compatible path: build baseSQL + args, then delegate to
	// pagination.PaginatedFind which wraps a ROW_NUMBER() CTE. GORM's chained
	// builder emits OFFSET ... FETCH NEXT on SQL Server 2012+, which fails on
	// the legacy 2008 R2 backend.
	var customers []models.SDbCustSupp

	baseSQL := "SELECT * FROM DBCUSTSUPP WHERE JENIS = ?"
	args := []any{customerType}
	if search != "" {
		searchParam := "%" + strings.ToUpper(search) + "%"
		// Search by KODECUSTSUPP and NAMACUSTSUPP (code and name)
		baseSQL += " AND (UPPER(KODECUSTSUPP) LIKE ? OR UPPER(NAMACUSTSUPP) LIKE ?)"
		args = append(args, searchParam, searchParam)
	}

	// Convert offset/limit to 1-based page for PaginatedFind.
	page := 1
	if limit > 0 && offset >= 0 {
		page = (offset / limit) + 1
	}

	total, err := pagination.PaginatedFind(r.db, &customers, baseSQL, "[KODECUSTSUPP] ASC", page, limit, args...)
	if err != nil {
		return nil, 0, err
	}
	return customers, total, nil
}

func (r *filterRepository) GetPerkiraan(search string, withoutUserAccess string, onlyPostHutPiut string) ([]models.SDbPerkiraan, error) {
	var results []models.SDbPerkiraan

	// We SELECT explicitly rather than `SELECT *` so that columns with
	// legacy empty-string values (e.g. FlagCashFlow stored as '' in some
	// rows) never reach GORM's scanner as a string into a Go `int` field.
	// COALESCE returns 0 for NULL/empty values, which scans cleanly.
	query := r.db.Model(&models.SDbPerkiraan{}).
		Select(`[Perkiraan], [Kelompok], [Tipe], [DK], [Valas], [KodeAK], [KodeSAK],
			[Keterangan], [Simbol],
			CAST(COALESCE(NULLIF(CAST([FlagCashFlow] AS VARCHAR(50)), ''), '0') AS INT) AS FlagCashFlow,
			[Neraca],
			CAST(COALESCE(NULLIF(CAST([IsPPN] AS VARCHAR(50)), ''), '0') AS INT) AS IsPPN,
			[GroupPerkiraan], [Lokasi], [MyID]`).
		Where("Tipe = ?", 1)

	if search != "" {
		searchParam := "%" + search + "%"
		query = query.Where("Keterangan LIKE ? OR Perkiraan LIKE ?", searchParam, searchParam)
	}

	if withoutUserAccess != "" {
		query = query.Where("Perkiraan != ?", withoutUserAccess)
	}

	if err := query.Find(&results).Error; err != nil {
		return nil, err
	}

	// Manual 2-step fetch for the KelompokKas relation when requested.
	// GORM's .Preload("KelompokKas") may inject LIMIT/OFFSET into the IN-subquery
	// under SQL Server 2012+ dialect, which fails on the legacy 2008 R2 backend.
	if onlyPostHutPiut != "" && len(results) > 0 {
		perkiraanIDs := make([]string, len(results))
		for i, item := range results {
			perkiraanIDs[i] = item.Perkiraan
		}
		var kasList []models.SDbPostHutPiut
		if err := r.db.Where("Perkiraan IN ?", perkiraanIDs).Find(&kasList).Error; err != nil {
			return nil, err
		}
		kasByPerkiraan := make(map[string]*models.SDbPostHutPiut, len(kasList))
		for i := range kasList {
			kasByPerkiraan[kasList[i].Perkiraan] = &kasList[i]
		}
		for i := range results {
			results[i].KelompokKas = kasByPerkiraan[results[i].Perkiraan]
		}
	}

	return results, nil
}

func (r *filterRepository) GetKelompokKas(accountTypes []string, search string) ([]models.SDbPerkiraan, error) {
	var results []models.SDbPerkiraan

	// Backward-compatibility: empty slice falls back to KAS.
	if len(accountTypes) == 0 {
		accountTypes = []string{"KAS"}
	}

	// Explicit column list with COALESCE on the int-typed legacy columns
	// (FlagCashFlow, IsPPN) so empty-string values don't blow up the scanner.
	// See GetPerkiraan above for the rationale.
	query := r.db.Model(&models.SDbPerkiraan{}).
		Select(`[Perkiraan], [Kelompok], [Tipe], [DK], [Valas], [KodeAK], [KodeSAK],
			[Keterangan], [Simbol],
			CAST(COALESCE(NULLIF(CAST([FlagCashFlow] AS VARCHAR(50)), ''), '0') AS INT) AS FlagCashFlow,
			[Neraca],
			CAST(COALESCE(NULLIF(CAST([IsPPN] AS VARCHAR(50)), ''), '0') AS INT) AS IsPPN,
			[GroupPerkiraan], [Lokasi], [MyID]`).
		Joins("JOIN DBPOSTHUTPIUT pht ON pht.Perkiraan = DBPERKIRAAN.Perkiraan").
		Where("pht.Kode IN ?", accountTypes)

	if search != "" {
		query = query.Where("DBPERKIRAAN.Keterangan LIKE ?", "%"+search+"%")
	}

	err := query.Find(&results).Error
	return results, err
}
