// Package kasbank — repository layer for Accounting > Kas Bank.
//
// All persistence is GORM-based; the service layer is the only caller.
// Every method is safe for concurrent use (GORM is by default), and every
// call is wrapped with r.db.WithContext(ctx) so that the request context
// (and the activity-log UserID injected by InjectUserContext) propagates
// to GORM hooks/callbacks.
package kasbank

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

// IKasBankRepository is the persistence contract for the kasbank domain.
// The service layer depends on this interface, never on the concrete
// struct, so unit tests can swap in a mock.
type IKasBankRepository interface {
	// List returns a page of journal headers matching the optional filters
	// in q, plus the total count after applying those filters (pre-pagination).
	List(ctx context.Context, q SListKasBankQuery) ([]SDbTrans, int64, error)
	// GetByNoBukti fetches a single header by primary key. Returns
	// (nil, nil) if not found so the service can produce a 404.
	GetByNoBukti(ctx context.Context, noBukti string) (*SDbTrans, error)
	// InsertHeader persists a new DBTRANS row. MyID is set by the GORM
	// callback (activity log).
	InsertHeader(ctx context.Context, h *SDbTrans) error
	// UpdateHeader overwrites the header (GORM Save) by primary key NoBukti.
	UpdateHeader(ctx context.Context, h *SDbTrans) error
	// DeleteHeader removes the header and cascades to its detail rows in
	// DBTRANSAKSI. The cascade is implemented explicitly (DELETE FROM
	// DBTRANSAKSI WHERE NoBukti = ?) — there is no FK in the legacy schema.
	DeleteHeader(ctx context.Context, noBukti string) error
	// ListDetail returns all detail rows for a given NoBukti, ordered by Urut ASC.
	ListDetail(ctx context.Context, noBukti string) ([]SDbTransaksi, error)
	// GetDetail fetches a single detail row by composite PK (NoBukti, Urut).
	// Returns (nil, nil) if not found.
	GetDetail(ctx context.Context, noBukti string, urut int) (*SDbTransaksi, error)
	// InsertDetail appends a new detail row. Caller is responsible for
	// picking the Urut value (the service uses max(Urut)+1).
	InsertDetail(ctx context.Context, d *SDbTransaksi) error
	// UpdateDetail overwrites the detail row by composite PK.
	UpdateDetail(ctx context.Context, d *SDbTransaksi) error
	// DeleteDetail removes a single detail row by composite PK.
	DeleteDetail(ctx context.Context, noBukti string, urut int) error
	// SetOtorisasi sets the flag, user and timestamp for the given level.
	// level must be 1 or 2; anything else returns an error.
	SetOtorisasi(ctx context.Context, noBukti string, level int, userID string) error
	// CancelOtorisasi clears the flag, user and timestamp for the given level.
	CancelOtorisasi(ctx context.Context, noBukti string, level int) error
	// GenerateNoBukti atomically increments the per-tipe counter and returns
	// the formatted voucher number. Delegates to nomor.go.
	GenerateNoBukti(ctx context.Context, tipe string) (string, error)
	// LookupPerkiraan returns DBPERKIRAAN rows whose Perkiraan or Keterangan
	// matches the query substring. When kelompokKas is true the result is
	// restricted to Kelompok in ("1", "2") — the cash/bank groups in the
	// legacy chart-of-accounts.
	LookupPerkiraan(ctx context.Context, query string, kelompokKas bool, limit int) ([]SDbPerkiraan, error)
	// GetPeriode returns the active (bulan, tahun) for the user. Returns
	// (0, 0, nil) when the user has no DBPERIODE row.
	GetPeriode(ctx context.Context, userID string) (bulan int, tahun int, err error)
	// RecalcTotals recomputes a header's TotalD and TotalK by aggregating
	// over its DBTRANSAKSI rows. The legacy schema does not store totals;
	// we recompute on the fly when the service needs them.
	RecalcTotals(ctx context.Context, noBukti string) (totalD, totalK float64, err error)
}

// SKasBankRepository is the GORM-backed implementation of IKasBankRepository.
// The struct name keeps the S-prefix convention from the architecture
// guide; the constructor is exposed as NewSKasBankRepository.
type SKasBankRepository struct {
	db *gorm.DB
}

// NewSKasBankRepository constructs the concrete GORM repository. Caller
// passes the same *gorm.DB used by every other domain.
func NewSKasBankRepository(db *gorm.DB) *SKasBankRepository {
	return &SKasBankRepository{db: db}
}

// List applies the optional filters and returns a page of DBTRANS rows.
// Filters: tipe (exact match on TipeTransHd), search (LIKE on NoBukti and
// Note), date range (Tanggal BETWEEN). Sort: Tanggal DESC, NoBukti DESC
// (stable across pages).
func (r *SKasBankRepository) List(ctx context.Context, q SListKasBankQuery) ([]SDbTrans, int64, error) {
	var (
		items []SDbTrans
		total int64
	)
	query := r.db.WithContext(ctx).Model(&SDbTrans{})

	if q.Tipe != "" {
		query = query.Where("TipeTransHd = ?", q.Tipe)
	}
	if q.Search != "" {
		searchPattern := "%" + q.Search + "%"
		query = query.Where("NoBukti LIKE ? OR Note LIKE ?", searchPattern, searchPattern)
	}
	if q.DateFrom != "" {
		if from, err := parseDateFlexible(q.DateFrom); err == nil {
			query = query.Where("Tanggal >= ?", from)
		}
	}
	if q.DateTo != "" {
		if to, err := parseDateFlexible(q.DateTo); err == nil {
			query = query.Where("Tanggal <= ?", to)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("counting kasbank headers: %w", err)
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	perPage := q.PerPage
	if perPage < 1 {
		perPage = 10
	}
	offset := (page - 1) * perPage

	orderBy := buildOrderBy(q.SortBy, q.SortDir)
	if err := query.Order(orderBy).Offset(offset).Limit(perPage).Find(&items).Error; err != nil {
		return nil, 0, fmt.Errorf("listing kasbank headers: %w", err)
	}
	return items, total, nil
}

// GetByNoBukti fetches a single header. Returns (nil, nil) when missing so
// the service can map that to a 404 without leaking GORM's error type.
func (r *SKasBankRepository) GetByNoBukti(ctx context.Context, noBukti string) (*SDbTrans, error) {
	var h SDbTrans
	err := r.db.WithContext(ctx).Where("NoBukti = ?", noBukti).First(&h).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("fetching kasbank header %q: %w", noBukti, err)
	}
	return &h, nil
}

// InsertHeader creates a new DBTRANS row. MyID is set by the GORM
// BeforeCreate hook from the request context's userID.
func (r *SKasBankRepository) InsertHeader(ctx context.Context, h *SDbTrans) error {
	if err := r.db.WithContext(ctx).Create(h).Error; err != nil {
		return fmt.Errorf("inserting kasbank header %q: %w", h.NoBukti, err)
	}
	return nil
}

// UpdateHeader overwrites the header using GORM Save (all columns by PK).
func (r *SKasBankRepository) UpdateHeader(ctx context.Context, h *SDbTrans) error {
	if err := r.db.WithContext(ctx).Save(h).Error; err != nil {
		return fmt.Errorf("updating kasbank header %q: %w", h.NoBukti, err)
	}
	return nil
}

// DeleteHeader removes the header and its detail rows in a single transaction.
// The legacy schema has no FK, so we have to cascade explicitly.
func (r *SKasBankRepository) DeleteHeader(ctx context.Context, noBukti string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("NoBukti = ?", noBukti).Delete(&SDbTransaksi{}).Error; err != nil {
			return fmt.Errorf("cascading delete of details for %q: %w", noBukti, err)
		}
		if err := tx.Where("NoBukti = ?", noBukti).Delete(&SDbTrans{}).Error; err != nil {
			return fmt.Errorf("deleting kasbank header %q: %w", noBukti, err)
		}
		return nil
	})
}

// ListDetail returns all detail rows for a NoBukti, ordered by Urut ASC
// so the UI can render them without re-sorting.
func (r *SKasBankRepository) ListDetail(ctx context.Context, noBukti string) ([]SDbTransaksi, error) {
	var items []SDbTransaksi
	if err := r.db.WithContext(ctx).Where("NoBukti = ?", noBukti).Order("Urut ASC").Find(&items).Error; err != nil {
		return nil, fmt.Errorf("listing kasbank details for %q: %w", noBukti, err)
	}
	return items, nil
}

// GetDetail fetches a single detail row by composite PK.
func (r *SKasBankRepository) GetDetail(ctx context.Context, noBukti string, urut int) (*SDbTransaksi, error) {
	var d SDbTransaksi
	err := r.db.WithContext(ctx).Where("NoBukti = ? AND Urut = ?", noBukti, urut).First(&d).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("fetching kasbank detail (%q, %d): %w", noBukti, urut, err)
	}
	return &d, nil
}

// InsertDetail appends a new detail row.
func (r *SKasBankRepository) InsertDetail(ctx context.Context, d *SDbTransaksi) error {
	if err := r.db.WithContext(ctx).Create(d).Error; err != nil {
		return fmt.Errorf("inserting kasbank detail (%q, %d): %w", d.NoBukti, d.Urut, err)
	}
	return nil
}

// UpdateDetail overwrites a single detail row by composite PK.
func (r *SKasBankRepository) UpdateDetail(ctx context.Context, d *SDbTransaksi) error {
	if err := r.db.WithContext(ctx).Save(d).Error; err != nil {
		return fmt.Errorf("updating kasbank detail (%q, %d): %w", d.NoBukti, d.Urut, err)
	}
	return nil
}

// DeleteDetail removes a single detail row.
func (r *SKasBankRepository) DeleteDetail(ctx context.Context, noBukti string, urut int) error {
	if err := r.db.WithContext(ctx).Where("NoBukti = ? AND Urut = ?", noBukti, urut).Delete(&SDbTransaksi{}).Error; err != nil {
		return fmt.Errorf("deleting kasbank detail (%q, %d): %w", noBukti, urut, err)
	}
	return nil
}

// SetOtorisasi sets the IsOtorisasiN flag to 1, OtoUserN to the caller,
// and TglOtoN to now(). We use raw SQL because the column names contain
// the level suffix, which GORM's struct mapping cannot express in a loop.
func (r *SKasBankRepository) SetOtorisasi(ctx context.Context, noBukti string, level int, userID string) error {
	if level < 1 || level > 2 {
		return fmt.Errorf("set otorisasi: invalid level %d (expected 1 or 2)", level)
	}
	col := fmt.Sprintf("IsOtorisasi%d", level)
	userCol := fmt.Sprintf("OtoUser%d", level)
	tglCol := fmt.Sprintf("TglOto%d", level)
	sql := fmt.Sprintf(
		"UPDATE DBTRANS SET %s = 1, %s = ?, %s = ? WHERE NoBukti = ?",
		col, userCol, tglCol,
	)
	if err := r.db.WithContext(ctx).Exec(sql, userID, time.Now(), noBukti).Error; err != nil {
		return fmt.Errorf("setting otorisasi level %d for %q: %w", level, noBukti, err)
	}
	return nil
}

// CancelOtorisasi clears the flag, user and timestamp for the given level.
func (r *SKasBankRepository) CancelOtorisasi(ctx context.Context, noBukti string, level int) error {
	if level < 1 || level > 2 {
		return fmt.Errorf("cancel otorisasi: invalid level %d (expected 1 or 2)", level)
	}
	col := fmt.Sprintf("IsOtorisasi%d", level)
	userCol := fmt.Sprintf("OtoUser%d", level)
	tglCol := fmt.Sprintf("TglOto%d", level)
	sql := fmt.Sprintf(
		"UPDATE DBTRANS SET %s = 0, %s = '', %s = NULL WHERE NoBukti = ?",
		col, userCol, tglCol,
	)
	if err := r.db.WithContext(ctx).Exec(sql, noBukti).Error; err != nil {
		return fmt.Errorf("cancelling otorisasi level %d for %q: %w", level, noBukti, err)
	}
	return nil
}

// GenerateNoBukti delegates to the helper in nomor.go, wrapping the
// single-row increment in its own short transaction.
func (r *SKasBankRepository) GenerateNoBukti(ctx context.Context, tipe string) (string, error) {
	var generated string
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		v, errGen := GenerateNoBukti(tx, tipe)
		if errGen != nil {
			return errGen
		}
		generated = v
		return nil
	})
	if err != nil {
		return "", err
	}
	return generated, nil
}

// LookupPerkiraan returns DBPERKIRAAN rows matching the substring search.
// When kelompokKas is true the result is restricted to Kelompok in ("1", "2")
// — the cash/bank groups in the legacy chart-of-accounts. limit caps the
// result count; 0 means "no cap" (we use 50 as a sane default).
func (r *SKasBankRepository) LookupPerkiraan(ctx context.Context, query string, kelompokKas bool, limit int) ([]SDbPerkiraan, error) {
	q := r.db.WithContext(ctx).Model(&SDbPerkiraan{})
	if query != "" {
		pattern := "%" + query + "%"
		q = q.Where("Perkiraan LIKE ? OR Keterangan LIKE ?", pattern, pattern)
	}
	if kelompokKas {
		q = q.Where("Kelompok IN ?", []string{"1", "2"})
	}
	if limit <= 0 {
		limit = 50
	}
	var rows []SDbPerkiraan
	if err := q.Order("Perkiraan ASC").Limit(limit).Find(&rows).Error; err != nil {
		return nil, fmt.Errorf("looking up perkiraan (query=%q, kelompokKas=%v): %w", query, kelompokKas, err)
	}
	return rows, nil
}

// GetPeriode returns the active accounting period for the user. The
// service layer is the only consumer.
func (r *SKasBankRepository) GetPeriode(ctx context.Context, userID string) (int, int, error) {
	return GetCurrentPeriode(ctx, r.db, userID)
}

// RecalcTotals aggregates Debet and Kredit across DBTRANSAKSI for the
// given NoBukti. The legacy schema does not store totals; we recompute
// on the fly when the service needs them (after detail mutations).
func (r *SKasBankRepository) RecalcTotals(ctx context.Context, noBukti string) (float64, float64, error) {
	type totals struct {
		TotalD float64
		TotalK float64
	}
	var t totals
	err := r.db.WithContext(ctx).Raw(
		"SELECT COALESCE(SUM(Debet), 0) AS TotalD, COALESCE(SUM(Kredit), 0) AS TotalK FROM DBTRANSAKSI WHERE NoBukti = ?",
		noBukti,
	).Scan(&t).Error
	if err != nil {
		return 0, 0, fmt.Errorf("recalculating totals for %q: %w", noBukti, err)
	}
	return t.TotalD, t.TotalK, nil
}

// parseDateFlexible accepts either RFC3339 ("2026-06-07T00:00:00Z") or
// the YYYY-MM-DD form the frontend prefers. Returns time.UTC midnight.
func parseDateFlexible(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, fmt.Errorf("empty date")
	}
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t, nil
	}
	return time.Time{}, fmt.Errorf("unrecognised date format: %q", s)
}

// buildOrderBy returns a safe ORDER BY clause built from a whitelist of
// sortable columns. Anything outside the whitelist falls back to the
// default "Tanggal DESC, NoBukti DESC" so a malicious query string cannot
// inject SQL.
func buildOrderBy(sortBy, sortDir string) string {
	allowed := map[string]bool{
		"Tanggal":     true,
		"NoBukti":     true,
		"TipeTransHd": true,
		"Note":        true,
	}
	col := "Tanggal"
	if allowed[sortBy] {
		col = sortBy
	}
	dir := "DESC"
	if strings.EqualFold(sortDir, "asc") {
		dir = "ASC"
	}
	return fmt.Sprintf("%s %s, NoBukti DESC", col, dir)
}
